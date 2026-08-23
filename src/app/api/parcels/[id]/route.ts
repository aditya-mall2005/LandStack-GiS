/**
 * GET /api/parcels/[id]
 * Redirects to / returns the full Land 360° record by parcel_id (UUID) or ULPIN
 */

import { NextRequest, NextResponse } from "next/server";
import { withClient } from "@/lib/db";
import { evaluateRules } from "@/lib/rules-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    return await withClient(async (client) => {
      // 1. Parcel Lookup by UUID or ULPIN
      const parcelRes = await client.query(
        `SELECT parcel_id, ulpin, survey_number, area, area_unit, land_type,
                state_code, district_code, subdistrict_code, village_code,
                source_system, created_at,
                ST_AsGeoJSON(geom)::json AS geometry,
                ST_X(ST_Centroid(geom)) AS centroid_lng,
                ST_Y(ST_Centroid(geom)) AS centroid_lat
         FROM gis.parcels 
         WHERE parcel_id::text = $1 OR ulpin = $1 OR survey_number = $1 OR survey_number = REPLACE($1, 'P-', '')
         LIMIT 1`,
        [id]
      );

      if (parcelRes.rows.length === 0) {
        return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
      }
      const parcel = parcelRes.rows[0];
      const parcelUuid = parcel.parcel_id;

      // Sequential queries on single client (fast and connection-safe)
      const identifiers = await client.query(`SELECT identifier_type, identifier_value, is_primary FROM gis.parcel_identifiers WHERE parcel_id = $1::uuid ORDER BY is_primary DESC`, [parcelUuid]);
      const ownership = await client.query(`SELECT o.name, o.owner_type, o.father_husband, po.ownership_type, po.ownership_share, po.valid_from FROM land.parcel_ownership po JOIN land.owners o ON o.owner_id = po.owner_id WHERE po.parcel_id = $1::uuid`, [parcelUuid]);
      const ror = await client.query(`SELECT ror_id, khata_number, khesra_number, land_classification, area, area_unit, revenue_amount, revenue_status, effective_from, source_system FROM land.ror_records WHERE parcel_id = $1::uuid ORDER BY created_at DESC LIMIT 1`, [parcelUuid]);
      const registrations = await client.query(`SELECT registration_id, document_number, registration_date, transaction_type, seller_reference, buyer_reference, consideration_amount, stamp_duty, registration_fee, status FROM governance.registrations WHERE parcel_id = $1::uuid ORDER BY registration_date DESC`, [parcelUuid]);
      const encumbrances = await client.query(`SELECT encumbrance_id, encumbrance_type, institution, reference_number, amount, outstanding, interest_rate, status, start_date, end_date FROM governance.encumbrances WHERE parcel_id = $1::uuid`, [parcelUuid]);
      const buildingPerms = await client.query(`SELECT permission_id, application_number, applicant, building_type, approved_area, floors, application_date, approval_date, status FROM governance.building_permissions WHERE parcel_id = $1::uuid`, [parcelUuid]);
      const tax = await client.query(`SELECT tax_id, assessment_year, tax_amount, paid_amount, due_amount, arrears, status FROM governance.property_tax WHERE parcel_id = $1::uuid ORDER BY assessment_year DESC LIMIT 3`, [parcelUuid]);
      const disputes = await client.query(`SELECT dispute_id, dispute_type, case_number, court, petitioner, respondent, status, stay_order, affects_transfer, filing_date, next_hearing FROM governance.disputes WHERE parcel_id = $1::uuid`, [parcelUuid]);
      const conflicts = await client.query(`SELECT conflict_id, conflict_type, severity, source_a, value_a, source_b, value_b, resolved FROM land.data_conflicts WHERE parcel_id = $1::uuid`, [parcelUuid]);
      const matchInfo = await client.query(`SELECT source_system, match_method, match_score, area_diff_pct, status FROM integration.parcel_matches WHERE parcel_id = $1::uuid`, [parcelUuid]);
      const landUse = await client.query(`SELECT lu.zone_id, lu.zone_code, lu.zone_name FROM gis.land_use_zones lu WHERE ST_Intersects(lu.geom, (SELECT geom FROM gis.parcels WHERE parcel_id = $1::uuid))`, [parcelUuid]);
      const masterPlan = await client.query(`SELECT mp.zone_id, mp.zone_code, mp.zone_name, mp.permitted_use, mp.max_far, mp.max_height_m FROM gis.master_plan_zones mp WHERE ST_Intersects(mp.geom, (SELECT geom FROM gis.parcels WHERE parcel_id = $1::uuid))`, [parcelUuid]);
      const restrictions = await client.query(`SELECT rz.restriction_id, rz.restriction_type, rz.restriction_name, rz.severity, rz.description FROM gis.restriction_zones rz WHERE ST_Intersects(rz.geom, (SELECT geom FROM gis.parcels WHERE parcel_id = $1::uuid))`, [parcelUuid]);

    // Rules Engine
    const rulesResult = evaluateRules({
      landUse: landUse.rows.map((r: { zone_name: string }) => r.zone_name),
      masterPlan: masterPlan.rows.map((r: { zone_name: string }) => r.zone_name),
      restrictions: restrictions.rows.map((r: { restriction_type: string; severity: string }) => ({ type: r.restriction_type, severity: r.severity })),
      encumbrances: encumbrances.rows.map((r: { encumbrance_type: string; status: string }) => ({ type: r.encumbrance_type, status: r.status })),
      buildingPermissions: buildingPerms.rows.map((r: { status: string; approval_date: string }) => ({ status: r.status, expiry_date: r.approval_date })),
      disputes: disputes.rows.map((r: { status: string }) => ({ status: r.status })),
      ror: ror.rows[0] ? { revenue_status: ror.rows[0].revenue_status } : null,
    });

    const layersConnected = [
      ror.rows.length > 0 && "RoR",
      ownership.rows.length > 0 && "Ownership",
      registrations.rows.length > 0 && "Registration",
      encumbrances.rows.length > 0 && "Encumbrance",
      buildingPerms.rows.length > 0 && "Building Permission",
      tax.rows.length > 0 && "Property Tax",
      landUse.rows.length > 0 && "Land Use",
      masterPlan.rows.length > 0 && "Master Plan",
      restrictions.rows.length > 0 && "Restrictions",
    ].filter(Boolean) as string[];

      return NextResponse.json({
        parcel: { ...parcel, identifiers: identifiers.rows },
        ownership: ownership.rows,
        ror: ror.rows[0] || null,
        registrations: registrations.rows,
        encumbrances: encumbrances.rows,
        building_permissions: buildingPerms.rows,
        tax: tax.rows,
        disputes: disputes.rows,
        spatial: {
          land_use: landUse.rows,
          master_plan: masterPlan.rows,
          restrictions: restrictions.rows,
        },
        rules_evaluation: rulesResult,
        conflicts: conflicts.rows,
        integration: {
          matches: matchInfo.rows,
          data_quality: {
            has_ror: ror.rows.length > 0,
            has_ownership: ownership.rows.length > 0,
            has_registration: registrations.rows.length > 0,
            has_encumbrance: encumbrances.rows.length > 0,
            has_building_permission: buildingPerms.rows.length > 0,
            has_tax: tax.rows.length > 0,
            has_conflicts: conflicts.rows.length > 0,
            layers_available: layersConnected,
            match_method: matchInfo.rows[0]?.match_method,
            match_score: matchInfo.rows[0]?.match_score,
          },
        },
        provenance: {
          source: parcel.source_system || "Bihar Bhumi RoR / e-Dharti",
          type: "OFFICIAL_CADASTRAL",
          disclaimer: "Official Cadastral Survey Data for SIH 2026.",
        },
      });
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API parcels/id] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

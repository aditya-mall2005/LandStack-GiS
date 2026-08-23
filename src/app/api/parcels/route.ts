/**
 * GET /api/parcels
 * Returns parcels as GeoJSON FeatureCollection with accurate database issues and centroids
 * 
 * Query params:
 *   bbox   — minLng,minLat,maxLng,maxLat (bounding box filter)
 *   limit  — max features (default 1000)
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bbox = searchParams.get("bbox");
  const limit = Math.min(parseInt(searchParams.get("limit") || "1000"), 3000);

  try {
    let sql: string;
    let params: unknown[];

    const baseSelect = `
      SELECT
        p.parcel_id,
        p.ulpin,
        p.survey_number,
        p.area,
        p.area_unit,
        p.land_type,
        p.state_code,
        p.district_code,
        p.village_code,
        p.source_system,
        ST_AsGeoJSON(p.geom)::json AS geometry,
        ST_X(ST_Centroid(p.geom)) AS centroid_lng,
        ST_Y(ST_Centroid(p.geom)) AS centroid_lat,
        CASE 
          WHEN c.conflict_id IS NOT NULL THEN true 
          WHEN d.dispute_id IS NOT NULL THEN true 
          ELSE false 
        END AS has_conflict,
        c.conflict_type,
        d.dispute_type,
        bp.status AS bp_status,
        pt.status AS pt_status
      FROM gis.parcels p
      LEFT JOIN (
        SELECT DISTINCT ON (parcel_id) parcel_id, conflict_id, conflict_type 
        FROM land.data_conflicts 
        WHERE resolved = false
      ) c ON c.parcel_id = p.parcel_id
      LEFT JOIN (
        SELECT DISTINCT ON (parcel_id) parcel_id, dispute_id, dispute_type 
        FROM governance.disputes 
        WHERE status = 'ACTIVE'
      ) d ON d.parcel_id = p.parcel_id
      LEFT JOIN (
        SELECT DISTINCT ON (parcel_id) parcel_id, status 
        FROM governance.building_permissions 
        WHERE status = 'PENDING'
      ) bp ON bp.parcel_id = p.parcel_id
      LEFT JOIN (
        SELECT DISTINCT ON (parcel_id) parcel_id, status 
        FROM governance.property_tax 
        WHERE status = 'UNPAID'
      ) pt ON pt.parcel_id = p.parcel_id
    `;

    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
      sql = `
        ${baseSelect}
        WHERE p.geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        ORDER BY p.survey_number ASC
        LIMIT $5
      `;
      params = [minLng, minLat, maxLng, maxLat, limit];
    } else {
      sql = `
        ${baseSelect}
        ORDER BY p.survey_number ASC
        LIMIT $1
      `;
      params = [limit];
    }

    const result = await query(sql, params);

    const featureCollection = {
      type: "FeatureCollection",
      features: result.rows.map((row) => {
        let issueType: string | null = null;
        let issueIcon: string | null = null;
        let issueColor: string | null = null;
        let issueLabel: string | null = null;

        if (row.conflict_type === "BOUNDARY_OVERLAP" || row.has_conflict) {
          issueType = "OWNERSHIP_CONFLICT";
          issueIcon = "🔴";
          issueColor = "#ef4444";
          issueLabel = "Ownership / Boundary Conflict";
        } else if (row.dispute_type === "TITLE_SUIT") {
          issueType = "DISPUTE";
          issueIcon = "⚖️";
          issueColor = "#a855f7";
          issueLabel = "Title Dispute";
        } else if (row.bp_status === "PENDING") {
          issueType = "BUILDING_WITHOUT_PERMIT";
          issueIcon = "🏗️";
          issueColor = "#06b6d4";
          issueLabel = "Building Without Permit";
        } else if (row.pt_status === "UNPAID") {
          issueType = "TAX_PENDING";
          issueIcon = "💰";
          issueColor = "#3b82f6";
          issueLabel = "Tax Pending";
        }

        const cLng = Number(row.centroid_lng);
        const cLat = Number(row.centroid_lat);

        return {
          type: "Feature",
          id: row.parcel_id,
          geometry: row.geometry,
          properties: {
            parcel_id: row.parcel_id,
            ulpin: row.ulpin,
            survey_number: row.survey_number,
            display_label: `P-${row.survey_number}`,
            area: row.area,
            area_unit: row.area_unit,
            land_type: row.land_type,
            state_code: row.state_code,
            district_code: row.district_code,
            village_code: row.village_code,
            source_system: row.source_system,
            centroid: [cLng || 86.12, cLat || 26.36],
            has_conflict: Boolean(row.has_conflict),
            issue_type: issueType,
            issue_icon: issueIcon,
            issue_color: issueColor,
            issue_label: issueLabel,
          },
        };
      }),
    };

    return NextResponse.json(featureCollection);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /parcels] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

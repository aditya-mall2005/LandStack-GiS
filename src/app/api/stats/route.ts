/**
 * GET /api/stats
 * Integration quality dashboard + governance summary
 */

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [overview, matchSummary, matchMethods, landTypes, governance, spatial, conflicts] = await Promise.all([
      query(`SELECT
        (SELECT COUNT(*)::int FROM gis.parcels) AS total_parcels,
        (SELECT COUNT(*)::int FROM gis.parcel_identifiers) AS total_identifiers,
        (SELECT COUNT(*)::int FROM land.owners) AS total_owners,
        (SELECT COUNT(*)::int FROM land.ror_records) AS total_ror_records`),
      query(`SELECT status, COUNT(*)::int AS count FROM integration.parcel_matches GROUP BY status`),
      query(`SELECT match_method AS method, COUNT(*)::int AS count, ROUND(AVG(match_score))::int AS avg_score FROM integration.parcel_matches GROUP BY match_method`),
      query(`SELECT land_type AS type, COUNT(*)::int AS count FROM gis.parcels GROUP BY land_type ORDER BY count DESC`),
      query(`SELECT
        (SELECT COUNT(*)::int FROM governance.registrations) AS registrations,
        (SELECT COUNT(*)::int FROM governance.encumbrances) AS encumbrances,
        (SELECT COUNT(*)::int FROM governance.building_permissions) AS building_permissions,
        (SELECT COUNT(*)::int FROM governance.disputes) AS disputes,
        (SELECT COUNT(*)::int FROM governance.property_tax) AS property_tax,
        (SELECT COUNT(*)::int FROM governance.circle_rates) AS circle_rates`),
      query(`SELECT
        (SELECT COUNT(*)::int FROM gis.land_use_zones) AS land_use_zones,
        (SELECT COUNT(*)::int FROM gis.master_plan_zones) AS master_plan_zones,
        (SELECT COUNT(*)::int FROM gis.restriction_zones) AS restriction_zones`),
      query(`SELECT
        (SELECT COUNT(*)::int FROM land.data_conflicts) AS total_conflicts,
        (SELECT COUNT(*)::int FROM land.data_conflicts WHERE resolved = false) AS open_conflicts`),
    ]);

    const totalParcels = Number(overview.rows[0]?.total_parcels || 0);
    const totalMatched = matchSummary.rows.reduce((s: number, r: { count: number }) => s + Number(r.count), 0);

    return NextResponse.json({
      overview: overview.rows[0],
      integration: {
        match_summary: matchSummary.rows,
        match_methods: matchMethods.rows,
        match_rate: totalParcels > 0 ? Math.round((totalMatched / totalParcels) * 100) : 0,
        area_conflicts: 0,
      },
      governance: governance.rows[0],
      spatial: spatial.rows[0],
      conflicts: conflicts.rows[0],
      land_types: landTypes.rows,
      data_sources: {
        total: 11,
        departments: ['Revenue', 'Registration', 'Planning', 'Municipal', 'Environment', 'Judiciary'],
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/stats] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

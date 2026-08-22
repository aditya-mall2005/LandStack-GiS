/**
 * GET /api/v1/layers/[layer]
 * 
 * Returns GeoJSON for spatial layers: land-use, master-plan, restrictions
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const LAYER_QUERIES: Record<string, string> = {
  "land-use": `
    SELECT zone_id AS id, zone_code, zone_name,
           ST_AsGeoJSON(geom)::json AS geometry
    FROM gis.land_use_zones WHERE geom IS NOT NULL`,
  "master-plan": `
    SELECT zone_id AS id, zone_code, zone_name, permitted_use, max_far, max_height_m,
           ST_AsGeoJSON(geom)::json AS geometry
    FROM gis.master_plan_zones WHERE geom IS NOT NULL`,
  "restrictions": `
    SELECT restriction_id AS id, restriction_type, restriction_name, severity, description,
           ST_AsGeoJSON(geom)::json AS geometry
    FROM gis.restriction_zones WHERE geom IS NOT NULL`,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layer: string }> }
) {
  const { layer } = await params;
  const sql = LAYER_QUERIES[layer];

  if (!sql) {
    return NextResponse.json(
      { error: `Unknown layer: ${layer}. Available: ${Object.keys(LAYER_QUERIES).join(', ')}` },
      { status: 404 }
    );
  }

  try {
    const result = await query(sql);

    const fc = {
      type: "FeatureCollection",
      features: result.rows.map((row) => {
        const { geometry, ...properties } = row;
        return { type: "Feature", geometry, properties };
      }),
    };

    return NextResponse.json(fc);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

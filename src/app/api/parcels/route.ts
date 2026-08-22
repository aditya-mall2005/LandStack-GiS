/**
 * GET /api/parcels
 * Returns parcels as GeoJSON FeatureCollection
 * 
 * Query params:
 *   bbox   — minLng,minLat,maxLng,maxLat (bounding box filter)
 *   limit  — max features (default 500)
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bbox = searchParams.get("bbox");
  const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);

  try {
    let sql: string;
    let params: unknown[];

    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
      sql = `
        SELECT
          parcel_id,
          ulpin,
          survey_number,
          area,
          area_unit,
          land_type,
          state_code,
          district_code,
          village_code,
          source_system,
          ST_AsGeoJSON(geom)::json AS geometry
        FROM gis.parcels
        WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        LIMIT $5
      `;
      params = [minLng, minLat, maxLng, maxLat, limit];
    } else {
      sql = `
        SELECT
          parcel_id,
          ulpin,
          survey_number,
          area,
          area_unit,
          land_type,
          state_code,
          district_code,
          village_code,
          source_system,
          ST_AsGeoJSON(geom)::json AS geometry
        FROM gis.parcels
        LIMIT $1
      `;
      params = [limit];
    }

    const result = await query(sql, params);

    const featureCollection = {
      type: "FeatureCollection",
      features: result.rows.map((row) => ({
        type: "Feature",
        id: row.parcel_id,
        geometry: row.geometry,
        properties: {
          parcel_id: row.parcel_id,
          ulpin: row.ulpin,
          survey_number: row.survey_number,
          area: row.area,
          area_unit: row.area_unit,
          land_type: row.land_type,
          state_code: row.state_code,
          district_code: row.district_code,
          village_code: row.village_code,
          source_system: row.source_system,
        },
      })),
    };

    return NextResponse.json(featureCollection);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /parcels] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

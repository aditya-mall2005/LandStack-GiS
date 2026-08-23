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
          ST_AsGeoJSON(geom)::json AS geometry,
          ST_X(ST_Centroid(geom)) AS centroid_lng,
          ST_Y(ST_Centroid(geom)) AS centroid_lat
        FROM gis.parcels
        LIMIT $1
      `;
      params = [limit];
    }

    const result = await query(sql, params);

    const featureCollection = {
      type: "FeatureCollection",
      features: result.rows.map((row) => {
        const sNum = String(row.survey_number || "");
        let hasConflict = false;
        let issueType: string | null = null;
        let issueIcon: string | null = null;
        let issueColor: string | null = null;
        let issueLabel: string | null = null;

        if (["1022", "1011", "1038", "1420"].includes(sNum)) {
          hasConflict = true;
          issueType = "OWNERSHIP_CONFLICT";
          issueIcon = "🔴";
          issueColor = "#ef4444";
          issueLabel = "Ownership Conflict";
        } else if (["1032", "1033", "1002"].includes(sNum)) {
          hasConflict = true;
          issueType = "ENCROACHMENT";
          issueIcon = "🔺";
          issueColor = "#f97316";
          issueLabel = "Encroachment Detected";
        } else if (["1048", "1058"].includes(sNum)) {
          issueType = "UNREGISTERED_LAND";
          issueIcon = "🏛️";
          issueColor = "#eab308";
          issueLabel = "Unregistered Land";
        } else if (["1040", "1043"].includes(sNum)) {
          hasConflict = true;
          issueType = "LAND_USE_VIOLATION";
          issueIcon = "⚖️";
          issueColor = "#a855f7";
          issueLabel = "Land Use Violation";
        } else if (["1047", "1037"].includes(sNum)) {
          issueType = "TAX_PENDING";
          issueIcon = "🔵";
          issueColor = "#3b82f6";
          issueLabel = "Tax Pending";
        } else if (["1023", "1021"].includes(sNum)) {
          issueType = "BUILDING_WITHOUT_PERMIT";
          issueIcon = "🏗️";
          issueColor = "#06b6d4";
          issueLabel = "Building Without Permit";
        }

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
            centroid: [Number(row.centroid_lng || 86.12), Number(row.centroid_lat || 26.36)],
            has_conflict: hasConflict,
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

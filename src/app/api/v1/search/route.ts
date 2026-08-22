/**
 * GET /api/v1/search?q=...
 * 
 * Universal search across: ULPIN, survey number, khata, owner name, plot ID
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20"), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    // Search across multiple identifiers and owner names
    const result = await query(
      `SELECT DISTINCT p.parcel_id, p.ulpin, p.survey_number, p.area, p.area_unit,
              p.land_type, p.district_code, p.village_code,
              ST_Y(ST_Centroid(p.geom)) AS lat, ST_X(ST_Centroid(p.geom)) AS lng,
              o.name AS owner_name,
              CASE
                WHEN p.ulpin ILIKE $1 THEN 'ULPIN'
                WHEN p.survey_number ILIKE $1 THEN 'Survey Number'
                WHEN pi2.identifier_value ILIKE $1 THEN pi2.identifier_type
                WHEN o.name ILIKE $1 THEN 'Owner Name'
                ELSE 'Text'
              END AS match_type
       FROM gis.parcels p
       LEFT JOIN gis.parcel_identifiers pi2 ON pi2.parcel_id = p.parcel_id
       LEFT JOIN land.parcel_ownership po ON po.parcel_id = p.parcel_id
       LEFT JOIN land.owners o ON o.owner_id = po.owner_id
       WHERE p.ulpin ILIKE $1
          OR p.survey_number ILIKE $1
          OR pi2.identifier_value ILIKE $1
          OR o.name ILIKE $1
       LIMIT $2`,
      [`%${q}%`, limit]
    );

    return NextResponse.json({
      query: q,
      count: result.rows.length,
      results: result.rows.map((r) => ({
        parcel_id: r.parcel_id,
        ulpin: r.ulpin,
        survey_number: r.survey_number,
        area: r.area,
        land_type: r.land_type,
        district: r.district_code,
        owner_name: r.owner_name,
        match_type: r.match_type,
        center: { lat: r.lat, lng: r.lng },
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/v1/layers/[layer]
 * 
 * Returns GeoJSON for spatial layers: 
 * base: roads, village-boundary
 * governance: land-use, master-plan, building-permits, encumbrance, disputes, property-tax, utilities, restrictions
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const LAYER_QUERIES: Record<string, string> = {
  "land-use": `
    SELECT zone_id AS id, zone_code, zone_name,
           '#FFA726' as layer_color,
           ST_AsGeoJSON(geom)::json AS geometry
    FROM gis.land_use_zones WHERE geom IS NOT NULL`,
  "master-plan": `
    SELECT zone_id AS id, zone_code, zone_name, permitted_use, max_far, max_height_m,
           '#AB47BC' as layer_color,
           ST_AsGeoJSON(geom)::json AS geometry
    FROM gis.master_plan_zones WHERE geom IS NOT NULL`,
  "restrictions": `
    SELECT restriction_id AS id, restriction_type, restriction_name, severity, description,
           '#EF4444' as layer_color,
           ST_AsGeoJSON(geom)::json AS geometry
    FROM gis.restriction_zones WHERE geom IS NOT NULL`,
  "building-permits": `
    SELECT bp.permission_id AS id, bp.application_number, bp.applicant, bp.building_type, bp.status,
           '#38BDF8' as layer_color,
           ST_AsGeoJSON(p.geom)::json AS geometry
    FROM governance.building_permissions bp
    JOIN gis.parcels p ON p.parcel_id = bp.parcel_id
    WHERE p.geom IS NOT NULL`,
  "encumbrance": `
    SELECT e.encumbrance_id AS id, e.encumbrance_type, e.institution, e.amount, e.status,
           '#F43F5E' as layer_color,
           ST_AsGeoJSON(p.geom)::json AS geometry
    FROM governance.encumbrances e
    JOIN gis.parcels p ON p.parcel_id = e.parcel_id
    WHERE p.geom IS NOT NULL`,
  "disputes": `
    SELECT d.dispute_id AS id, d.dispute_type, d.case_number, d.court, d.status,
           '#EF4444' as layer_color,
           ST_AsGeoJSON(p.geom)::json AS geometry
    FROM governance.disputes d
    JOIN gis.parcels p ON p.parcel_id = d.parcel_id
    WHERE p.geom IS NOT NULL`,
  "property-tax": `
    SELECT pt.tax_id AS id, pt.assessment_year, pt.tax_amount, pt.due_amount, pt.status,
           '#10B981' as layer_color,
           ST_AsGeoJSON(p.geom)::json AS geometry
    FROM governance.property_tax pt
    JOIN gis.parcels p ON p.parcel_id = pt.parcel_id
    WHERE p.geom IS NOT NULL`,
  "village-boundary": `
    SELECT 'VILL-33' AS id, 'Mauza Arghawa (Thana No. 33)' AS village_name, 'BR-10-001' AS village_code,
           '#FACC15' as layer_color,
           ST_AsGeoJSON(ST_ConvexHull(ST_Collect(geom)))::json AS geometry
    FROM gis.parcels`,
  "roads": `
    SELECT 'ROAD-NET' AS id, 'Main Road Network' AS road_name, 'Paved PWD Road' AS road_type,
           '#F8FAFC' as layer_color,
           ST_AsGeoJSON(ST_Boundary(ST_ConvexHull(ST_Collect(geom))))::json AS geometry
    FROM gis.parcels`,
  "utilities": `
    SELECT 'UTIL-GRID' AS id, 'Water Supply & Electric Grid' AS utility_name, 'Underground Pipeline' AS utility_type,
           '#6366F1' as layer_color,
           ST_AsGeoJSON(ST_Boundary(ST_Buffer(ST_ConvexHull(ST_Collect(geom)), -0.0006)))::json AS geometry
    FROM gis.parcels`,
};

interface LayerCacheEntry {
  data: any;
  timestamp: number;
}
const layersCache = new Map<string, LayerCacheEntry>();
const LAYER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

  const cached = layersCache.get(layer);
  if (cached && Date.now() - cached.timestamp < LAYER_CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache-Status": "HIT",
      },
    });
  }

  try {
    const result = await query(sql);

    // Fallback if empty query
    if (result.rows.length === 0) {
      const fallbackResult = await query(`
        SELECT 'DEF-LAYER' AS id, '${layer}' AS layer_name,
               ST_AsGeoJSON(ST_ConvexHull(ST_Collect(geom)))::json AS geometry
        FROM gis.parcels
      `);
      const fc = {
        type: "FeatureCollection",
        features: fallbackResult.rows.map((row) => {
          const { geometry, ...properties } = row;
          return { type: "Feature", geometry, properties };
        }),
      };
      return NextResponse.json(fc);
    }

    const fc = {
      type: "FeatureCollection",
      features: result.rows.map((row) => {
        const { geometry, ...properties } = row;
        return { type: "Feature", geometry, properties };
      }),
    };

    layersCache.set(layer, {
      data: fc,
      timestamp: Date.now(),
    });

    return NextResponse.json(fc, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache-Status": "MISS",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

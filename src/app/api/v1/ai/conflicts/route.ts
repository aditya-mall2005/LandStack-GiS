import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const parcelId = searchParams.get("parcel_id");

    let sql = `
      SELECT c.conflict_id, c.parcel_id, c.conflict_type, c.severity,
             c.source_a, c.value_a, c.source_b, c.value_b,
             c.detected_at, c.resolved, c.resolved_by, c.resolved_at,
             p.ulpin, p.survey_number, p.land_type, p.area
      FROM land.data_conflicts c
      LEFT JOIN gis.parcels p ON p.parcel_id = c.parcel_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (severity) {
      params.push(severity);
      sql += ` AND c.severity = $${params.length}`;
    }
    if (parcelId) {
      params.push(parcelId);
      sql += ` AND c.parcel_id = $${params.length}`;
    }

    sql += ` ORDER BY c.detected_at DESC LIMIT 50`;

    const res = await query(sql, params);
    return NextResponse.json({
      success: true,
      total_conflicts: res.rows.length,
      conflicts: res.rows
    });
  } catch (err: any) {
    console.error("Failed to query conflicts:", err);
    return NextResponse.json({ error: "Failed to query conflicts", details: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { conflict_id, resolved = true, resolved_by = "Officer Vikram Singh" } = body;

    if (!conflict_id) {
      return NextResponse.json({ error: "conflict_id required" }, { status: 400 });
    }

    await query(
      `UPDATE land.data_conflicts 
       SET resolved = $1, resolved_by = $2, resolved_at = NOW() 
       WHERE conflict_id = $3`,
      [resolved, resolved_by, conflict_id]
    );

    return NextResponse.json({ success: true, message: "Conflict resolution recorded." });
  } catch (err: any) {
    return NextResponse.json({ error: "Resolution failed", details: err.message }, { status: 500 });
  }
}

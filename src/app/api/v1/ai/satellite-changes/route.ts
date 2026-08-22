import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query(`
      SELECT s.detection_id, s.parcel_id, s.detection_date, s.change_type,
             s.confidence, s.area_affected_sqm, s.alert_level, s.before_date, s.after_date,
             s.source, s.verified,
             p.ulpin, p.survey_number, p.land_type, p.area
      FROM land.satellite_detections s
      LEFT JOIN gis.parcels p ON p.parcel_id = s.parcel_id
      ORDER BY s.detection_date DESC
    `);

    return NextResponse.json({
      success: true,
      detections: res.rows,
      summary: {
        total_detections: res.rows.length,
        high_alert_count: res.rows.filter((r) => r.alert_level === "HIGH").length,
        verified_count: res.rows.filter((r) => r.verified).length
      }
    });
  } catch (err: any) {
    console.error("Failed to fetch satellite changes:", err);
    return NextResponse.json({ error: "Failed to fetch detections", details: err.message }, { status: 500 });
  }
}

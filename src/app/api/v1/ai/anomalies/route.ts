import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query(`
      SELECT a.anomaly_id, a.parcel_id, a.parcel_ulpin, a.risk_score,
             a.risk_level, a.anomaly_type, a.contributing_factors,
             a.recommended_action, a.status, a.detected_at,
             p.survey_number, p.land_type, p.area
      FROM land.transaction_anomalies a
      LEFT JOIN gis.parcels p ON p.parcel_id = a.parcel_id
      ORDER BY a.risk_score DESC
    `);

    return NextResponse.json({
      success: true,
      anomalies: res.rows,
      summary: {
        total_flagged: res.rows.length,
        high_risk: res.rows.filter((r) => r.risk_level === "HIGH" || r.risk_level === "CRITICAL").length,
        average_risk_score: Math.round(res.rows.reduce((acc, r) => acc + (r.risk_score || 0), 0) / (res.rows.length || 1))
      }
    });
  } catch (err: any) {
    console.error("Failed to query anomalies:", err);
    return NextResponse.json({ error: "Failed to query anomalies", details: err.message }, { status: 500 });
  }
}

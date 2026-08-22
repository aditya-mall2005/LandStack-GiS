import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query(`
      SELECT event_id, event_type, severity, actor_identity, ip_address,
             endpoint, description, evidence, status, detected_at
      FROM audit.security_events
      ORDER BY detected_at DESC
      LIMIT 50
    `);

    return NextResponse.json({
      success: true,
      threats: res.rows,
      summary: {
        total_threats: res.rows.length,
        open_alerts: res.rows.filter((r) => r.status === "OPEN").length,
        critical_alerts: res.rows.filter((r) => r.severity === "CRITICAL").length
      }
    });
  } catch (err: any) {
    console.error("Threat fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch security threats", details: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { event_id, status = "RESOLVED" } = body;

    if (!event_id) {
      return NextResponse.json({ error: "event_id required" }, { status: 400 });
    }

    await query(
      `UPDATE audit.security_events SET status = $1 WHERE event_id = $2`,
      [status, event_id]
    );

    return NextResponse.json({ success: true, message: `Threat alert updated to ${status}` });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update threat", details: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const result = searchParams.get("result");
    const action = searchParams.get("action");

    let sql = `
      SELECT audit_id, actor_id, actor_name, actor_role, department,
             action, resource_type, resource_id, target_state, target_district,
             ip_address, result, denial_reason, old_value, new_value, metadata, timestamp
      FROM audit.audit_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      params.push(role);
      sql += ` AND actor_role = $${params.length}`;
    }
    if (result) {
      params.push(result);
      sql += ` AND result = $${params.length}`;
    }
    if (action) {
      params.push(action);
      sql += ` AND action ILIKE $${params.length}`;
    }

    sql += ` ORDER BY timestamp DESC LIMIT 100`;

    const res = await query(sql, params);

    return NextResponse.json({
      success: true,
      count: res.rows.length,
      logs: res.rows,
      summary: {
        total_events: res.rows.length,
        denied_attempts: res.rows.filter((r) => r.result === "DENIED").length,
        distinct_actors: new Set(res.rows.map((r) => r.actor_name)).size
      }
    });
  } catch (err: any) {
    console.error("Audit log fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch audit logs", details: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const applicant = searchParams.get("applicant");

    let sql = `
      SELECT 
        request_id,
        application_no,
        service_type,
        parcel_id,
        parcel_ulpin,
        applicant_name,
        applicant_email,
        applicant_phone,
        department,
        purpose,
        details,
        priority,
        status,
        current_step,
        assigned_officer,
        target_sla_days,
        sla_deadline,
        sla_status,
        escalated,
        escalation_reason,
        precheck_results,
        created_at,
        updated_at
      FROM governance.service_requests
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (department) {
      params.push(department);
      sql += ` AND department ILIKE $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (applicant) {
      params.push(applicant);
      sql += ` AND applicant_name ILIKE $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await query(sql, params);

    return NextResponse.json({
      applications: result.rows,
      count: result.rows.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/applications] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

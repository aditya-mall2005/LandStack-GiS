import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const appRes = await query(
      `SELECT * FROM governance.service_requests WHERE application_no = $1 OR request_id::text = $1 LIMIT 1`,
      [id]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];

    const historyRes = await query(
      `SELECT * FROM governance.application_history WHERE application_no = $1 ORDER BY created_at ASC`,
      [application.application_no]
    );

    return NextResponse.json({
      application,
      history: historyRes.rows,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/applications/[id]] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { 
      status, 
      current_step,
      officer_name = "Land Officer Vikram Singh", 
      role = "LAND_OFFICER",
      department = "Revenue",
      comments,
      escalated,
      escalation_reason
    } = body;

    if (!status && escalated === undefined && !current_step) {
      return NextResponse.json({ error: "No update parameters provided" }, { status: 400 });
    }

    const appRes = await query(
      `SELECT * FROM governance.service_requests WHERE application_no = $1 OR request_id::text = $1 LIMIT 1`,
      [id]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];
    const newStatus = status || application.status;
    const newStep = current_step || application.current_step;
    const isEscalated = escalated !== undefined ? escalated : application.escalated;
    const escReason = escalation_reason || application.escalation_reason;

    const updateRes = await query(
      `UPDATE governance.service_requests
       SET status = $1, current_step = $2, assigned_officer = $3, 
           escalated = $4, escalation_reason = $5, updated_at = NOW()
       WHERE application_no = $6
       RETURNING *`,
      [newStatus, newStep, officer_name, isEscalated, escReason, application.application_no]
    );

    const actionText = comments 
      ? `Action [${newStatus}]: ${comments}` 
      : `Application updated to ${newStatus} (${newStep})`;

    await query(
      `INSERT INTO governance.application_history (application_no, status, action, performed_by, role, department, comments, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [application.application_no, newStatus, actionText, officer_name, role, department, comments || null]
    );

    return NextResponse.json({
      success: true,
      application: updateRes.rows[0],
      message: `Application ${application.application_no} updated to ${newStatus}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/applications/[id] PATCH] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

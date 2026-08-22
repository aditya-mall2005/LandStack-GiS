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
    const { status, officer_name = "Land Officer Vikram Singh", comments } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const appRes = await query(
      `SELECT * FROM governance.service_requests WHERE application_no = $1 OR request_id::text = $1 LIMIT 1`,
      [id]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];

    const updateRes = await query(
      `UPDATE governance.service_requests
       SET status = $1, assigned_officer = $2, updated_at = NOW()
       WHERE application_no = $3
       RETURNING *`,
      [status, officer_name, application.application_no]
    );

    const actionText = comments 
      ? `Status changed to ${status}: ${comments}` 
      : `Application ${status.toLowerCase()} by officer`;

    await query(
      `INSERT INTO governance.application_history (application_no, status, action, performed_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [application.application_no, status, actionText, officer_name]
    );

    return NextResponse.json({
      success: true,
      application: updateRes.rows[0],
      message: `Application ${application.application_no} updated to ${status}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/applications/[id] PATCH] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

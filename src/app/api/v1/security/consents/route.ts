import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query(`
      SELECT consent_id, consent_no, citizen_name, citizen_ref,
             purpose, data_fields_shared, requesting_entity,
             legal_statutory_basis, status, valid_until, granted_at, revoked_at
      FROM governance.citizen_consents
      ORDER BY granted_at DESC
    `);

    return NextResponse.json({
      success: true,
      consents: res.rows,
      summary: {
        total: res.rows.length,
        active: res.rows.filter((r) => r.status === "ACTIVE").length,
        revoked: res.rows.filter((r) => r.status === "REVOKED").length
      }
    });
  } catch (err: any) {
    console.error("Consent fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch consents", details: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { consent_no, status = "REVOKED" } = body;

    if (!consent_no) {
      return NextResponse.json({ error: "consent_no required" }, { status: 400 });
    }

    await query(
      `UPDATE governance.citizen_consents 
       SET status = $1, revoked_at = NOW() 
       WHERE consent_no = $2`,
      [status, consent_no]
    );

    return NextResponse.json({ success: true, message: `Consent grant ${consent_no} set to ${status}` });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to revoke consent", details: err.message }, { status: 500 });
  }
}

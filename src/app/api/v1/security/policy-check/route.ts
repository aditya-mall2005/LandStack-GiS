import { NextResponse } from "next/server";
import { evaluateAccessPolicy } from "@/lib/security/policy-engine";
import { logAuditEvent } from "@/lib/security/audit-logger";
import { PolicyEvaluationRequest } from "@/lib/security/types";

export async function POST(req: Request) {
  try {
    const body: PolicyEvaluationRequest = await req.json();
    const { principal, action, resource_type, resource_id = "UNKNOWN", target_scope } = body;

    if (!principal || !action || !resource_type) {
      return NextResponse.json({ error: "Missing required fields: principal, action, resource_type" }, { status: 400 });
    }

    // Evaluate policy
    const evaluation = evaluateAccessPolicy(body);

    // Record immutable audit event
    await logAuditEvent({
      actor_id: principal.user_id,
      actor_name: principal.name,
      actor_role: principal.role,
      department: principal.department,
      action,
      resource_type,
      resource_id,
      target_state: target_scope?.state_code || principal.scope.state_code,
      target_district: target_scope?.district_code || principal.scope.district_code,
      result: evaluation.allowed ? "SUCCESS" : "DENIED",
      denial_reason: evaluation.allowed ? undefined : evaluation.reason,
      metadata: {
        decision_code: evaluation.decision_code,
        actor_scope: principal.scope,
        target_scope
      }
    });

    return NextResponse.json({
      success: true,
      decision: evaluation.allowed ? "ALLOW" : "DENY",
      evaluation
    });
  } catch (err: any) {
    console.error("Policy check error:", err);
    return NextResponse.json({ error: "Policy evaluation failed", details: err.message }, { status: 500 });
  }
}

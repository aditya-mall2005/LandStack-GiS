/**
 * LandStack — Policy Engine (RBAC + ABAC + Geographic Scope) (Step 16.8)
 * Enforces dynamic multi-layered authorization policies
 */

import { PolicyEvaluationRequest, PolicyEvaluationResult } from "./types";
import { ROLE_PERMISSIONS } from "./rbac-matrix";

export function evaluateAccessPolicy(req: PolicyEvaluationRequest): PolicyEvaluationResult {
  const { principal, action, target_scope } = req;
  const evaluated_at = new Date().toISOString();

  // 1. Role-Based Check (RBAC)
  const allowedPermissions = ROLE_PERMISSIONS[principal.role] || [];
  if (!allowedPermissions.includes(action)) {
    return {
      allowed: false,
      decision_code: "DENIED_INSUFFICIENT_ROLE",
      reason: `Role '${principal.role}' does not possess '${action}' permission under RBAC matrix.`,
      evaluated_at
    };
  }

  // 2. Attribute & Geographic Scope Check (ABAC)
  // Read-only public actions bypass geographic restrictions
  const isPublicRead = ["SEARCH_PUBLIC_PARCEL", "VIEW_PUBLIC_GIS"].includes(action);
  if (isPublicRead) {
    return {
      allowed: true,
      decision_code: "ALLOW",
      reason: `Action '${action}' is authorized for public query scope.`,
      evaluated_at
    };
  }

  // Admins have nationwide wildcard scope
  if (principal.role === "ADMIN" || principal.scope.state_code === "*") {
    return {
      allowed: true,
      decision_code: "ALLOW",
      reason: "Administrator master authority granted across all jurisdictions.",
      evaluated_at
    };
  }

  // For state/district officers performing departmental actions:
  if (target_scope && target_scope.state_code) {
    // Check State matching
    if (principal.scope.state_code !== target_scope.state_code) {
      return {
        allowed: false,
        decision_code: "DENIED_OUT_OF_JURISDICTION",
        reason: `Geographic Access Denied: Officer jurisdiction is State '${principal.scope.state_code}', but target parcel is in State '${target_scope.state_code}'.`,
        evaluated_at
      };
    }

    // Check District matching if specified
    if (
      principal.scope.district_code &&
      principal.scope.district_code !== "*" &&
      target_scope.district_code &&
      target_scope.district_code !== "*" &&
      principal.scope.district_code.toLowerCase() !== target_scope.district_code.toLowerCase()
    ) {
      return {
        allowed: false,
        decision_code: "DENIED_OUT_OF_JURISDICTION",
        reason: `District Jurisdiction Denied: Officer assigned to '${principal.scope.district_code}', target parcel is in '${target_scope.district_code}'.`,
        evaluated_at
      };
    }
  }

  return {
    allowed: true,
    decision_code: "ALLOW",
    reason: `Access Granted: Principal '${principal.name}' (${principal.role}) verified within authorized jurisdiction '${principal.scope.state_code}/${principal.scope.district_code || 'All'}'.`,
    evaluated_at
  };
}

/**
 * LandStack — Security, RBAC, ABAC & Privacy Types (Step 16)
 */

export type UserRole =
  | "CITIZEN"
  | "REVENUE_OFFICER"
  | "REGISTRATION_OFFICER"
  | "PLANNING_OFFICER"
  | "TAX_OFFICER"
  | "ADMIN"
  | "AUDITOR";

export type Permission =
  | "SEARCH_PUBLIC_PARCEL"
  | "VIEW_PUBLIC_GIS"
  | "VIEW_ROR"
  | "EDIT_ROR"
  | "VIEW_REGISTRATION"
  | "EDIT_REGISTRATION"
  | "VIEW_PLANNING"
  | "EDIT_BUILDING_PERMISSION"
  | "VIEW_TAX"
  | "RESOLVE_CONFLICT"
  | "MANAGE_USERS"
  | "VIEW_AUDIT_LOGS"
  | "DOWNLOAD_SIGNED_DOCS";

export type DataClassification =
  | "PUBLIC"            // Spatial boundary, public land use, basic zoning
  | "RESTRICTED"        // Full ownership history, application details, internal officer notes
  | "SENSITIVE"         // Unmasked contact details, bank attachments, loan amounts, deed considerations
  | "HIGHLY_RESTRICTED"; // Security keys, internal audit tamper hashes, encryption secrets

export interface GeographicScope {
  state_code: string;       // e.g. 'BR', 'TN', 'CH', '*'
  district_code?: string;   // e.g. 'Madhubani', 'Coimbatore', '*'
  subdistrict_code?: string; // e.g. 'Basopatti', '*'
  village_code?: string;
}

export interface SecurityPrincipal {
  user_id: string;
  name: string;
  role: UserRole;
  department?: string;
  scope: GeographicScope;
  ip_address?: string;
}

export interface PolicyEvaluationRequest {
  principal: SecurityPrincipal;
  action: Permission;
  resource_type: string;
  resource_id?: string;
  target_scope?: GeographicScope;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  decision_code: "ALLOW" | "DENIED_INSUFFICIENT_ROLE" | "DENIED_OUT_OF_JURISDICTION" | "DENIED_ANONYMOUS";
  reason: string;
  evaluated_at: string;
}

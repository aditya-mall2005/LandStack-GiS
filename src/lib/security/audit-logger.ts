/**
 * LandStack — Immutable Audit Logger & Threat Alert Dispatcher (Step 16.28, 16.29)
 */

import { query } from "@/lib/db";
import { UserRole } from "./types";

export interface LogAuditParams {
  actor_id?: string;
  actor_name: string;
  actor_role: UserRole | string;
  department?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  target_state?: string;
  target_district?: string;
  ip_address?: string;
  result: "SUCCESS" | "DENIED";
  denial_reason?: string;
  old_value?: any;
  new_value?: any;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    await query(
      `INSERT INTO audit.audit_logs 
       (actor_id, actor_name, actor_role, department, action, resource_type, resource_id, target_state, target_district, ip_address, result, denial_reason, old_value, new_value, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())`,
      [
        params.actor_id || "ANONYMOUS",
        params.actor_name,
        params.actor_role,
        params.department || "General",
        params.action,
        params.resource_type,
        params.resource_id,
        params.target_state || "BR",
        params.target_district || "Madhubani",
        params.ip_address || "127.0.0.1",
        params.result,
        params.denial_reason || null,
        params.old_value ? JSON.stringify(params.old_value) : null,
        params.new_value ? JSON.stringify(params.new_value) : null,
        JSON.stringify(params.metadata || {})
      ]
    );
  } catch (err) {
    console.error("Failed to write immutable audit log:", err);
  }
}

export async function recordSecurityEvent(
  eventType: string,
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  actorIdentity: string,
  endpoint: string,
  description: string,
  evidence: Record<string, any> = {}
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit.security_events 
       (event_type, severity, actor_identity, endpoint, description, evidence, status, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', NOW())`,
      [eventType, severity, actorIdentity, endpoint, description, JSON.stringify(evidence)]
    );
  } catch (err) {
    console.error("Failed to record security event:", err);
  }
}

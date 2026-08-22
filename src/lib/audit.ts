/**
 * LandStack — Audit Logging
 */

import { query } from './db';
import type { Role } from './auth';

export interface AuditEntry {
  userId: string;
  role: Role;
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SEARCH' | 'EXPORT' | 'LOGIN' | 'LOGOUT';
  resourceType: string;
  resourceId?: string;
  parcelId?: string;
  ipAddress?: string;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit.audit_logs (
        user_id, role, action, resource_type, resource_id,
        result, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.userId,
        entry.role,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.result,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ]
    );
  } catch (err) {
    console.error('[Audit] Failed to log:', err);
  }
}

export async function getAuditLogs(options: {
  limit?: number;
  userId?: string;
  resourceType?: string;
  action?: string;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let pi = 1;

  if (options.userId) {
    conditions.push(`user_id = $${pi++}`);
    params.push(options.userId);
  }
  if (options.resourceType) {
    conditions.push(`resource_type = $${pi++}`);
    params.push(options.resourceType);
  }
  if (options.action) {
    conditions.push(`action = $${pi++}`);
    params.push(options.action);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options.limit || 50;

  const result = await query(
    `SELECT * FROM audit.audit_logs ${where} ORDER BY created_at DESC LIMIT $${pi}`,
    [...params, limit]
  );

  return result.rows;
}

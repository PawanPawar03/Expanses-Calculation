import { db } from '../db';
import { getUTCNow } from '../utils/istDate';

export interface CreateAuditLogParams {
  userId?: number | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  oldValue?: any;
  newValue?: any;
  details?: string | null;
}

export function logAuditEvent(params: CreateAuditLogParams) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, old_value, new_value, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      params.userId ?? null,
      params.userName ?? null,
      params.action,
      params.entityType,
      params.entityId ?? null,
      params.oldValue ? JSON.stringify(params.oldValue) : null,
      params.newValue ? JSON.stringify(params.newValue) : null,
      params.details ?? null,
      getUTCNow()
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

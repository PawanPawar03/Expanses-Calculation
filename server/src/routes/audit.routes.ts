import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { formatISTDisplay } from '../utils/istDate';
import { AuditLog } from '../types';

export const auditRouter = Router();

// GET /api/audit-logs - Admin Audit Trail
auditRouter.get('/', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, search, page = '1', limit = '50' } = req.query as Record<string, string>;

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (action && action !== 'all') {
      whereClauses.push('action = ?');
      params.push(action);
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereClauses.push('(user_name LIKE ? OR action LIKE ? OR details LIKE ? OR entity_type LIKE ?)');
      params.push(s, s, s, s);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    const countRow = db.prepare(`SELECT COUNT(id) as count FROM audit_logs ${whereSQL}`).get(...params) as { count: number };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const logs = db.prepare(`
      SELECT * FROM audit_logs
      ${whereSQL}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset) as AuditLog[];

    const formatted = logs.map((log) => ({
      ...log,
      created_at_ist: formatISTDisplay(log.created_at),
    }));

    return res.json({
      success: true,
      totalCount: countRow.count,
      page: pageNum,
      totalPages: Math.ceil(countRow.count / limitNum) || 1,
      logs: formatted,
    });
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

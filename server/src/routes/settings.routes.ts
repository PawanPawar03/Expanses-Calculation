import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { getUTCNow } from '../utils/istDate';
import { logAuditEvent } from '../services/audit.service';
import { AppSetting } from '../types';

export const settingsRouter = Router();

// GET /api/settings - Public & Authenticated app settings
settingsRouter.get('/', (_req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {
      websiteName: 'Whitehouse',
      tagline: 'Simple. Transparent. Shared Expenses.',
      currencySymbol: '₹',
      allowMemberRegistration: 'true',
    };

    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    return res.json({ success: true, settings: settingsMap });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

// PUT /api/settings - Admin update settings
settingsRouter.put('/', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { websiteName, tagline, currencySymbol, allowMemberRegistration } = req.body;

    const updates: Record<string, string> = {};
    if (websiteName !== undefined) updates.websiteName = String(websiteName).trim();
    if (tagline !== undefined) updates.tagline = String(tagline).trim();
    if (currencySymbol !== undefined) updates.currencySymbol = String(currencySymbol).trim();
    if (allowMemberRegistration !== undefined) updates.allowMemberRegistration = String(allowMemberRegistration);

    const now = getUTCNow();
    const upsertStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_by, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at
    `);

    db.transaction(() => {
      for (const [k, v] of Object.entries(updates)) {
        upsertStmt.run(k, v, req.user!.id, now);
      }
    })();

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'ADMIN_UPDATE_SETTINGS',
      entityType: 'Settings',
      newValue: updates,
      details: `Admin ${req.user!.name} updated application settings.`,
    });

    return res.json({ success: true, message: 'Settings saved successfully!' });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

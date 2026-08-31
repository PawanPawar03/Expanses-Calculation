import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { getUTCNow, getCurrentISTDateString, getISTDateRangePreset } from '../utils/istDate';
import { logAuditEvent } from '../services/audit.service';
import { User, ExpenseWithRelations } from '../types';

export const usersRouter = Router();

// GET /api/users - List members
usersRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';

    // Normal users only see active non-deleted users. Admins can see inactive too.
    const query = isAdmin
      ? `SELECT u.id, u.name, u.email, u.mobile, u.role, u.status, u.created_at, u.updated_at,
           COUNT(e.id) as expense_count,
           COALESCE(SUM(e.amount), 0) as total_paid
         FROM users u
         LEFT JOIN expenses e ON u.id = e.paid_by_user_id AND e.deleted_at IS NULL
         WHERE u.deleted_at IS NULL
         GROUP BY u.id
         ORDER BY u.name ASC`
      : `SELECT u.id, u.name, u.email, u.mobile, u.role, u.status, u.created_at, u.updated_at,
           COUNT(e.id) as expense_count,
           COALESCE(SUM(e.amount), 0) as total_paid
         FROM users u
         LEFT JOIN expenses e ON u.id = e.paid_by_user_id AND e.deleted_at IS NULL
         WHERE u.deleted_at IS NULL AND u.status = 'ACTIVE'
         GROUP BY u.id
         ORDER BY u.name ASC`;

    const users = db.prepare(query).all();
    return res.json({ success: true, users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch members.' });
  }
});

// GET /api/users/:id - Member profile & expense breakdown
usersRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid member ID.' });
    }

    const user = db.prepare(`
      SELECT id, name, email, mobile, role, status, created_at, updated_at
      FROM users
      WHERE id = ? AND deleted_at IS NULL
    `).get(userId) as User | undefined;

    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Dynamic IST calculations
    const today = getCurrentISTDateString();
    const { startDate: monthStart, endDate: monthEnd } = getISTDateRangePreset('thisMonth');

    // Total Paid & Count
    const totalRow = db.prepare(`
      SELECT COUNT(id) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE paid_by_user_id = ? AND deleted_at IS NULL
    `).get(userId) as { count: number; total: number };

    // Today Total
    const todayRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE paid_by_user_id = ? AND expense_date = ? AND deleted_at IS NULL
    `).get(userId, today) as { total: number };

    // This Month Total
    const monthRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE paid_by_user_id = ? AND expense_date >= ? AND expense_date <= ? AND deleted_at IS NULL
    `).get(userId, monthStart, monthEnd) as { total: number };

    // Expenses paid by this member
    const expenses = db.prepare(`
      SELECT e.*, c.name as category_name, c.icon as category_icon,
             p.name as paid_by_name, p.email as paid_by_email,
             cb.name as created_by_name, cb.email as created_by_email
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      JOIN users p ON e.paid_by_user_id = p.id
      JOIN users cb ON e.created_by_user_id = cb.id
      WHERE e.paid_by_user_id = ? AND e.deleted_at IS NULL
      ORDER BY e.expense_date DESC, e.expense_time DESC, e.id DESC
    `).all(userId) as ExpenseWithRelations[];

    return res.json({
      success: true,
      user,
      stats: {
        totalExpensesPaid: totalRow.total,
        numberOfExpenses: totalRow.count,
        thisMonthPaid: monthRow.total,
        todayPaid: todayRow.total,
      },
      expenses,
    });
  } catch (error: any) {
    console.error('Fetch user detail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch member details.' });
  }
});

// POST /api/users - Admin Add Member
const addUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

usersRouter.post('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = addUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const { name, email, mobile, password, role, status } = parsed.data;

    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A member with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = getUTCNow();

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, mobile, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), email.toLowerCase().trim(), passwordHash, mobile?.trim() || null, role, status, now, now);

    const newUserId = Number(result.lastInsertRowid);

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'ADMIN_CREATE_USER',
      entityType: 'User',
      entityId: newUserId,
      newValue: { name, email, role, status },
      details: `Admin ${req.user!.name} added new member: ${name} (${role})`,
    });

    return res.status(201).json({
      success: true,
      message: `Member ${name} added successfully!`,
      userId: newUserId,
    });
  } catch (error: any) {
    console.error('Add user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add member.' });
  }
});

// PUT /api/users/:id - Update Member (Admin or Self)
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  mobile: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: z.string().min(6).optional(),
});

usersRouter.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const isAdmin = req.user?.role === 'ADMIN';
    const isSelf = req.user?.id === userId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this profile.' });
    }

    const existing = db.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').get(userId) as User | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const { name, email, mobile, role, status, password } = parsed.data;

    // Check duplicate email
    if (email && email.toLowerCase().trim() !== existing.email.toLowerCase()) {
      const duplicate = db.prepare('SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL').get(email.toLowerCase().trim(), userId);
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'This email is already in use by another member.' });
      }
    }

    const newName = name !== undefined ? name.trim() : existing.name;
    const newEmail = email !== undefined ? email.toLowerCase().trim() : existing.email;
    const newMobile = mobile !== undefined ? (mobile ? mobile.trim() : null) : existing.mobile;
    const newRole = isAdmin && role !== undefined ? role : existing.role;
    const newStatus = isAdmin && status !== undefined ? status : existing.status;
    const newPasswordHash = password ? await bcrypt.hash(password, 10) : existing.password_hash;
    const now = getUTCNow();

    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, mobile = ?, role = ?, status = ?, password_hash = ?, updated_at = ?
      WHERE id = ?
    `).run(newName, newEmail, newMobile, newRole, newStatus, newPasswordHash, now, userId);

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: userId,
      oldValue: { name: existing.name, email: existing.email, role: existing.role, status: existing.status },
      newValue: { name: newName, email: newEmail, role: newRole, status: newStatus },
      details: `Member profile updated for ${newName}`,
    });

    return res.json({ success: true, message: 'Member updated successfully!' });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update member.' });
  }
});

// PATCH /api/users/:id/status - Admin Toggle Status
usersRouter.patch('/:id/status', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    // Prevent deactivating oneself if last admin
    if (userId === req.user!.id && status === 'INACTIVE') {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
    }

    const user = db.prepare('SELECT name, status FROM users WHERE id = ? AND deleted_at IS NULL').get(userId) as { name: string; status: string } | undefined;
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const now = getUTCNow();
    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, now, userId);

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: status === 'ACTIVE' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entityType: 'User',
      entityId: userId,
      details: `Admin ${req.user!.name} changed status of ${user.name} to ${status}`,
    });

    return res.json({ success: true, message: `Member ${user.name} marked as ${status}.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to change status.' });
  }
});

// DELETE /api/users/:id - Admin Soft Delete Member
usersRouter.delete('/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (userId === req.user!.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = db.prepare('SELECT name, email FROM users WHERE id = ? AND deleted_at IS NULL').get(userId) as { name: string; email: string } | undefined;
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const now = getUTCNow();
    // Soft delete to protect expense history and audit integrity
    db.prepare('UPDATE users SET deleted_at = ?, status = \'INACTIVE\', updated_at = ? WHERE id = ?').run(now, now, userId);

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'ADMIN_DELETE_USER',
      entityType: 'User',
      entityId: userId,
      details: `Admin ${req.user!.name} deleted member ${user.name} (${user.email})`,
    });

    return res.json({ success: true, message: `Member ${user.name} deleted successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete member.' });
  }
});

import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import {
  getUTCNow,
  getCurrentISTDateString,
  getCurrentISTTimeString,
  getISTDateRangePreset,
  formatISTDisplay,
} from '../utils/istDate';
import { logAuditEvent } from '../services/audit.service';
import { ExpenseWithRelations } from '../types';

export const expensesRouter = Router();

// Validation schema for Adding & Editing Expense
const expenseSchema = z.object({
  title: z.string().min(1, 'Expense title/name is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  categoryId: z.number().int().positive('Please select a valid category'),
  paidByUserId: z.number().int().positive('Please select who paid for this expense'),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  expenseTime: z.string().optional(),
});

// GET /api/expenses - List Expenses with full filter, search, pagination & sorting
expensesRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      preset,
      startDate,
      endDate,
      memberId,
      categoryId,
      sortBy = 'date_desc',
      search,
      page = '1',
      limit = '50',
      myExpensesOnly,
    } = req.query as Record<string, string>;

    const whereClauses: string[] = ['e.deleted_at IS NULL'];
    const params: any[] = [];

    // Filter by date preset or custom range
    if (preset && ['today', 'yesterday', 'last7days', 'thisMonth', 'lastMonth'].includes(preset)) {
      const range = getISTDateRangePreset(preset as any);
      whereClauses.push('e.expense_date >= ? AND e.expense_date <= ?');
      params.push(range.startDate, range.endDate);
    } else {
      if (startDate) {
        whereClauses.push('e.expense_date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('e.expense_date <= ?');
        params.push(endDate);
      }
    }

    // Filter by member
    if (myExpensesOnly === 'true' && req.user) {
      whereClauses.push('e.paid_by_user_id = ?');
      params.push(req.user.id);
    } else if (memberId && memberId !== 'all') {
      whereClauses.push('e.paid_by_user_id = ?');
      params.push(parseInt(memberId, 10));
    }

    // Filter by category
    if (categoryId && categoryId !== 'all') {
      whereClauses.push('e.category_id = ?');
      params.push(parseInt(categoryId, 10));
    }

    // Full search (title, location, description, member name, category name)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClauses.push(`(
        e.title LIKE ? OR 
        e.location LIKE ? OR 
        e.description LIKE ? OR 
        c.name LIKE ? OR 
        p.name LIKE ?
      )`);
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    let orderBy = 'e.expense_date DESC, e.expense_time DESC, e.id DESC';
    if (sortBy === 'amount_desc') orderBy = 'e.amount DESC';
    else if (sortBy === 'amount_asc') orderBy = 'e.amount ASC';
    else if (sortBy === 'date_asc') orderBy = 'e.expense_date ASC, e.expense_time ASC, e.id ASC';

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Summary calculation for the filtered dataset
    const summaryQuery = `
      SELECT COUNT(e.id) as total_count, COALESCE(SUM(e.amount), 0) as total_amount
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      JOIN users p ON e.paid_by_user_id = p.id
      JOIN users cb ON e.created_by_user_id = cb.id
      ${whereSQL}
    `;
    const summary = db.prepare(summaryQuery).get(...params) as { total_count: number; total_amount: number };

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Fetch records
    const listQuery = `
      SELECT e.*, 
             c.name as category_name, c.icon as category_icon,
             p.name as paid_by_name, p.email as paid_by_email,
             cb.name as created_by_name, cb.email as created_by_email
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      JOIN users p ON e.paid_by_user_id = p.id
      JOIN users cb ON e.created_by_user_id = cb.id
      ${whereSQL}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const expenses = db.prepare(listQuery).all(...params, limitNum, offset) as ExpenseWithRelations[];

    // Add IST formatted timestamp string for immediate display
    const formattedExpenses = expenses.map((exp) => ({
      ...exp,
      created_at_ist: formatISTDisplay(exp.created_at),
      updated_at_ist: formatISTDisplay(exp.updated_at),
    }));

    return res.json({
      success: true,
      summary: {
        totalAmount: summary.total_amount,
        totalCount: summary.total_count,
        page: pageNum,
        totalPages: Math.ceil(summary.total_count / limitNum) || 1,
      },
      expenses: formattedExpenses,
    });
  } catch (error: any) {
    console.error('Fetch expenses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch expenses.' });
  }
});

// GET /api/expenses/:id - Details of a single expense
expensesRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const expense = db.prepare(`
      SELECT e.*, 
             c.name as category_name, c.icon as category_icon,
             p.name as paid_by_name, p.email as paid_by_email,
             cb.name as created_by_name, cb.email as created_by_email
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      JOIN users p ON e.paid_by_user_id = p.id
      JOIN users cb ON e.created_by_user_id = cb.id
      WHERE e.id = ? AND e.deleted_at IS NULL
    `).get(id) as ExpenseWithRelations | undefined;

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    return res.json({
      success: true,
      expense: {
        ...expense,
        created_at_ist: formatISTDisplay(expense.created_at),
        updated_at_ist: formatISTDisplay(expense.updated_at),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch expense details.' });
  }
});

// POST /api/expenses - Add Expense
expensesRouter.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const {
      title,
      amount,
      categoryId,
      paidByUserId,
      location,
      description,
      expenseDate = getCurrentISTDateString(),
      expenseTime = getCurrentISTTimeString(),
    } = parsed.data;

    // Verify category exists
    const category = db.prepare('SELECT name FROM categories WHERE id = ?').get(categoryId) as { name: string } | undefined;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
    }

    // Verify paid by member exists
    const paidBy = db.prepare('SELECT name FROM users WHERE id = ? AND deleted_at IS NULL').get(paidByUserId) as { name: string } | undefined;
    if (!paidBy) {
      return res.status(400).json({ success: false, message: 'Selected payer member does not exist.' });
    }

    const nowUTC = getUTCNow();
    const createdByUserId = req.user!.id;

    const result = db.prepare(`
      INSERT INTO expenses (
        title, amount, category_id, paid_by_user_id, location, description, 
        expense_date, expense_time, created_by_user_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      amount,
      categoryId,
      paidByUserId,
      location?.trim() || null,
      description?.trim() || null,
      expenseDate,
      expenseTime,
      createdByUserId,
      nowUTC,
      nowUTC
    );

    const newExpenseId = Number(result.lastInsertRowid);

    // Audit trail
    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'CREATE_EXPENSE',
      entityType: 'Expense',
      entityId: newExpenseId,
      newValue: { title, amount, category: category.name, paidBy: paidBy.name, location, date: expenseDate, time: expenseTime },
      details: `${req.user!.name} added expense "${title}" ₹${amount} (Paid by ${paidBy.name})`,
    });

    return res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expenseId: newExpenseId,
    });
  } catch (error: any) {
    console.error('Create expense error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add expense.' });
  }
});

// PUT /api/expenses/:id - Edit Expense (Admin or Creator)
expensesRouter.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL').get(id) as ExpenseWithRelations | undefined;

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    const isAdmin = req.user?.role === 'ADMIN';
    const isCreator = req.user?.id === existing.created_by_user_id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify this expense.' });
    }

    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const {
      title,
      amount,
      categoryId,
      paidByUserId,
      location,
      description,
      expenseDate,
      expenseTime,
    } = parsed.data;

    const nowUTC = getUTCNow();

    db.prepare(`
      UPDATE expenses
      SET title = ?, amount = ?, category_id = ?, paid_by_user_id = ?, 
          location = ?, description = ?, expense_date = ?, expense_time = ?, updated_at = ?
      WHERE id = ?
    `).run(
      title.trim(),
      amount,
      categoryId,
      paidByUserId,
      location?.trim() || null,
      description?.trim() || null,
      expenseDate || existing.expense_date,
      expenseTime || existing.expense_time,
      nowUTC,
      id
    );

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'UPDATE_EXPENSE',
      entityType: 'Expense',
      entityId: id,
      oldValue: { title: existing.title, amount: existing.amount, categoryId: existing.category_id, paidBy: existing.paid_by_user_id },
      newValue: { title, amount, categoryId, paidByUserId },
      details: `${req.user!.name} edited expense "${title}" (₹${amount})`,
    });

    return res.json({ success: true, message: 'Expense updated successfully' });
  } catch (error: any) {
    console.error('Update expense error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update expense.' });
  }
});

// DELETE /api/expenses/:id - Soft Delete Expense (Admin only)
expensesRouter.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL').get(id) as ExpenseWithRelations | undefined;

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    // Only Admin can delete expenses
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only administrators can delete expenses.' });
    }

    const nowUTC = getUTCNow();
    db.prepare('UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE id = ?').run(nowUTC, nowUTC, id);

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'DELETE_EXPENSE',
      entityType: 'Expense',
      entityId: id,
      details: `Admin ${req.user!.name} deleted expense "${existing.title}" (₹${existing.amount})`,
    });

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
});

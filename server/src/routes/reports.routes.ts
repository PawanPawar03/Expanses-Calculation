import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import {
  getCurrentISTDateString,
  getISTDateRangePreset,
  getNowInIST,
  IST_TIMEZONE,
} from '../utils/istDate';
import { format, subDays, startOfYear, endOfYear } from 'date-fns';
import { format as formatZoned } from 'date-fns-tz';

export const reportsRouter = Router();

// GET /api/reports/summary - Key Dashboard KPI Cards
reportsRouter.get('/summary', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const today = getCurrentISTDateString();
    const { startDate: monthStart, endDate: monthEnd } = getISTDateRangePreset('thisMonth');

    // Total Members
    const totalMembersRow = db.prepare('SELECT COUNT(id) as count FROM users WHERE deleted_at IS NULL').get() as { count: number };
    
    // Active Members
    const activeMembersRow = db.prepare('SELECT COUNT(id) as count FROM users WHERE status = \'ACTIVE\' AND deleted_at IS NULL').get() as { count: number };

    // Total Expenses Amount & Count
    const totalExpensesRow = db.prepare(`
      SELECT COUNT(id) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE deleted_at IS NULL
    `).get() as { count: number; total: number };

    // Today's Expenses
    const todayExpensesRow = db.prepare(`
      SELECT COUNT(id) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE expense_date = ? AND deleted_at IS NULL
    `).get(today) as { count: number; total: number };

    // Current Month Expenses
    const monthExpensesRow = db.prepare(`
      SELECT COUNT(id) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ? AND deleted_at IS NULL
    `).get(monthStart, monthEnd) as { count: number; total: number };

    return res.json({
      success: true,
      summary: {
        totalMembers: totalMembersRow.count,
        activeMembers: activeMembersRow.count,
        totalExpensesCount: totalExpensesRow.count,
        totalAmountPaid: totalExpensesRow.total,
        todayExpenses: todayExpensesRow.total,
        todayExpensesCount: todayExpensesRow.count,
        currentMonthExpenses: monthExpensesRow.total,
        currentMonthExpensesCount: monthExpensesRow.count,
      },
    });
  } catch (error: any) {
    console.error('Fetch summary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch summary metrics.' });
  }
});

// GET /api/reports/members - Overall Member Matrix Table
reportsRouter.get('/members', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const today = getCurrentISTDateString();
    const { startDate: monthStart, endDate: monthEnd } = getISTDateRangePreset('thisMonth');

    // Total expenses grand total
    const grandRow = db.prepare('SELECT COALESCE(SUM(amount), 0) as grand_total FROM expenses WHERE deleted_at IS NULL').get() as { grand_total: number };
    const grandTotal = grandRow.grand_total || 1; // prevent divide by 0

    // Fetch all active members with aggregate stats
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.created_at
      FROM users u
      WHERE u.deleted_at IS NULL
      ORDER BY u.name ASC
    `).all() as any[];

    const memberStats = users.map((u) => {
      // Total Paid & Count
      const totalRow = db.prepare(`
        SELECT COUNT(id) as count, COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE paid_by_user_id = ? AND deleted_at IS NULL
      `).get(u.id) as { count: number; total: number };

      // Today Total
      const todayRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE paid_by_user_id = ? AND expense_date = ? AND deleted_at IS NULL
      `).get(u.id, today) as { total: number };

      // Month Total
      const monthRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE paid_by_user_id = ? AND expense_date >= ? AND expense_date <= ? AND deleted_at IS NULL
      `).get(u.id, monthStart, monthEnd) as { total: number };

      const percentage = grandRow.grand_total > 0 ? (totalRow.total / grandRow.grand_total) * 100 : 0;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        expenseCount: totalRow.count,
        totalPaid: totalRow.total,
        thisMonthPaid: monthRow.total,
        todayPaid: todayRow.total,
        percentage: Number(percentage.toFixed(1)),
      };
    });

    return res.json({
      success: true,
      grandTotal: grandRow.grand_total,
      members: memberStats,
    });
  } catch (error: any) {
    console.error('Fetch member reports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch member report.' });
  }
});

// GET /api/reports/categories - Category-wise Spend
reportsRouter.get('/categories', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = db.prepare(`
      SELECT c.id, c.name, c.icon,
             COUNT(e.id) as count,
             COALESCE(SUM(e.amount), 0) as total
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id AND e.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY total DESC
    `).all() as any[];

    const grandRow = db.prepare('SELECT COALESCE(SUM(amount), 0) as grand_total FROM expenses WHERE deleted_at IS NULL').get() as { grand_total: number };
    const grandTotal = grandRow.grand_total || 0;

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      count: cat.count,
      total: cat.total,
      percentage: grandTotal > 0 ? Number(((cat.total / grandTotal) * 100).toFixed(1)) : 0,
    }));

    return res.json({ success: true, grandTotal, categories: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch category report.' });
  }
});

// GET /api/reports/monthly - Monthly Spending for current year
reportsRouter.get('/monthly', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const now = getNowInIST();
    const currentYear = formatZoned(now, 'yyyy', { timeZone: IST_TIMEZONE });

    const rows = db.prepare(`
      SELECT SUBSTR(expense_date, 1, 7) as month,
             COALESCE(SUM(amount), 0) as total,
             COUNT(id) as count
      FROM expenses
      WHERE expense_date LIKE ? AND deleted_at IS NULL
      GROUP BY SUBSTR(expense_date, 1, 7)
      ORDER BY month ASC
    `).all(`${currentYear}-%`) as { month: string; total: number; count: number }[];

    // Generate 12 months array for full visualization
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthNames.map((name, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      const key = `${currentYear}-${monthNum}`;
      const found = rows.find((r) => r.month === key);
      return {
        month: `${name} ${currentYear}`,
        monthKey: key,
        name,
        total: found ? found.total : 0,
        count: found ? found.count : 0,
      };
    });

    return res.json({ success: true, year: currentYear, monthlyData });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch monthly report.' });
  }
});

// GET /api/reports/daily - Daily Trend (Last 14 days)
reportsRouter.get('/daily', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const now = getNowInIST();
    const days: { date: string; displayDate: string; total: number; count: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = formatZoned(d, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE });
      const displayDate = formatZoned(d, 'dd MMM', { timeZone: IST_TIMEZONE });

      const row = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total, COUNT(id) as count
        FROM expenses
        WHERE expense_date = ? AND deleted_at IS NULL
      `).get(dateStr) as { total: number; count: number };

      days.push({
        date: dateStr,
        displayDate,
        total: row.total,
        count: row.count,
      });
    }

    return res.json({ success: true, days });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch daily report.' });
  }
});

import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { getUTCNow } from '../utils/istDate';
import { logAuditEvent } from '../services/audit.service';
import { Category } from '../types';

export const categoriesRouter = Router();

// GET /api/categories
categoriesRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const query = isAdmin
      ? `SELECT c.*, COUNT(e.id) as expense_count, COALESCE(SUM(e.amount), 0) as total_spent
         FROM categories c
         LEFT JOIN expenses e ON c.id = e.category_id AND e.deleted_at IS NULL
         GROUP BY c.id
         ORDER BY c.name ASC`
      : `SELECT c.*, COUNT(e.id) as expense_count, COALESCE(SUM(e.amount), 0) as total_spent
         FROM categories c
         LEFT JOIN expenses e ON c.id = e.category_id AND e.deleted_at IS NULL
         WHERE c.status = 'ACTIVE'
         GROUP BY c.id
         ORDER BY c.name ASC`;

    const categories = db.prepare(query).all();
    return res.json({ success: true, categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().nullable(),
  icon: z.string().optional().default('Receipt'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

// POST /api/categories - Admin Add Category
categoriesRouter.post('/', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const { name, description, icon, status } = parsed.data;

    const existing = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(name.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists.' });
    }

    const now = getUTCNow();
    const result = db.prepare(`
      INSERT INTO categories (name, description, icon, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), description?.trim() || null, icon || 'Receipt', status, now, now);

    const categoryId = Number(result.lastInsertRowid);

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'ADMIN_CREATE_CATEGORY',
      entityType: 'Category',
      entityId: categoryId,
      newValue: { name, description, icon, status },
      details: `Admin ${req.user!.name} created category: ${name}`,
    });

    return res.status(201).json({ success: true, message: 'Category created successfully!', categoryId });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id - Admin Update Category
categoriesRouter.put('/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { name, description, icon, status } = parsed.data;

    // Check duplicate
    const duplicate = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?').get(name.trim(), id);
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Another category with this name already exists.' });
    }

    const now = getUTCNow();
    db.prepare(`
      UPDATE categories
      SET name = ?, description = ?, icon = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(name.trim(), description?.trim() || null, icon || existing.icon || 'Receipt', status, now, id);

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'ADMIN_UPDATE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      oldValue: existing,
      newValue: { name, description, icon, status },
      details: `Admin ${req.user!.name} updated category: ${name}`,
    });

    return res.json({ success: true, message: 'Category updated successfully!' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id - Admin Toggle or Delete Category
categoriesRouter.delete('/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check if category is used in active expenses
    const used = db.prepare('SELECT COUNT(id) as count FROM expenses WHERE category_id = ? AND deleted_at IS NULL').get(id) as { count: number };
    if (used.count > 0) {
      // If used, toggle to INACTIVE instead of deleting to preserve referential integrity
      const now = getUTCNow();
      db.prepare('UPDATE categories SET status = \'INACTIVE\', updated_at = ? WHERE id = ?').run(now, id);
      return res.json({
        success: true,
        message: `Category is attached to ${used.count} expense(s); it has been deactivated instead of permanently deleted.`,
      });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'ADMIN_DELETE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      details: `Admin ${req.user!.name} deleted category: ${existing.name}`,
    });

    return res.json({ success: true, message: `Category ${existing.name} deleted successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
});

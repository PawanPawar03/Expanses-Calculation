import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { config } from '../config';
import { getUTCNow } from '../utils/istDate';
import { logAuditEvent } from '../services/audit.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../types';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    const { name, email, mobile, password } = parsed.data;

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL').get(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = getUTCNow();

    // Default role is USER (do not allow self-registration as ADMIN)
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, mobile, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'USER', 'ACTIVE', ?, ?)
    `).run(name.trim(), email.toLowerCase().trim(), passwordHash, mobile?.trim() || null, now, now);

    const newUserId = Number(result.lastInsertRowid);

    logAuditEvent({
      userId: newUserId,
      userName: name,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: newUserId,
      details: `New member self-registered: ${name} (${email})`,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please login with your credentials.',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again later.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid input fields.' });
    }

    const cleanInput = email.toLowerCase().trim();
    const user = db.prepare(`
      SELECT id, name, email, password_hash, mobile, role, status, created_at, updated_at 
      FROM users 
      WHERE (LOWER(email) = ? OR LOWER(name) = ? OR (LOWER(email) LIKE ? AND (role = 'ADMIN' OR LOWER(name) LIKE ?))) AND deleted_at IS NULL
    `).get(cleanInput, cleanInput, `${cleanInput}%`, `%${cleanInput}%`) as User | undefined;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn }
    );

    const { password_hash, ...publicUser } = user;

    logAuditEvent({
      userId: user.id,
      userName: user.name,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: `User logged in: ${user.name} (${user.role})`,
    });

    return res.json({
      success: true,
      token,
      user: publicUser,
      message: `Welcome back, ${user.name}!`,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again later.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const { password_hash, ...publicUser } = req.user;
  return res.json({ success: true, user: publicUser });
});

// POST /api/auth/change-password
authRouter.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = db.prepare('SELECT id, name, password_hash FROM users WHERE id = ?').get(req.user!.id) as User;
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const now = getUTCNow();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, user.id);

    logAuditEvent({
      userId: user.id,
      userName: user.name,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: user.id,
      details: `User ${user.name} changed their password.`,
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

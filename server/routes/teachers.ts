import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, execute } from '../db/database.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { broadcastEvent } from './events.ts';

export const teachersRouter = Router();

// List all teachers
teachersRouter.get('/', requireAuth, (req, res) => {
  const teachers = queryAll(`
    SELECT t.id, t.user_id as userId, t.name, t.email, t.username, t.phone, t.subject,
           t.status, t.scan_count as scanCount, t.created_at as createdAt,
           u.last_login as lastLogin
    FROM teachers t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.name ASC
  `);
  res.json(teachers);
});

// Get single teacher
teachersRouter.get('/:id', requireAuth, (req, res): void => {
  const teacher = queryOne(
    `SELECT t.id, t.user_id as userId, t.name, t.email, t.username, t.phone, t.subject,
            t.status, t.scan_count as scanCount, t.created_at as createdAt,
            u.last_login as lastLogin
     FROM teachers t
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.id = ? OR t.user_id = ?`,
    [req.params.id, req.params.id]
  );

  if (!teacher) {
    res.status(404).json({ error: 'Teacher not found.' });
    return;
  }

  res.json(teacher);
});

// Create teacher (Admin only)
teachersRouter.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, username, phone, subject, password = 'teacher123' } = req.body;

    if (!name || !email || !username) {
      res.status(400).json({ error: 'Name, email, and username are required.' });
      return;
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    // Check existing
    const existing = queryOne(
      'SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [cleanUsername, cleanEmail]
    );

    if (existing) {
      res.status(400).json({ error: 'A user with this username or email already exists.' });
      return;
    }

    const userId = `usr-tch-${Date.now()}`;
    const allTeachers = queryAll<{ id: string }>('SELECT id FROM teachers');
    const teacherId = `tch-${String(allTeachers.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    execute(
      `INSERT INTO users (id, name, username, email, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'TEACHER', 'ACTIVE', ?, ?)`,
      [userId, name.trim(), cleanUsername, cleanEmail, passwordHash, now, now]
    );

    // Create teacher record
    execute(
      `INSERT INTO teachers (id, user_id, name, email, username, phone, subject, status, scan_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, ?)`,
      [teacherId, userId, name.trim(), cleanEmail, cleanUsername, phone?.trim() || '', subject?.trim() || 'General Educator', now]
    );

    const newTeacher = {
      id: teacherId,
      userId,
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      phone: phone?.trim() || '',
      subject: subject?.trim() || 'General Educator',
      status: 'ACTIVE',
      scanCount: 0,
      createdAt: now,
    };

    broadcastEvent('teachers_updated', { action: 'created', teacher: newTeacher });

    res.status(201).json(newTeacher);
  } catch (err: any) {
    console.error('Create teacher error:', err);
    res.status(500).json({ error: 'Failed to create teacher.' });
  }
});

// Update teacher (Admin only)
teachersRouter.put('/:id', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM teachers WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Teacher not found.' });
      return;
    }

    const { name, email, phone, subject, status } = req.body;
    const updatedName = name !== undefined ? String(name).trim() : existing.name;
    const updatedEmail = email !== undefined ? String(email).trim().toLowerCase() : existing.email;
    const updatedPhone = phone !== undefined ? String(phone).trim() : existing.phone;
    const updatedSubject = subject !== undefined ? String(subject).trim() : existing.subject;
    const updatedStatus = status !== undefined ? status : existing.status;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    execute(
      `UPDATE teachers
       SET name = ?, email = ?, phone = ?, subject = ?, status = ?
       WHERE id = ?`,
      [updatedName, updatedEmail, updatedPhone, updatedSubject, updatedStatus, id]
    );

    // Also update linked user
    execute(
      `UPDATE users
       SET name = ?, email = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [updatedName, updatedEmail, updatedStatus, now, existing.user_id]
    );

    const updatedTeacher = {
      id,
      userId: existing.user_id,
      name: updatedName,
      email: updatedEmail,
      username: existing.username,
      phone: updatedPhone,
      subject: updatedSubject,
      status: updatedStatus,
      scanCount: existing.scan_count,
      createdAt: existing.created_at,
    };

    broadcastEvent('teachers_updated', { action: 'updated', teacher: updatedTeacher });

    res.json(updatedTeacher);
  } catch (err: any) {
    console.error('Update teacher error:', err);
    res.status(500).json({ error: 'Failed to update teacher.' });
  }
});

// Delete teacher (Admin only)
teachersRouter.delete('/:id', requireAuth, requireRole('ADMIN'), (req, res): void => {
  const { id } = req.params;
  const existing = queryOne('SELECT user_id FROM teachers WHERE id = ?', [id]);
  if (!existing) {
    res.status(404).json({ error: 'Teacher not found.' });
    return;
  }

  execute('DELETE FROM teachers WHERE id = ?', [id]);
  execute('DELETE FROM users WHERE id = ?', [existing.user_id]);

  broadcastEvent('teachers_updated', { action: 'deleted', teacherId: id });

  res.json({ message: 'Teacher deleted successfully.' });
});

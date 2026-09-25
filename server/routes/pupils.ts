import { Router } from 'express';
import type { Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { broadcastEvent } from './events.ts';

export const pupilsRouter = Router();

// List all pupils
pupilsRouter.get('/', requireAuth, (req, res) => {
  const pupils = queryAll(`
    SELECT id, student_id as studentId, name, class, grade, status, photo,
           face_descriptor_json as faceDescriptorJson, created_at as createdAt, updated_at as updatedAt
    FROM pupils
    ORDER BY grade DESC, class ASC, name ASC
  `);
  res.json(pupils);
});

// Get single pupil
pupilsRouter.get('/:id', requireAuth, (req, res): void => {
  const pupil = queryOne(
    `SELECT id, student_id as studentId, name, class, grade, status, photo,
            face_descriptor_json as faceDescriptorJson, created_at as createdAt, updated_at as updatedAt
     FROM pupils WHERE id = ? OR UPPER(student_id) = UPPER(?)`,
    [req.params.id, req.params.id]
  );

  if (!pupil) {
    res.status(404).json({ error: 'Pupil not found.' });
    return;
  }

  res.json(pupil);
});

// Helper for default avatars
function makeDefaultPupilAvatar(name: string, index: number = 0): string {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const hues = ['#0C4A34', '#1E3A8A', '#0F766E', '#312E81', '#14532D'];
  const bg = hues[index % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120"><rect width="100" height="120" fill="${bg}"/><circle cx="50" cy="40" r="21" fill="#F8FAFC"/><path d="M 20 115 C 20 80 34 70 50 70 C 66 70 80 80 80 115 Z" fill="#F8FAFC" fill-opacity="0.9"/><polygon points="50,70 44,90 50,100 56,90" fill="#EAB308"/><text x="50" y="47" font-family="sans-serif" font-size="14" font-weight="900" fill="${bg}" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Create pupil
pupilsRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { name, grade, class: pupilClass, status = 'ACTIVE', photo, studentId } = req.body;

    if (!name || !grade || !pupilClass) {
      res.status(400).json({ error: 'Name, grade, and class are required.' });
      return;
    }

    // Auto-generate student ID if not provided
    let finalStudentId = studentId ? String(studentId).trim().toUpperCase() : '';
    if (!finalStudentId) {
      const all = queryAll<{ student_id: string }>('SELECT student_id FROM pupils');
      const maxNum = all.reduce((max, p) => {
        const match = p.student_id.match(/\d+$/);
        const num = match ? parseInt(match[0], 10) : 0;
        return num > max ? num : max;
      }, 0);
      finalStudentId = `STU-${String(maxNum + 1).padStart(6, '0')}`;
    }

    // Check duplicate studentId
    const existing = queryOne('SELECT id FROM pupils WHERE UPPER(student_id) = ?', [finalStudentId]);
    if (existing) {
      res.status(400).json({ error: `Student ID "${finalStudentId}" already exists.` });
      return;
    }

    const id = `pup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const finalPhoto = photo || makeDefaultPupilAvatar(name);

    execute(
      `INSERT INTO pupils (id, student_id, name, class, grade, status, photo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, finalStudentId, name.trim(), pupilClass.trim().toUpperCase(), String(grade).trim(), status, finalPhoto, now, now]
    );

    const newPupil = {
      id,
      studentId: finalStudentId,
      name: name.trim(),
      class: pupilClass.trim().toUpperCase(),
      grade: String(grade).trim(),
      status,
      photo: finalPhoto,
      createdAt: now,
      updatedAt: now,
    };

    broadcastEvent('pupils_updated', { action: 'created', pupil: newPupil });

    res.status(201).json(newPupil);
  } catch (err: any) {
    console.error('Create pupil error:', err);
    res.status(500).json({ error: 'Failed to create pupil.' });
  }
});

// Update pupil
pupilsRouter.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM pupils WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Pupil not found.' });
      return;
    }

    const { name, grade, class: pupilClass, status, photo, studentId } = req.body;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updatedStudentId = studentId ? String(studentId).trim().toUpperCase() : existing.student_id;
    const updatedName = name !== undefined ? String(name).trim() : existing.name;
    const updatedClass = pupilClass !== undefined ? String(pupilClass).trim().toUpperCase() : existing.class;
    const updatedGrade = grade !== undefined ? String(grade).trim() : existing.grade;
    const updatedStatus = status !== undefined ? status : existing.status;
    const updatedPhoto = photo !== undefined ? photo : existing.photo;

    execute(
      `UPDATE pupils
       SET student_id = ?, name = ?, class = ?, grade = ?, status = ?, photo = ?, updated_at = ?
       WHERE id = ?`,
      [updatedStudentId, updatedName, updatedClass, updatedGrade, updatedStatus, updatedPhoto, now, id]
    );

    const updatedPupil = {
      id,
      studentId: updatedStudentId,
      name: updatedName,
      class: updatedClass,
      grade: updatedGrade,
      status: updatedStatus,
      photo: updatedPhoto,
      createdAt: existing.created_at,
      updatedAt: now,
    };

    broadcastEvent('pupils_updated', { action: 'updated', pupil: updatedPupil });

    res.json(updatedPupil);
  } catch (err: any) {
    console.error('Update pupil error:', err);
    res.status(500).json({ error: 'Failed to update pupil.' });
  }
});

// Delete pupil (Admin only)
pupilsRouter.delete('/:id', requireAuth, requireRole('ADMIN'), (req, res): void => {
  const { id } = req.params;
  const existing = queryOne('SELECT id FROM pupils WHERE id = ?', [id]);
  if (!existing) {
    res.status(404).json({ error: 'Pupil not found.' });
    return;
  }

  execute('DELETE FROM pupils WHERE id = ?', [id]);
  broadcastEvent('pupils_updated', { action: 'deleted', pupilId: id });
  res.json({ message: 'Pupil deleted successfully.' });
});

// Bulk import pupils (Module 5)
pupilsRouter.post('/bulk', requireAuth, requireRole('ADMIN'), (req, res): void => {
  try {
    const { pupils: rawList } = req.body;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      res.status(400).json({ error: 'Expected non-empty "pupils" array.' });
      return;
    }

    const inserted: any[] = [];
    const errors: { row: number; reason: string }[] = [];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const allPupils = queryAll<{ student_id: string }>('SELECT student_id FROM pupils');
    let maxNum = allPupils.reduce((max, p) => {
      const match = p.student_id.match(/\d+$/);
      const num = match ? parseInt(match[0], 10) : 0;
      return num > max ? num : max;
    }, 0);

    const existingIds = new Set(allPupils.map(p => p.student_id.toUpperCase()));

    rawList.forEach((item: any, index: number) => {
      const name = item.name ? String(item.name).trim() : '';
      const grade = item.grade ? String(item.grade).trim() : '';
      const pClass = (item.class || item.classSection || 'A').toString().trim().toUpperCase();

      if (!name || !grade) {
        errors.push({ row: index + 1, reason: 'Missing pupil name or grade.' });
        return;
      }

      let studentId = item.studentId ? String(item.studentId).trim().toUpperCase() : '';
      if (!studentId) {
        maxNum++;
        studentId = `STU-${String(maxNum).padStart(6, '0')}`;
      }

      if (existingIds.has(studentId)) {
        errors.push({ row: index + 1, reason: `Student ID "${studentId}" already exists.` });
        return;
      }

      existingIds.add(studentId);
      const id = `pup-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
      const photo = item.photo || makeDefaultPupilAvatar(name, index);

      execute(
        `INSERT INTO pupils (id, student_id, name, class, grade, status, photo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, studentId, name, pClass, grade, 'ACTIVE', photo, now, now]
      );

      inserted.push({
        id,
        studentId,
        name,
        class: pClass,
        grade,
        status: 'ACTIVE',
        photo,
        createdAt: now,
      });
    });

    if (inserted.length > 0) {
      broadcastEvent('pupils_updated', { action: 'bulk_imported', count: inserted.length });
    }

    res.json({
      success: true,
      importedCount: inserted.length,
      errorCount: errors.length,
      errors,
      pupils: inserted,
    });
  } catch (err: any) {
    console.error('Bulk import error:', err);
    res.status(500).json({ error: 'Failed to process bulk import.' });
  }
});

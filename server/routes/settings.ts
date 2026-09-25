import { Router } from 'express';
import type { Response } from 'express';
import { queryOne, execute } from '../db/database.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { broadcastEvent } from './events.ts';

export const settingsRouter = Router();

// Get settings
settingsRouter.get('/', (req, res) => {
  const row = queryOne('SELECT * FROM school_settings WHERE id = 1');
  if (!row) {
    res.json({
      schoolName: 'Limbando Private School',
      schoolMotto: 'Knowledge · Discipline · Success',
      academicYear: '2026 - 2027 Academic Year',
      duplicateScanCooldownSeconds: 60,
      audioFeedbackEnabled: true,
      allowTeacherEditPupil: true,
    });
    return;
  }

  res.json({
    schoolName: row.school_name,
    schoolMotto: row.school_motto,
    academicYear: row.academic_year,
    duplicateScanCooldownSeconds: row.duplicate_cooldown_seconds,
    audioFeedbackEnabled: Boolean(row.audio_feedback_enabled),
    allowTeacherEditPupil: Boolean(row.allow_teacher_edit_pupil),
  });
});

// Update settings (Admin only)
settingsRouter.put('/', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const {
      schoolName,
      schoolMotto,
      academicYear,
      duplicateScanCooldownSeconds,
      audioFeedbackEnabled,
      allowTeacherEditPupil,
    } = req.body;

    execute(
      `UPDATE school_settings
       SET school_name = ?, school_motto = ?, academic_year = ?,
           duplicate_cooldown_seconds = ?, audio_feedback_enabled = ?, allow_teacher_edit_pupil = ?
       WHERE id = 1`,
      [
        schoolName || 'Limbando Private School',
        schoolMotto || 'Knowledge · Discipline · Success',
        academicYear || '2026 - 2027 Academic Year',
        Number(duplicateScanCooldownSeconds) || 60,
        audioFeedbackEnabled ? 1 : 0,
        allowTeacherEditPupil ? 1 : 0,
      ]
    );

    const updated = {
      schoolName,
      schoolMotto,
      academicYear,
      duplicateScanCooldownSeconds: Number(duplicateScanCooldownSeconds),
      audioFeedbackEnabled: Boolean(audioFeedbackEnabled),
      allowTeacherEditPupil: Boolean(allowTeacherEditPupil),
    };

    broadcastEvent('settings_updated', updated);

    res.json(updated);
  } catch (err: any) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

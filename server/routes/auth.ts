import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, queryAll, execute } from '../db/database.ts';
import { signToken, requireAuth } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export const authRouter = Router();

// Login
authRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username/email and password are required.' });
      return;
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // Find user by username OR email
    const user = queryOne(
      'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [cleanUsername, cleanUsername]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    if (user.status === 'INACTIVE') {
      res.status(403).json({ error: 'Account is deactivated. Contact school administration.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    // Update last_login
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    execute('UPDATE users SET last_login = ? WHERE id = ?', [now, user.id]);

    const authUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role as 'ADMIN' | 'TEACHER',
      status: user.status,
    };

    const token = signToken(authUser);

    res.json({
      token,
      user: {
        ...authUser,
        lastLogin: now,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// Current User Profile / Session Recovery
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = queryOne(
    'SELECT id, name, username, email, role, status, last_login, created_at FROM users WHERE id = ?',
    [req.user!.id]
  );

  if (!user) {
    res.status(404).json({ error: 'User record not found.' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    },
  });
});

// Update Password
authRouter.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const user = queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user!.id]);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, req.user!.id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

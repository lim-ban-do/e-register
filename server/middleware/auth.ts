import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'limbando_school_jwt_secret_key_2026';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'TEACHER';
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    // Also support token query param for EventSource / SSE
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }

  req.user = decoded;
  next();
}

export function requireRole(role: 'ADMIN' | 'TEACHER') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: `Forbidden: Requires ${role} privileges.` });
      return;
    }

    next();
  };
}

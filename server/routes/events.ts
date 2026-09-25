import { Router } from 'express';
import type { Response } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export const eventsRouter = Router();

interface Client {
  id: string;
  userId: string;
  role: string;
  res: Response;
}

const clients: Map<string, Client> = new Map();

// SSE subscription endpoint
eventsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clientId = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx/Cloud Run
  res.flushHeaders?.();

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId, user: { id: user.id, name: user.name } })}\n\n`);

  clients.set(clientId, {
    id: clientId,
    userId: user.id,
    role: user.role,
    res,
  });

  // Keep alive ping every 25 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      clients.delete(clientId);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
  });
});

// Broadcast event to all or specific roles
export function broadcastEvent(type: string, payload: any, targetRole?: 'ADMIN' | 'TEACHER'): void {
  const message = `data: ${JSON.stringify({ type, payload, timestamp: new Date().toISOString() })}\n\n`;

  clients.forEach((client, id) => {
    if (!targetRole || client.role === targetRole) {
      try {
        client.res.write(message);
      } catch (err) {
        console.error(`Failed to send event to client ${id}:`, err);
        clients.delete(id);
      }
    }
  });
}

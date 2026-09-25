import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { getDb } from './server/db/database.ts';
import { authRouter } from './server/routes/auth.ts';
import { pupilsRouter } from './server/routes/pupils.ts';
import { teachersRouter } from './server/routes/teachers.ts';
import { attendanceRouter } from './server/routes/attendance.ts';
import { scansRouter } from './server/routes/scans.ts';
import { settingsRouter } from './server/routes/settings.ts';
import { aiRouter } from './server/routes/ai.ts';
import { eventsRouter } from './server/routes/events.ts';
import { exportRouter } from './server/routes/export.ts';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize SQLite database & migrations
  console.log('[Server] Initializing persistent SQLite database...');
  await getDb();
  console.log('[Server] Database ready.');

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/pupils', pupilsRouter);
  app.use('/api/teachers', teachersRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/scans', scansRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/export', exportRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: isProduction ? 'production' : 'development',
    });
  });

  if (!isProduction) {
    // Development mode: Mount Vite dev middleware
    console.log('[Server] Mounting Vite development middlewares...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve compiled static files
    console.log('[Server] Serving production static files from dist/...');
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Production build not found. Please run "npm run build".');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Limbando School Access Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

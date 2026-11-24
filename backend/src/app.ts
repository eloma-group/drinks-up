import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config.js';
import { errorHandler } from './lib/http.js';
import { UPLOAD_DIR } from './lib/storage.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Azure App Service / Static Web Apps sit in front
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: false,
  }));
  app.use(compression());
  app.use(express.json({ limit: '200kb' }));

  app.use('/api/uploads', express.static(UPLOAD_DIR, { maxAge: '365d', immutable: true }));
  app.use('/api/admin', adminRouter);
  app.use('/api', publicRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.get('/', (_req, res) => res.json({ name: 'Drinks Up API', health: '/api/health' }));
  app.use(errorHandler);
  return app;
}

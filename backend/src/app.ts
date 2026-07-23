import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config/db';
import { logger } from './config/logger';
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';

const isTest = process.env.NODE_ENV === 'test';

export const app = express();

// Structured request logging.
app.use(pinoHttp({ logger }));

// Security headers.
app.use(helmet());

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));

// Global rate limit: protects every endpoint from abuse.
// Skipped under tests so the suite isn't throttled.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: () => isTest,
});
app.use(globalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;

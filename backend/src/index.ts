import express from 'express';
import cors from 'cors';
import { config, pool } from './config/db';
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

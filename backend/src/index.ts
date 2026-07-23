import { app } from './app';
import { config, pool } from './config/db';
import { logger } from './config/logger';

async function start() {
  try {
    await pool.query('SELECT 1');
    logger.info('Connected to PostgreSQL');

    app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

start();

import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../errors';
import { logger } from '../config/logger';

/**
 * Central error handler. Converts known error types into clean JSON
 * responses and logs anything unexpected (without leaking internals to
 * the client).
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.errors[0]?.message ?? 'Invalid input' });
    return;
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error({ err }, err.message);
    }
    res.status(err.status).json({ error: err.message });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
};

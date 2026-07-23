import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

/**
 * Application logger.
 * - test: silenced to keep test output clean
 * - development: pretty-printed, colorized
 * - production: structured JSON (one line per event) for log aggregators
 */
export const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
  ...(isProd || isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }),
});

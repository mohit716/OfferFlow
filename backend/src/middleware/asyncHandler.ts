import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any thrown error (or rejected promise) is
 * forwarded to Express's error handling chain instead of crashing or hanging.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

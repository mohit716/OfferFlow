import { Router, Request, Response, CookieOptions } from 'express';
import rateLimit from 'express-rate-limit';
import * as authService from '../services/authService';
import * as refreshTokenService from '../services/refreshTokenService';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { NotFoundError } from '../errors';
import { config } from '../config/db';

const router = Router();

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: config.refreshTokenTtlMs,
};

async function setRefreshCookie(res: Response, userId: number): Promise<void> {
  const raw = await refreshTokenService.issueRefreshToken(userId);
  res.cookie(REFRESH_COOKIE, raw, refreshCookieOptions);
}

// Stricter limit on auth endpoints to slow down credential brute-forcing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post(
  '/signup',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    const result = await authService.signup(email, password, name);
    await setRefreshCookie(res, result.user.id);
    res.status(201).json(result);
  })
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    await setRefreshCookie(res, result.user.id);
    res.json(result);
  })
);

// Exchange a valid refresh cookie for a new access token (and rotate the
// refresh token). Used on page load and when an access token expires.
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const { userId, newToken } =
      await refreshTokenService.rotateRefreshToken(raw);

    res.cookie(REFRESH_COOKIE, newToken, refreshCookieOptions);

    const user = await authService.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({ user, token: authService.signAccessToken(userId) });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    await refreshTokenService.revokeRefreshToken(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.status(204).send();
  })
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getUserById(req.userId!);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    res.json({ user });
  })
);

export default router;

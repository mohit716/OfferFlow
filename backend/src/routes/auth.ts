import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import * as authService from '../services/authService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.signup(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    if (error instanceof Error && error.message === 'Email already registered') {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    if (error instanceof Error && error.message === 'Invalid email or password') {
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;

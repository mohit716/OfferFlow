import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import * as applicationService from '../services/applicationService';
import { authMiddleware } from '../middleware/auth';
import { ApplicationStatus } from '../types';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const stats = await applicationService.getDashboardStats(req.userId!);
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      company: req.query.company as string | undefined,
      role: req.query.role as string | undefined,
      status: req.query.status as ApplicationStatus | undefined,
    };

    const applications = await applicationService.getApplications(
      req.userId!,
      filters
    );
    res.json({ applications });
  } catch {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid application ID' });
      return;
    }

    const application = await applicationService.getApplicationById(
      req.userId!,
      id
    );

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json({ application });
  } catch {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const application = await applicationService.createApplication(
      req.userId!,
      req.body
    );
    res.status(201).json({ application });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Failed to create application' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid application ID' });
      return;
    }

    const application = await applicationService.updateApplication(
      req.userId!,
      id,
      req.body
    );

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json({ application });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Failed to update application' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid application ID' });
      return;
    }

    const deleted = await applicationService.deleteApplication(req.userId!, id);

    if (!deleted) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;

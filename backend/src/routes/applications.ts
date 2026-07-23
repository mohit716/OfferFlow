import { Router, Request, Response } from 'express';
import * as applicationService from '../services/applicationService';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { BadRequestError, NotFoundError } from '../errors';
import { ApplicationStatus } from '../types';

const router = Router();

router.use(authMiddleware);

function parseId(raw: string): number {
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    throw new BadRequestError('Invalid application ID');
  }
  return id;
}

function parseNum(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await applicationService.getDashboardStats(req.userId!);
    res.json(stats);
  })
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      company: req.query.company as string | undefined,
      role: req.query.role as string | undefined,
      status: req.query.status as ApplicationStatus | undefined,
      limit: parseNum(req.query.limit),
      offset: parseNum(req.query.offset),
    };

    const result = await applicationService.getApplications(
      req.userId!,
      filters
    );
    res.json(result);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(String(req.params.id));
    const application = await applicationService.getApplicationById(
      req.userId!,
      id
    );
    if (!application) {
      throw new NotFoundError('Application not found');
    }
    res.json({ application });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const application = await applicationService.createApplication(
      req.userId!,
      req.body
    );
    res.status(201).json({ application });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(String(req.params.id));
    const application = await applicationService.updateApplication(
      req.userId!,
      id,
      req.body
    );
    if (!application) {
      throw new NotFoundError('Application not found');
    }
    res.json({ application });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(String(req.params.id));
    const deleted = await applicationService.deleteApplication(req.userId!, id);
    if (!deleted) {
      throw new NotFoundError('Application not found');
    }
    res.status(204).send();
  })
);

export default router;

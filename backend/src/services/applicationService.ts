import { z } from 'zod';
import { pool } from '../config/db';
import {
  Application,
  ApplicationStatus,
  APPLICATION_STATUSES,
  DashboardStats,
} from '../types';

const applicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string().optional().nullable(),
  salary: z.string().optional().nullable(),
  job_link: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().url('Invalid URL').nullable().optional()
  ),
  status: z.enum(['Applied', 'OA', 'Interview', 'Offer', 'Rejected']).optional(),
  notes: z.string().optional().nullable(),
});

const updateApplicationSchema = applicationSchema.partial();

export interface ApplicationFilters {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  limit?: number;
  offset?: number;
}

export interface PaginatedApplications {
  applications: Application[];
  total: number;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function getApplications(
  userId: number,
  filters: ApplicationFilters = {}
): Promise<PaginatedApplications> {
  const conditions = ['user_id = $1'];
  const params: (string | number)[] = [userId];
  let paramIndex = 2;

  if (filters.company) {
    conditions.push(`company ILIKE $${paramIndex}`);
    params.push(`%${filters.company}%`);
    paramIndex++;
  }

  if (filters.role) {
    conditions.push(`role ILIKE $${paramIndex}`);
    params.push(`%${filters.role}%`);
    paramIndex++;
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Clamp pagination inputs to safe bounds.
  const limit = Math.min(
    Math.max(1, filters.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const offset = Math.max(0, filters.offset ?? 0);

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM applications WHERE ${whereClause}`,
    params
  );
  const total: number = countResult.rows[0].total;

  const pageParams = [...params, limit, offset];
  const query = `
    SELECT * FROM applications
    WHERE ${whereClause}
    ORDER BY updated_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const result = await pool.query(query, pageParams);

  return { applications: result.rows, total, limit, offset };
}

export async function getApplicationById(
  userId: number,
  id: number
): Promise<Application | null> {
  const result = await pool.query(
    'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  return result.rows[0] || null;
}

export async function createApplication(
  userId: number,
  data: z.infer<typeof applicationSchema>
): Promise<Application> {
  const parsed = applicationSchema.parse(data);

  const result = await pool.query(
    `INSERT INTO applications (user_id, company, role, location, salary, job_link, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      parsed.company,
      parsed.role,
      parsed.location || null,
      parsed.salary || null,
      parsed.job_link || null,
      parsed.status || 'Applied',
      parsed.notes || null,
    ]
  );

  return result.rows[0];
}

export async function updateApplication(
  userId: number,
  id: number,
  data: z.infer<typeof updateApplicationSchema>
): Promise<Application | null> {
  const parsed = updateApplicationSchema.parse(data);

  const existing = await getApplicationById(userId, id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  let paramIndex = 1;

  const entries = Object.entries(parsed) as [string, string | null | undefined][];

  for (const [key, value] of entries) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value === '' ? null : value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return existing;

  fields.push(`updated_at = NOW()`);
  values.push(id, userId);

  const result = await pool.query(
    `UPDATE applications SET ${fields.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

export async function deleteApplication(
  userId: number,
  id: number
): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  return result.rows.length > 0;
}

export async function getDashboardStats(userId: number): Promise<DashboardStats> {
  const totalResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM applications WHERE user_id = $1',
    [userId]
  );

  const statusResult = await pool.query(
    `SELECT status, COUNT(*)::int AS count
     FROM applications
     WHERE user_id = $1
     GROUP BY status`,
    [userId]
  );

  const byStatus = APPLICATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );

  for (const row of statusResult.rows) {
    byStatus[row.status as ApplicationStatus] = row.count;
  }

  return {
    total: totalResult.rows[0].total,
    byStatus,
  };
}

export { APPLICATION_STATUSES };

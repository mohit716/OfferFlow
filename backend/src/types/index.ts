export type ApplicationStatus =
  | 'Applied'
  | 'OA'
  | 'Interview'
  | 'Offer'
  | 'Rejected';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Applied',
  'OA',
  'Interview',
  'Offer',
  'Rejected',
];

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
}

export interface Application {
  id: number;
  user_id: number;
  company: string;
  role: string;
  location: string | null;
  salary: string | null;
  job_link: string | null;
  status: ApplicationStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

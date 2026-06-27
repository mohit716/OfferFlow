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
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
}

export interface ApplicationFormData {
  company: string;
  role: string;
  location: string;
  salary: string;
  job_link: string;
  status: ApplicationStatus;
  notes: string;
}

export const emptyApplicationForm = (): ApplicationFormData => ({
  company: '',
  role: '',
  location: '',
  salary: '',
  job_link: '',
  status: 'Applied',
  notes: '',
});

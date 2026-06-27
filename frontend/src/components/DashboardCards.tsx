import { DashboardStats, ApplicationStatus } from '../types';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Applied: 'stat-applied',
  OA: 'stat-oa',
  Interview: 'stat-interview',
  Offer: 'stat-offer',
  Rejected: 'stat-rejected',
};

interface DashboardCardsProps {
  stats: DashboardStats;
}

export function DashboardCards({ stats }: DashboardCardsProps) {
  return (
    <div className="dashboard-grid">
      <div className="stat-card stat-total">
        <span className="stat-label">Total Applications</span>
        <span className="stat-value">{stats.total}</span>
      </div>
      {(Object.entries(stats.byStatus) as [ApplicationStatus, number][]).map(
        ([status, count]) => (
          <div key={status} className={`stat-card ${STATUS_COLORS[status]}`}>
            <span className="stat-label">{status}</span>
            <span className="stat-value">{count}</span>
          </div>
        )
      )}
    </div>
  );
}

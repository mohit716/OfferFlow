import { ApplicationStatus, APPLICATION_STATUSES } from '../types';

interface FilterBarProps {
  company: string;
  role: string;
  status: string;
  onCompanyChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
}

export function FilterBar({
  company,
  role,
  status,
  onCompanyChange,
  onRoleChange,
  onStatusChange,
  onClear,
}: FilterBarProps) {
  const hasFilters = company || role || status;

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Search company..."
        value={company}
        onChange={(e) => onCompanyChange(e.target.value)}
        className="input filter-input"
      />
      <input
        type="text"
        placeholder="Search role..."
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        className="input filter-input"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="input filter-select"
      >
        <option value="">All statuses</option>
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {hasFilters && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const classMap: Record<ApplicationStatus, string> = {
    Applied: 'badge-applied',
    OA: 'badge-oa',
    Interview: 'badge-interview',
    Offer: 'badge-offer',
    Rejected: 'badge-rejected',
  };

  return <span className={`badge ${classMap[status]}`}>{status}</span>;
}

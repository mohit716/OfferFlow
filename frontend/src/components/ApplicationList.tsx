import { Application } from '../types';
import { StatusBadge } from './FilterBar';

interface ApplicationListProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
}

export function ApplicationList({
  applications,
  onEdit,
  onDelete,
  deletingId,
}: ApplicationListProps) {
  if (applications.length === 0) {
    return (
      <div className="empty-state">
        <p>No applications found.</p>
        <p className="empty-hint">Add your first job application to get started.</p>
      </div>
    );
  }

  return (
    <div className="application-list">
      {applications.map((app) => (
        <article key={app.id} className="application-card">
          <div className="application-card-header">
            <div>
              <h3 className="application-company">{app.company}</h3>
              <p className="application-role">{app.role}</p>
            </div>
            <StatusBadge status={app.status} />
          </div>

          <div className="application-meta">
            {app.location && (
              <span className="meta-item">📍 {app.location}</span>
            )}
            {app.salary && <span className="meta-item">💰 {app.salary}</span>}
            {app.job_link && (
              <a
                href={app.job_link}
                target="_blank"
                rel="noopener noreferrer"
                className="meta-link"
              >
                View posting ↗
              </a>
            )}
          </div>

          {app.notes && (
            <p className="application-notes">{app.notes}</p>
          )}

          <div className="application-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(app)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(app.id)}
              disabled={deletingId === app.id}
            >
              {deletingId === app.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

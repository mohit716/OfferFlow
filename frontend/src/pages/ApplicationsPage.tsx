import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { Application, ApplicationFormData } from '../types';
import { FilterBar } from '../components/FilterBar';
import { ApplicationList } from '../components/ApplicationList';
import { ApplicationForm } from '../components/ApplicationForm';

const PAGE_SIZE = 20;

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.getApplications({
        company: companyFilter || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset,
      });

      // If we paged past the end (e.g. after deleting the last item on a
      // page), step back a page.
      if (result.applications.length === 0 && offset > 0) {
        setOffset((prev) => Math.max(0, prev - PAGE_SIZE));
        return;
      }

      setApplications(result.applications);
      setTotal(result.total);
    } catch {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [companyFilter, roleFilter, statusFilter, offset]);

  // Reset to the first page whenever filters change.
  useEffect(() => {
    setOffset(0);
  }, [companyFilter, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadApplications, 300);
    return () => clearTimeout(timer);
  }, [loadApplications]);

  const handleCreate = async (data: ApplicationFormData) => {
    await api.createApplication(data);
    setShowForm(false);
    setOffset(0);
    await loadApplications();
  };

  const handleUpdate = async (data: ApplicationFormData) => {
    if (!editingApp) return;
    await api.updateApplication(editingApp.id, data);
    setEditingApp(null);
    await loadApplications();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this application?')) return;

    setDeletingId(id);
    try {
      await api.deleteApplication(id);
      await loadApplications();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setCompanyFilter('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + applications.length, total);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p className="page-subtitle">Manage your job applications</p>
        </div>
        {!showForm && !editingApp && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Add application
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-panel">
          <h2>New application</h2>
          <ApplicationForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            submitLabel="Add application"
          />
        </div>
      )}

      {editingApp && (
        <div className="form-panel">
          <h2>Edit application</h2>
          <ApplicationForm
            initial={editingApp}
            onSubmit={handleUpdate}
            onCancel={() => setEditingApp(null)}
            submitLabel="Save changes"
          />
        </div>
      )}

      {!showForm && !editingApp && (
        <>
          <FilterBar
            company={companyFilter}
            role={roleFilter}
            status={statusFilter}
            onCompanyChange={setCompanyFilter}
            onRoleChange={setRoleFilter}
            onStatusChange={setStatusFilter}
            onClear={clearFilters}
          />

          {loading ? (
            <div className="page-loading">
              <div className="spinner" />
            </div>
          ) : (
            <>
              <ApplicationList
                applications={applications}
                onEdit={setEditingApp}
                onDelete={handleDelete}
                deletingId={deletingId}
              />

              {total > PAGE_SIZE && (
                <div className="pagination">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={!hasPrev}
                    onClick={() =>
                      setOffset((prev) => Math.max(0, prev - PAGE_SIZE))
                    }
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">
                    {start}–{end} of {total}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={!hasNext}
                    onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

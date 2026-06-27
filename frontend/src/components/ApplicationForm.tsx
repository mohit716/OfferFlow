import { useState } from 'react';
import {
  Application,
  ApplicationFormData,
  ApplicationStatus,
  APPLICATION_STATUSES,
  emptyApplicationForm,
} from '../types';

interface ApplicationFormProps {
  initial?: Application;
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function ApplicationForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationFormData>(
    initial
      ? {
          company: initial.company,
          role: initial.role,
          location: initial.location || '',
          salary: initial.salary || '',
          job_link: initial.job_link || '',
          status: initial.status,
          notes: initial.notes || '',
        }
      : emptyApplicationForm()
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof ApplicationFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="application-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="company">Company *</label>
          <input
            id="company"
            type="text"
            className="input"
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role *</label>
          <input
            id="role"
            type="text"
            className="input"
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            className="input"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="salary">Salary</label>
          <input
            id="salary"
            type="text"
            className="input"
            placeholder="e.g. $120k - $150k"
            value={form.salary}
            onChange={(e) => handleChange('salary', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="job_link">Job Link</label>
          <input
            id="job_link"
            type="url"
            className="input"
            placeholder="https://..."
            value={form.job_link}
            onChange={(e) => handleChange('job_link', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            className="input"
            value={form.status}
            onChange={(e) =>
              handleChange('status', e.target.value as ApplicationStatus)
            }
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          className="input textarea"
          rows={4}
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Interview prep, contacts, follow-ups..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { DashboardCards } from '../components/DashboardCards';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getDashboard();
        setStats(data);
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !stats) {
    return <div className="alert alert-error">{error || 'Something went wrong'}</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of your job search pipeline</p>
        </div>
        <Link to="/applications" className="btn btn-primary">
          View applications
        </Link>
      </div>

      <DashboardCards stats={stats} />

      {stats.total === 0 && (
        <div className="empty-state centered">
          <p>No applications yet.</p>
          <Link to="/applications" className="btn btn-primary">
            Add your first application
          </Link>
        </div>
      )}
    </div>
  );
}

import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="app-layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">◆</span>
            OfferFlow
          </Link>
          <nav className="nav">
            <Link
              to="/"
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            >
              Dashboard
            </Link>
            <Link
              to="/applications"
              className={
                location.pathname.startsWith('/applications')
                  ? 'nav-link active'
                  : 'nav-link'
              }
            >
              Applications
            </Link>
          </nav>
          <div className="header-user">
            <span className="user-name">{user?.name}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

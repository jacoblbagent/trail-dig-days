import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s: any) => s.auth);
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/dig-days" className="nav-brand">
          <span className="nav-icon">⛰️</span> Trail Dig Days
        </Link>
        <div className="nav-links">
          <Link
            to="/dig-days"
            className={`nav-link ${isActive('/dig-days') ? 'active' : ''}`}
          >
            🗺️ Map
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
          >
            👤 Profile
          </Link>
        </div>
        <div className="nav-right">
          <span className="nav-user">{user?.displayName}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch(logout())}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
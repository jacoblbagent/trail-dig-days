import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import type { UserProfile } from '../types';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const { profiles } = useAppSelector((s) => s.profile);
  const location = useLocation();
  const profile: UserProfile | undefined = user ? profiles[user.id] : undefined;

  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    };
    if (showModal) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showModal]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  if (!isAuthenticated) return null;

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <Link to="/dig-days" className="nav-brand">
            Trail Dig Days
          </Link>
          <div className="nav-links">
            <Link
              to="/dig-days"
              className={`nav-link ${isActive('/dig-days') ? 'active' : ''}`}
            >
               Map
            </Link>
          </div>
          <div className="nav-right">
            <button className="nav-avatar-btn" onClick={() => setShowModal(true)}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="nav-avatar-img" />
              ) : (
                <span className="nav-avatar-icon"></span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {showModal && (
        <div className="modal-overlay">
          <div className="user-modal" ref={modalRef}>
            <div className="user-modal-body">
              <div className="um-avatar">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" />
                ) : (
                  <div className="um-avatar-placeholder">
                    {user?.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="um-name">{user?.displayName}</h2>
              <p className="um-email">{user?.email}</p>
              {profile?.location && <p className="um-location">{profile.location}</p>}
              <Link to="/profile" className="btn btn-sm btn-ghost um-full-profile" onClick={() => setShowModal(false)}>
                Full Profile →
              </Link>
              <Link to="/settings" className="btn btn-sm btn-ghost um-settings-btn" onClick={() => setShowModal(false)}>
                Settings
              </Link>
              <hr className="um-divider" />
              <button className="btn btn-sm btn-ghost um-signout" onClick={() => { dispatch(logout()); setShowModal(false); }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
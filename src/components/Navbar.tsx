import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { updateProfile } from '../features/profile/profileSlice';
import type { UserProfile } from '../types';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const { profiles } = useAppSelector((s) => s.profile);
  const location = useLocation();
  const profile: UserProfile | undefined = user ? profiles[user.id] : undefined;

  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<'profile' | 'settings'>('profile');
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
            <div className="user-modal-tabs">
              <button
                className={`tab-btn ${tab === 'profile' ? 'active' : ''}`}
                onClick={() => setTab('profile')}
              >Profile</button>
              <button
                className={`tab-btn ${tab === 'settings' ? 'active' : ''}`}
                onClick={() => setTab('settings')}
              >Settings</button>
            </div>

            {tab === 'profile' && (
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
                {profile?.location && <p className="um-location"> {profile.location}</p>}
                <Link to="/profile" className="btn btn-sm btn-ghost um-full-profile" onClick={() => setShowModal(false)}>
                  Full Profile →
                </Link>
                <hr className="um-divider" />
                <button className="btn btn-sm btn-ghost um-signout" onClick={() => { dispatch(logout()); setShowModal(false); }}>
                  Sign Out
                </button>
              </div>
            )}

            {tab === 'settings' && profile && (
              <ProfileSettings
                profile={profile}
                userId={user!.id}
                dispatch={dispatch}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

const ProfileSettings: React.FC<{
  profile: UserProfile;
  userId: string;
  dispatch: ReturnType<typeof useAppDispatch>;
}> = ({ profile, userId, dispatch }) => {
  const save = (updates: Partial<UserProfile>) => {
    dispatch(updateProfile({ userId, updates }));
  };

  return (
    <div className="user-modal-body settings-body">
      <div className="settings-group">
        <label>Bio</label>
        <textarea
          value={profile.bio || ''}
          onChange={(e) => save({ bio: e.target.value })}
          placeholder="Tell the trail community about yourself..."
          rows={3}
        />
      </div>

      <div className="settings-group">
        <label>Location</label>
        <input
          type="text"
          value={profile.location || ''}
          onChange={(e) => save({ location: e.target.value })}
          placeholder="City, State"
        />
      </div>

      <div className="settings-group">
        <label>Accent Color</label>
        <input
          type="color"
          value={profile.theme.accentColor}
          onChange={(e) => save({ theme: { ...profile.theme, accentColor: e.target.value } })}
        />
      </div>

      <div className="settings-group">
        <label>Layout</label>
        <select
          value={profile.theme.layout}
          onChange={(e) => save({ theme: { ...profile.theme, layout: e.target.value as any } })}
        >
          <option value="standard">Standard</option>
          <option value="compact">Compact</option>
          <option value="hero">Hero</option>
        </select>
      </div>

      <div className="settings-group check-group">
        <label><input type="checkbox" checked={profile.theme.showStats} onChange={(e) => save({ theme: { ...profile.theme, showStats: e.target.checked } })} /> Show Stats</label>
        <label><input type="checkbox" checked={profile.theme.showGear} onChange={(e) => save({ theme: { ...profile.theme, showGear: e.target.checked } })} /> Show Gear</label>
        <label><input type="checkbox" checked={profile.theme.showSocial} onChange={(e) => save({ theme: { ...profile.theme, showSocial: e.target.checked } })} /> Show Social Links</label>
      </div>
    </div>
  );
};

export default Navbar;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setTheme } from '../events/eventsSlice';
import { logout } from '../auth/authSlice';
import { addToast } from '../toast/toastSlice';

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.events.theme);
  const { notificationRadius } = useAppSelector((s) => s.events);
  const { user } = useAppSelector((s) => s.auth);
  const [newRadius, setNewRadius] = useState(notificationRadius || 10);

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <Link to="/" className="event-detail-page-back"><span className="nav-arrow">←</span> Back</Link>
        <h1>Settings</h1>
      </div>
      <div className="event-form">
        <section className="form-section">
          <h3 style={{ fontSize: '.9rem', color: 'var(--stone-600)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Appearance</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Theme</label>
              <select value={theme} onChange={(e) => dispatch(setTheme(e.target.value as 'light' | 'dark'))}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3 style={{ fontSize: '.9rem', color: 'var(--stone-600)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Notifications</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Search radius (mi)</label>
              <input type="number" min={1} max={100} value={newRadius} onChange={(e) => setNewRadius(parseInt(e.target.value) || 10)} />
            </div>
          </div>
        </section>

        {user && (
          <section className="form-section" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '.9rem', color: 'var(--stone-600)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Account</h3>
            <p className="muted" style={{ marginBottom: 8 }}>Signed in as <strong>{user.displayName}</strong> ({user.email})</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to="/edit-profile" className="btn btn-primary">Edit Profile</Link>
              <button className="btn btn-ghost" onClick={() => { dispatch(logout()); dispatch(addToast({ message: 'Signed out', type: 'info' })); }}>
                Sign Out
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;

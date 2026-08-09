import React from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateProfile } from './profileSlice';
import type { UserProfile } from '../../types';

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { profiles } = useAppSelector((s) => s.profile);
  const profile: UserProfile | undefined = user ? profiles[user.id] : undefined;

  if (!profile || !user) {
    return (
      <div className="page-message">
        <p>Please <Link to="/auth">sign in</Link> to access settings.</p>
      </div>
    );
  }

  const save = (updates: Partial<UserProfile>) => {
    dispatch(updateProfile({ userId: user.id, updates }));
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <Link to="/" className="btn btn-sm btn-ghost"><span className="nav-arrow">←</span> Back</Link>
        <h1>Settings</h1>
      </div>

      <div className="settings-page-body">
        <section className="settings-section">
          <h2>Profile</h2>
          <div className="settings-group">
            <label>Display Name</label>
            <input
              type="text"
              value={profile.displayName || ''}
              onChange={(e) => save({ displayName: e.target.value })}
              placeholder="Your trail name..."
            />
          </div>
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
        </section>

        <section className="settings-section">
          <h2>Theme</h2>
          <div className="settings-group">
            <label>Accent Color</label>
            <div className="color-input-wrap">
              <input
                type="color"
                value={profile.theme.accentColor}
                onChange={(e) => save({ theme: { ...profile.theme, accentColor: e.target.value } })}
              />
              <span className="color-hex">{profile.theme.accentColor}</span>
            </div>
          </div>
          <div className="settings-group check-group">
            <label><input type="checkbox" checked={profile.theme.showGear} onChange={(e) => save({ theme: { ...profile.theme, showGear: e.target.checked } })} /> Show Gear</label>
            <label><input type="checkbox" checked={profile.theme.showSocial} onChange={(e) => save({ theme: { ...profile.theme, showSocial: e.target.checked } })} /> Show Social Links</label>
          </div>
        </section>

        <section className="settings-section">
          <h2>Trail Crew</h2>
          <div className="settings-group">
            <label>Crew Name</label>
            <input
              type="text"
              value={profile.trailCrew || ''}
              onChange={(e) => save({ trailCrew: e.target.value })}
              placeholder="e.g. Tarheel Trail Blazers"
            />
          </div>
          <div className="settings-group">
            <label>Crew Website</label>
            <input
              type="text"
              value={profile.trailCrewUrl || ''}
              onChange={(e) => save({ trailCrewUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
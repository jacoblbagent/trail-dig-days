import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateProfile } from './profileSlice';
import type { UserProfile, CustomField } from '../../types';

const AVAILABILITY_OPTIONS = [
  'Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings',
  'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings',
];

const SKILL_SUGGESTIONS = [
  'Trail Building', 'Benching', 'Rock Work', 'Water Management',
  'Bridge Building', 'Signage', 'Brush Clearing', 'Tread Maintenance',
  'Flagging', 'Sustainability Design', 'Machine Operation',
  'First Aid', 'Crew Leadership',
];

const GEAR_SUGGESTIONS = [
  'Sturdy Boots', 'Work Gloves', 'Safety Glasses', 'Hard Hat',
  'Leather Gloves', 'Knee Pads', 'Sun Protection', 'Bug Spray',
  'Rain Gear', 'Hydration Pack', 'Snacks', 'Ear Protection',
  'Long Pants', 'Long Sleeves',
];

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { profiles } = useAppSelector((s) => s.profile);
  const profile = user ? profiles[user.id] : null;

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (profile) setForm(profile);
  }, [user, profile, navigate]);

  if (!user || !profile) return <div className="loading">Loading profile...</div>;

  const saveField = (updates: Partial<UserProfile>) => {
    setForm((f) => ({ ...f, ...updates }));
  };

  const saveAll = async () => {
    await dispatch(updateProfile({ userId: user.id, updates: form }));
    setEditMode(false);
  };

  const toggleArrayItem = (key: keyof Pick<UserProfile, 'skills' | 'gearList' | 'availability' | 'favoriteTrails' | 'certifications'>, item: string) => {
    const arr = form[key] as string[] || [];
    const next = arr.includes(item)
      ? arr.filter((s) => s !== item)
      : [...arr, item];
    saveField({ [key]: next });
  };

  const addCustom = () => {
    if (!newCustomLabel.trim()) return;
    const field: CustomField = {
      id: uuidv4(),
      label: newCustomLabel.trim(),
      value: newCustomValue.trim(),
      type: 'text',
    };
    setForm((f) => ({
      ...f,
      customFields: [...(f.customFields || []), field],
    }));
    setNewCustomLabel('');
    setNewCustomValue('');
  };

  const removeCustom = (fieldId: string) => {
    setForm((f) => ({
      ...f,
      customFields: (f.customFields || []).filter((cf) => cf.id !== fieldId),
    }));
  };

  const theme = profile.theme;

  return (
    <div className="profile-page" style={{ '--accent': theme.accentColor } as React.CSSProperties}>
      <div className={`profile-header ${theme.layout}`}>
        {theme.headerImage && (
          <div
            className="profile-cover"
            style={{ backgroundImage: `url(${theme.headerImage})` }}
          />
        )}
        <div className="profile-avatar-section">
          {editMode ? (
            <input
              type="text"
              placeholder="Avatar URL"
              value={form.avatarUrl || ''}
              onChange={(e) => saveField({ avatarUrl: e.target.value })}
              className="input-sm"
            />
          ) : profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar placeholder">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="profile-name">{profile.displayName}</h1>
          {profile.trailCrew && (
            <p className="profile-crew">
              {profile.trailCrewUrl ? (
                <a href={profile.trailCrewUrl} target="_blank" rel="noreferrer">
                  {profile.trailCrew}
                </a>
              ) : profile.trailCrew}
            </p>
          )}
        </div>
      </div>

      <div className="profile-body">
        {/* Bio */}
        <section className="profile-section">
          <h3>Bio</h3>
          {editMode ? (
            <textarea
              value={form.bio || ''}
              onChange={(e) => saveField({ bio: e.target.value })}
              placeholder="Tell the trail community about yourself..."
              rows={4}
            />
          ) : (
            <p>{profile.bio || 'No bio yet.'}</p>
          )}
        </section>

        {/* Location */}
        <section className="profile-section">
          <h3>Location</h3>
          {editMode ? (
            <div className="form-row">
              <input
                type="text"
                value={form.location || ''}
                onChange={(e) => saveField({ location: e.target.value })}
                placeholder="City, State"
                className="flex-1"
              />
            </div>
          ) : (
            <p>{profile.location || 'Not set'}</p>
          )}
        </section>

        {/* Dig Stats */}
        {theme.showStats && (
          <section className="profile-section">
            <h3>Dig Stats</h3>
            <div className="stats-grid">
              <div className="stat-card"><strong>{profile.digStats.totalDigs}</strong> Dig Days</div>
              <div className="stat-card"><strong>{profile.digStats.totalHours}</strong> Hours</div>
              <div className="stat-card"><strong>{profile.digStats.totalMiles}</strong> Trail Miles</div>
            </div>
          </section>
        )}

        {/* Skills */}
        <section className="profile-section">
          <h3>Skills & Expertise</h3>
          {editMode ? (
            <div className="tag-grid">
              {SKILL_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className={`tag ${(form.skills || []).includes(s) ? 'active' : ''}`}
                  onClick={() => toggleArrayItem('skills', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="tag-grid">
              {profile.skills.length ? profile.skills.map((s) => <span key={s} className="tag active">{s}</span>) : <p className="muted">No skills listed</p>}
            </div>
          )}
        </section>

        {/* Certifications */}
        <section className="profile-section">
          <h3>Certifications</h3>
          {editMode ? (
            <div className="tag-grid">
              {['First Aid / CPR', 'Sawyer Level 1', 'Sawyer Level 2', 'Trail Crew Leader', 'Wilderness First Responder', 'Chainsaw Cert', 'Heavy Equipment'].map((c) => (
                <button
                  key={c}
                  className={`tag ${(form.certifications || []).includes(c) ? 'active' : ''}`}
                  onClick={() => toggleArrayItem('certifications', c)}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <div className="tag-grid">
              {profile.certifications.length ? profile.certifications.map((c) => <span key={c} className="tag active">{c}</span>) : <p className="muted">None listed</p>}
            </div>
          )}
        </section>

        {/* Gear List */}
        {theme.showGear && (
          <section className="profile-section">
            <h3>My Gear</h3>
            {editMode ? (
              <div className="tag-grid">
                {GEAR_SUGGESTIONS.map((g) => (
                  <button
                    key={g}
                    className={`tag ${(form.gearList || []).includes(g) ? 'active' : ''}`}
                    onClick={() => toggleArrayItem('gearList', g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            ) : (
              <div className="tag-grid">
                {profile.gearList.length ? profile.gearList.map((g) => <span key={g} className="tag active">{g}</span>) : <p className="muted">No gear listed</p>}
              </div>
            )}
          </section>
        )}

        {/* Favorite Trails */}
        <section className="profile-section">
          <h3>Favorite Trails</h3>
          {editMode ? (
            <input
              type="text"
              placeholder="Add a trail and press Enter"
              value={(form.favoriteTrails || []).join(', ')}
              onChange={(e) => saveField({ favoriteTrails: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          ) : (
            <p>{profile.favoriteTrails.length ? profile.favoriteTrails.join(', ') : 'None yet'}</p>
          )}
        </section>

        {/* Availability */}
        <section className="profile-section">
          <h3>Availability</h3>
          {editMode ? (
            <div className="tag-grid">
              {AVAILABILITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  className={`tag ${(form.availability || []).includes(a) ? 'active' : ''}`}
                  onClick={() => toggleArrayItem('availability', a)}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : (
            <div className="tag-grid">
              {profile.availability.length ? profile.availability.map((a) => <span key={a} className="tag active">{a}</span>) : <p className="muted">Not set</p>}
            </div>
          )}
        </section>

        {/* Social Links */}
        {theme.showSocial && (
          <section className="profile-section">
            <h3>Social Links</h3>
            {editMode ? (
              <div className="social-edit">
                {(['instagram', 'strava', 'facebook', 'website'] as const).map((s) => (
                  <div className="form-row" key={s}>
                    <label className="social-label">{s}</label>
                    <input
                      type="url"
                      value={(form.socialLinks || {})[s] || ''}
                      onChange={(e) => saveField({
                        socialLinks: { ...form.socialLinks!, [s]: e.target.value }
                      })}
                      placeholder={`https://${s}.com/...`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="social-links">
                {profile.socialLinks.instagram && <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer">📷 Instagram</a>}
                {profile.socialLinks.strava && <a href={profile.socialLinks.strava} target="_blank" rel="noreferrer">🏃 Strava</a>}
                {profile.socialLinks.facebook && <a href={profile.socialLinks.facebook} target="_blank" rel="noreferrer">📘 Facebook</a>}
                {profile.socialLinks.website && <a href={profile.socialLinks.website} target="_blank" rel="noreferrer">🌐 Website</a>}
                {!profile.socialLinks.instagram && !profile.socialLinks.strava && !profile.socialLinks.facebook && !profile.socialLinks.website && <p className="muted">No links</p>}
              </div>
            )}
          </section>
        )}

        {/* Custom Fields */}
        <section className="profile-section">
          <h3>Custom Fields</h3>
          {editMode && (
            <div className="form-row custom-field-add">
              <input
                type="text"
                placeholder="Label (e.g. Favorite Tool)"
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
              />
              <button type="button" className="btn btn-sm" onClick={addCustom}>+</button>
            </div>
          )}
          {(form.customFields || []).length > 0 ? (
            <div className="custom-fields">
              {(form.customFields || []).map((cf) => (
                <div key={cf.id} className="custom-field-row">
                  <strong>{cf.label}:</strong> {cf.value}
                  {editMode && (
                    <button className="btn-icon" onClick={() => removeCustom(cf.id)}>✕</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No custom fields yet</p>
          )}
        </section>

        {/* Theme Settings */}
        <section className="profile-section">
          <h3>Profile Theme</h3>
          {editMode ? (
            <div className="theme-edit">
              <div className="form-row">
                <label>Accent Color</label>
                <input
                  type="color"
                  value={form.theme?.accentColor || '#2d6a4f'}
                  onChange={(e) => saveField({ theme: { ...form.theme!, accentColor: e.target.value } })}
                />
              </div>
              <div className="form-row">
                <label>Header Image URL</label>
                <input
                  type="text"
                  value={form.theme?.headerImage || ''}
                  onChange={(e) => saveField({ theme: { ...form.theme!, headerImage: e.target.value } })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-row">
                <label>Layout</label>
                <select
                  value={form.theme?.layout || 'standard'}
                  onChange={(e) => saveField({ theme: { ...form.theme!, layout: e.target.value as any } })}
                >
                  <option value="standard">Standard</option>
                  <option value="compact">Compact</option>
                  <option value="hero">Hero</option>
                </select>
              </div>
              <div className="check-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.theme?.showStats !== false}
                    onChange={(e) => saveField({ theme: { ...form.theme!, showStats: e.target.checked } })}
                  />
                  Show Stats
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.theme?.showGear !== false}
                    onChange={(e) => saveField({ theme: { ...form.theme!, showGear: e.target.checked } })}
                  />
                  Show Gear
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.theme?.showSocial !== false}
                    onChange={(e) => saveField({ theme: { ...form.theme!, showSocial: e.target.checked } })}
                  />
                  Show Social Links
                </label>
              </div>
            </div>
          ) : (
            <div className="theme-preview">
              <span className="badge" style={{ background: theme.accentColor }}>{theme.accentColor}</span>
              <span className="badge">{theme.layout} layout</span>
            </div>
          )}
        </section>

        <div className="profile-actions">
          {editMode ? (
            <>
              <button className="btn btn-primary" onClick={saveAll}>Save Profile</button>
              <button className="btn btn-ghost" onClick={() => { setEditMode(false); setForm(profile); }}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
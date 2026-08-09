import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { updateProfile } from './profileSlice';
import type { UserProfile, CustomField } from '../../types';

const DIFF_ICONS: Record<string, string> = {
  easy: 'Easy', moderate: 'Moderate', challenging: 'Challenging', expert: 'Expert',
};

const SKILL_SUGGESTIONS = [
  'Trail Design', 'Bench Cutting', 'Rock Work', 'Timber Work',
  'Bridge Building', 'Signage', 'Erosion Control', 'Flagging',
  'Cornering', 'Machine Ops', 'Carpentry', 'Landscaping',
  'Mapping / GPS', 'Crew Leadership',
];

const GEAR_SUGGESTIONS = [
  'McLeod', 'Pick Mattock', 'Shovel', 'Spade', 'Rake',
  'Pulaski', 'Chainsaw', 'Hand Saw', 'Hoe', 'Wheelbarrow',
  'Tamper', 'Hazel Hoe', 'Rock Bar', 'Sledge',
  'Gloves', 'Hard Hat', 'Safety Vest',
];

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const DigDatesTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { items } = useAppSelector((s) => s.events);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const userEvents = items.filter(
    (e) => e.creatorId === userId || e.registeredVolunteers.includes(userId)
  );
  const now = new Date();
  const upcoming = userEvents.filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = userEvents.filter((e) => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <section className="profile-section">
      <div className="dig-dates-tabs">
        <button className={`tab-btn ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          Upcoming {!!upcoming.length && <span className="tab-count">{upcoming.length}</span>}
        </button>
        <button className={`tab-btn ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
          Past {!!past.length && <span className="tab-count">{past.length}</span>}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
          {tab === 'upcoming' ? 'No upcoming dig dates.' : 'No past dig dates yet.'}
        </p>
      ) : (
        <div className="dig-date-list">
          {list.slice(0, 10).map((e) => (
            <Link to={`/events/${e.id}`} key={e.id} className="dig-date-card">
              <div className="ddc-left">
                <span className="ddc-date">
                  {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="ddc-time">{e.startTime}</span>
              </div>
              <div className="ddc-mid">
                <span className="ddc-title">{e.title}</span>
                <span className="ddc-trail">{DIFF_ICONS[e.difficulty]} {e.trailName} · {e.locationName}</span>
              </div>
              <div className="ddc-right">
                <span className={`status-dot status-${e.status}`} />
                <span className="ddc-spots">{e.registeredVolunteers.length}/{e.maxVolunteers}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { profiles } = useAppSelector((s) => s.profile);
  const profile: UserProfile | undefined = user ? profiles[user.id] : undefined;
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<UserProfile | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (profile && !form) setForm({ ...profile });
  }, [profile, form]);

  if (!profile || !form) {
    return <div className="profile-page"><p className="muted">Loading profile...</p></div>;
  }

  const saveField = (partial: Partial<UserProfile>) => {
    const updated = { ...form, ...partial };
    setForm(updated);
    dispatch(updateProfile({ userId: user!.id, updates: updated }));
  };

  const toggleArrayItem = (
    key: keyof Pick<UserProfile, 'skills' | 'gearList' | 'availability' | 'favoriteTrails' | 'certifications'>,
    item: string
  ) => {
    const arr = form[key] as string[];
    const next = arr.includes(item) ? arr.filter((s) => s !== item) : [...arr, item];
    saveField({ [key]: next } as any);
  };

  const addCustomField = () => {
    const cf: CustomField = { id: Date.now().toString(), label: '', value: '', type: 'text' };
    saveField({ customFields: [...form.customFields, cf] });
  };

  const removeCustom = (id: string) => {
    saveField({ customFields: form.customFields.filter((f) => f.id !== id) });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    saveField({ avatarUrl: dataUrl });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    saveField({ theme: { ...form.theme!, headerImage: dataUrl } });
  };

  const theme = form.theme;

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
            <>
              <div className="avatar-upload-wrap">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar placeholder">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  className="avatar-upload-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Upload photo"
                >
                  
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <input
                type="text"
                placeholder="Or paste image URL"
                value={form.avatarUrl || ''}
                onChange={(e) => saveField({ avatarUrl: e.target.value })}
                className="input-sm avatar-url-input"
              />
            </>
          ) : form.avatarUrl ? (
            <img src={form.avatarUrl} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar placeholder">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="profile-name">{form.displayName}</h1>
          {form.trailCrew && (
            <p className="profile-crew">
              {form.trailCrewUrl ? (
                <a href={form.trailCrewUrl} target="_blank" rel="noreferrer">
                  {form.trailCrew}
                </a>
              ) : form.trailCrew}
            </p>
          )}
          <p className="profile-metrics">
            <span>{form.digStats.totalDigs} Dig Days</span>
            <span className="sep">·</span>
            <span>Member Since {new Date(user!.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {form.location && <><span className="sep">·</span><span>{form.location}</span></>}
          </p>
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
            <p>{form.bio || 'No bio yet.'}</p>
          )}
        </section>

        {/* Dig Dates */}
        <DigDatesTab userId={user!.id} />

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
            <p>{form.location || 'Not set'}</p>
          )}
        </section>

        {/* Dig Stats */}
        {theme.showStats && (
          <section className="profile-section">
            <h3>Dig Stats</h3>
            <div className="stats-grid">
              <div className="stat-card"><strong>{form.digStats.totalDigs}</strong> Dig Days</div>
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
              {form.skills.length ? form.skills.map((s) => <span key={s} className="tag active">{s}</span>) : <p className="muted">No skills listed</p>}
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
              {form.certifications.length ? form.certifications.map((c) => <span key={c} className="tag active">{c}</span>) : <p className="muted">None listed</p>}
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
                {form.gearList.length ? form.gearList.map((g) => <span key={g} className="tag active">{g}</span>) : <p className="muted">No gear listed</p>}
              </div>
            )}
          </section>
        )}

        {/* Social Links */}
        {theme.showSocial && (
          <section className="profile-section">
            <h3>Social & Links</h3>
            {editMode ? (
              <div className="social-edit">
                {Object.keys(form.socialLinks).map((key) => (
                  <div key={key} className="social-row">
                    <span className="social-label">{key}</span>
                    <input
                      type="url"
                      value={(form.socialLinks as any)[key] || ''}
                      onChange={(e) => saveField({ socialLinks: { ...form.socialLinks, [key]: e.target.value } })}
                      placeholder={`https://${key}.com/your-profile`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="social-links">
                {Object.entries(form.socialLinks).filter(([, v]) => v).length > 0 ? (
                  Object.entries(form.socialLinks).filter(([, v]) => v).map(([key, val]) => (
                    <a key={key} href={val} target="_blank" rel="noreferrer">
                      {key}
                    </a>
                  ))
                ) : (
                  <p className="muted">No links added</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Custom Fields */}
        <section className="profile-section">
          <h3>Custom Fields</h3>
          {editMode ? (
            <div>
              <div className="custom-fields">
                {form.customFields.map((cf) => (
                  <div key={cf.id} className="custom-field-row">
                    <input
                      placeholder="Label"
                      value={cf.label}
                      onChange={(e) => {
                        const next = form.customFields.map((f) => f.id === cf.id ? { ...f, label: e.target.value } : f);
                        saveField({ customFields: next });
                      }}
                      style={{ width: 120 }}
                    />
                    <input
                      placeholder="Value"
                      value={cf.value}
                      onChange={(e) => {
                        const next = form.customFields.map((f) => f.id === cf.id ? { ...f, value: e.target.value } : f);
                        saveField({ customFields: next });
                      }}
                      style={{ flex: 1 }}
                    />
                    <button className="btn-icon" onClick={() => removeCustom(cf.id)}>x</button>
                  </div>
                ))}
              </div>
              <button className="btn btn-sm btn-ghost" onClick={addCustomField}>+ Add Field</button>
            </div>
          ) : (
            <div className="custom-fields">
              {form.customFields.length > 0 ? (
                form.customFields.filter((f) => f.label && f.value).map((cf) => (
                  <div key={cf.id} className="custom-field-row">
                    <strong>{cf.label}:</strong> {cf.value}
                  </div>
                ))
              ) : (
                <p className="muted">No custom fields yet</p>
              )}
            </div>
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
                <label>Cover Photo</label>
                <div className="cover-upload-row">
                  <input
                    type="text"
                    value={form.theme?.headerImage || ''}
                    onChange={(e) => saveField({ theme: { ...form.theme!, headerImage: e.target.value } })}
                    placeholder="https://... or upload below"
                  />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Upload
                  </button>
                </div>
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
              <div className="theme-preview">
                <span className="badge" style={{ background: theme.accentColor }}>{theme.accentColor}</span>
              </div>
            </div>
          ) : (
            <div className="theme-preview">
              <span className="badge" style={{ background: theme.accentColor }}>{theme.accentColor}</span>
              {theme.headerImage && <span className="badge"> Cover</span>}
              <span className="badge">{theme.layout}</span>
            </div>
          )}
        </section>

        <div className="profile-actions">
          <button
            className={`btn ${editMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              if (editMode) {
                setForm({ ...profile });
                setEditMode(false);
              } else {
                setEditMode(true);
              }
            }}
          >
            {editMode ? 'Done Editing' : 'Edit Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
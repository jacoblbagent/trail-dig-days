import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MapExtras from '../../features/map/MapExtras';
import L from 'leaflet';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { updateProfile } from './profileSlice';
import type { UserProfile, CustomField } from '../../types';

// Fix Leaflet icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const LocationMap: React.FC<{ location: string }> = ({ location }) => {
  const [coords, setCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!location) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]) setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      })
      .catch(() => {});
  }, [location]);

  if (!coords) return <p className="muted" style={{ fontSize: '.8rem' }}>Loading map...</p>;

  return (
    <div style={{ height: 180, borderRadius: 'var(--radius)', overflow: 'hidden', marginTop: 8 }}>
      <MapContainer center={coords} zoom={10} style={{ width: '100%', height: '100%' }} maxBounds={[[24, -125], [50, -66]]} maxBoundsViscosity={1}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords}>
          <Popup>{location}</Popup>
        </Marker>
        <Circle
          center={coords}
          radius={8047}
          pathOptions={{ color: '#2d6a4f', fillOpacity: 0.08, weight: 2 }}
        />
        <MapExtras />
      </MapContainer>
    </div>
  );
};

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
              <span className="ddc-spots">{e.registeredVolunteers.length}/{e.maxVolunteers}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

const MyEventsSection: React.FC<{ userId: string }> = ({ userId }) => {
  const { items } = useAppSelector((s) => s.events);
  const created = items.filter((e) => e.creatorId === userId);
  const signedUp = items.filter((e) => e.registeredVolunteers.includes(userId) && e.creatorId !== userId);
  return (
    <>
      {created.length > 0 && (
        <section className="profile-section">
          <h3>Created by You</h3>
          <div className="dig-date-list">
            {created.map((e) => (
              <Link to={`/events/${e.id}/edit`} key={e.id} className="dig-date-card">
                <div className="ddc-left">
                  <span className="ddc-date">{new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="ddc-time">{e.startTime}</span>
                </div>
                <div className="ddc-mid">
                  <span className="ddc-title">{e.title}</span>
                  <span className="ddc-trail">{e.trailName} · {e.locationName}</span>
                </div>
                <span className="ddc-spots">{e.registeredVolunteers.length}/{e.maxVolunteers}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {signedUp.length > 0 && (
        <section className="profile-section">
          <h3>Signed Up</h3>
          <div className="dig-date-list">
            {signedUp.map((e) => (
              <Link to={`/events/${e.id}`} key={e.id} className="dig-date-card">
                <div className="ddc-left">
                  <span className="ddc-date">{new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="ddc-time">{e.startTime}</span>
                </div>
                <div className="ddc-mid">
                  <span className="ddc-title">{e.title}</span>
                  <span className="ddc-trail">{e.trailName} · {e.locationName}</span>
                </div>
                <span className="ddc-spots">{e.registeredVolunteers.length}/{e.maxVolunteers}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
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
  const [coverPos, setCoverPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (profile && !form) { setForm({ ...profile }); setCoverPos(profile.theme.coverPosition ?? 50); }
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
    saveField({ theme: { ...form.theme, headerImage: dataUrl } });
    setCoverPos(50);
  };

  const handleCoverDragStart = (clientY: number) => {
    setDragging(true);
    const startY = clientY;
    const startPos = coverPos;
    let currentPos = startPos;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dy = y - startY;
      const cover = coverRef.current;
      if (!cover) return;
      const rect = cover.getBoundingClientRect();
      const pct = (dy / rect.height) * 100;
      currentPos = Math.max(0, Math.min(100, Math.round(startPos - pct)));
      setCoverPos(currentPos);
    };

    const onUp = () => {
      setDragging(false);
      saveField({ theme: { ...form.theme, coverPosition: currentPos } });
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  };

  const theme = form.theme;

  const hasSocial = Object.entries(form.socialLinks).filter(([, v]) => v).length > 0;
  const hasCustomFields = form.customFields.filter((f) => f.label && f.value).length > 0;

  return (
    <div className="profile-page" style={{ '--accent': theme.accentColor } as React.CSSProperties}>
      <div className={`profile-header ${theme.layout}`}>
        <div
          ref={coverRef}
          className={`profile-cover ${editMode && form.theme.headerImage ? 'draggable' : ''} ${dragging ? 'dragging' : ''}`}
          style={{
            background: form.theme.headerImage
              ? `url(${form.theme.headerImage}) ${coverPos}% / cover no-repeat`
              : 'linear-gradient(135deg, var(--accent, var(--green-700)) 0%, #1a1a2e 100%)',
          }}
          onMouseDown={form.theme.headerImage ? (e) => handleCoverDragStart(e.clientY) : undefined}
          onTouchStart={form.theme.headerImage ? (e) => handleCoverDragStart(e.touches[0].clientY) : undefined}
        >
          {editMode && (
            <>
              <button
                type="button"
                className="cover-upload-btn"
                onClick={() => coverInputRef.current?.click()}
                title="Change cover photo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              {form.theme.headerImage && (
                <button
                  type="button"
                  className="cover-remove-btn"
                  onClick={() => saveField({ theme: { ...form.theme, headerImage: '' } })}
                  title="Remove cover photo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>
        <div className="profile-avatar-section">
          {editMode ? (
                      <React.Fragment>
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
                      </React.Fragment>
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
          <button
            className={`profile-edit-btn ${editMode ? 'editing' : ''}`}
            onClick={() => {
              if (editMode) {
                setForm({ ...profile });
                setEditMode(false);
              } else {
                setEditMode(true);
              }
            }}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="profile-body">
        {/* Bio */}
        {form.bio && (
        <section className="profile-section">
          <h3>Bio</h3>
          <p>{form.bio}</p>
        </section>
        )}

        {/* My Events */}
        <MyEventsSection userId={user!.id} />

        {/* Dig Dates */}
        <DigDatesTab userId={user!.id} />

        {/* Location */}
        {(editMode || form.location) && (
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
            <div>
              <p>{form.location}</p>
              <LocationMap location={form.location} />
            </div>
          )}
        </section>
        )}

        {/* Skills */}
        {(editMode || form.skills.length > 0) && (
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
              {form.skills.map((s) => <span key={s} className="tag active">{s}</span>)}
            </div>
          )}
        </section>
        )}

        {/* Certifications */}
        {(editMode || form.certifications.length > 0) && (
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
              {form.certifications.map((c) => <span key={c} className="tag active">{c}</span>)}
            </div>
          )}
        </section>
        )}

        {/* Gear List */}
        {theme.showGear && (editMode || form.gearList.length > 0) && (
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
                {form.gearList.map((g) => <span key={g} className="tag active">{g}</span>)}
              </div>
            )}
          </section>
        )}

        {/* Social Links */}
        {theme.showSocial && (editMode || hasSocial) && (
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
                {Object.entries(form.socialLinks).filter(([, v]) => v).map(([key, val]) => (
                  <a key={key} href={val} target="_blank" rel="noreferrer">
                    {key}
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Custom Fields */}
        {(editMode || hasCustomFields) && (
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
              {form.customFields.filter((f) => f.label && f.value).map((cf) => (
                <div key={cf.id} className="custom-field-row">
                  <strong>{cf.label}:</strong> {cf.value}
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        </div>
    </div>
  );
};

export default ProfilePage;
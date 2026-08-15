import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateProfile } from './profileSlice';
import type { UserProfile, CustomField } from '../../types';

const SKILL_OPTIONS = [
  'Trail Design', 'Bench Cutting', 'Rock Work', 'Timber Work',
  'Bridge Building', 'Signage', 'Erosion Control', 'Flagging',
  'Cornering', 'Machine Ops', 'Carpentry', 'Landscaping',
  'Mapping / GPS', 'Crew Leadership',
];

const CERT_OPTIONS = [
  'First Aid / CPR', 'Sawyer Level 1', 'Sawyer Level 2',
  'Trail Crew Leader', 'Wilderness First Responder',
  'Chainsaw Cert', 'Heavy Equipment',
];

const GEAR_OPTIONS = [
  'McLeod', 'Pick Mattock', 'Shovel', 'Spade', 'Rake',
  'Pulaski', 'Chainsaw', 'Hand Saw', 'Hoe', 'Wheelbarrow',
  'Tamper', 'Hazel Hoe', 'Rock Bar', 'Sledge',
  'Gloves', 'Hard Hat', 'Safety Vest',
];

const SOCIAL_KEYS = ['facebook', 'instagram', 'strava', 'youtube', 'tiktok', 'bluesky'];

const EditProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { profiles } = useAppSelector((s) => s.profile);
  const profile: UserProfile | undefined = user ? profiles[user.id] : undefined;

  const [form, setForm] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (profile) setForm({ ...profile });
  }, [profile]);

  if (!profile || !user || !form) {
    return (
      <div className="create-event-page">
        <p className="muted" style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>
      </div>
    );
  }

  const save = (partial: Partial<UserProfile>) => {
    const updated = { ...form, ...partial };
    setForm(updated);
    dispatch(updateProfile({ userId: user.id, updates: updated }));
  };

  const toggleArrayItem = (
    key: keyof Pick<UserProfile, 'skills' | 'gearList' | 'certifications'>,
    item: string
  ) => {
    const arr = form[key] as string[];
    const next = arr.includes(item) ? arr.filter((s) => s !== item) : [...arr, item];
    save({ [key]: next } as any);
  };

  const addCustomField = () => {
    const cf: CustomField = { id: Date.now().toString(), label: '', value: '', type: 'text' };
    save({ customFields: [...form.customFields, cf] });
  };

  const removeCustom = (id: string) => {
    save({ customFields: form.customFields.filter((f) => f.id !== id) });
  };

  return (
    <div className="create-event-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/profile')}>
            <span className="nav-arrow">←</span> Profile
          </button>
          <h1>Edit Profile</h1>
        </div>
      </div>

      <div className="event-form">

        {/* Profile Info */}
        <span className="form-section-label">Profile Info</span>
        <section className="form-section">
          <div className="form-group">
            <label>Display Name</label>
            <input type="text" value={form.displayName || ''} onChange={(e) => save({ displayName: e.target.value })} placeholder="Your trail name..." />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea value={form.bio || ''} onChange={(e) => save({ bio: e.target.value })} placeholder="Tell the trail community about yourself..." rows={3} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" value={form.location || ''} onChange={(e) => save({ location: e.target.value })} placeholder="City, State" />
          </div>
        </section>

        {/* Trail Crew */}
        <span className="form-section-label">Trail Crew</span>
        <section className="form-section">
          <div className="form-group">
            <label>Crew Name</label>
            <input type="text" value={form.trailCrew || ''} onChange={(e) => save({ trailCrew: e.target.value })} placeholder="e.g. Tarheel Trail Blazers" />
          </div>
          <div className="form-group">
            <label>Crew Website</label>
            <input type="text" value={form.trailCrewUrl || ''} onChange={(e) => save({ trailCrewUrl: e.target.value })} placeholder="https://..." />
          </div>
        </section>

        {/* Skills */}
        <span className="form-section-label">Skills & Expertise</span>
        <section className="form-section">
          <div className="tag-grid">
            {SKILL_OPTIONS.map((s) => (
              <button key={s} className={`tag ${(form.skills || []).includes(s) ? 'active' : ''}`}
                onClick={() => toggleArrayItem('skills', s)}>
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <span className="form-section-label">Certifications</span>
        <section className="form-section">
          <div className="tag-grid">
            {CERT_OPTIONS.map((c) => (
              <button key={c} className={`tag ${(form.certifications || []).includes(c) ? 'active' : ''}`}
                onClick={() => toggleArrayItem('certifications', c)}>
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Gear List */}
        <span className="form-section-label">My Gear</span>
        <section className="form-section">
          <div className="tag-grid">
            {GEAR_OPTIONS.map((g) => (
              <button key={g} className={`tag ${(form.gearList || []).includes(g) ? 'active' : ''}`}
                onClick={() => toggleArrayItem('gearList', g)}>
                {g}
              </button>
            ))}
          </div>
        </section>

        {/* Social Links */}
        <span className="form-section-label">Social & Links</span>
        <section className="form-section">
          {SOCIAL_KEYS.map((key) => (
            <div key={key} className="form-group">
              <label style={{ textTransform: 'capitalize' }}>{key}</label>
              <input type="url" value={(form.socialLinks as any)[key] || ''}
                onChange={(e) => save({ socialLinks: { ...form.socialLinks, [key]: e.target.value } })}
                placeholder={`https://${key}.com/your-profile`} />
            </div>
          ))}
        </section>

        {/* Custom Fields */}
        <span className="form-section-label">Custom Fields</span>
        <section className="form-section">
          <div className="custom-fields">
            {form.customFields.map((cf) => (
              <div key={cf.id} className="custom-field-row">
                <input placeholder="Label" value={cf.label}
                  onChange={(e) => {
                    const next = form.customFields.map((f) => f.id === cf.id ? { ...f, label: e.target.value } : f);
                    save({ customFields: next });
                  }}
                  style={{ width: 120 }} />
                <input placeholder="Value" value={cf.value}
                  onChange={(e) => {
                    const next = form.customFields.map((f) => f.id === cf.id ? { ...f, value: e.target.value } : f);
                    save({ customFields: next });
                  }}
                  style={{ flex: 1 }} />
                <button className="btn-icon" onClick={() => removeCustom(cf.id)}>x</button>
              </div>
            ))}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={addCustomField} style={{ marginTop: 8 }}>+ Add Field</button>
        </section>

        </div>
    </div>
  );
};

export default EditProfilePage;
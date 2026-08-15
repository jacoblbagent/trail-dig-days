import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateProfile } from './profileSlice';
import { deleteAccount, logout } from '../auth/authSlice';
import { addToast } from '../toast/toastSlice';
import type { UserProfile, CustomField } from '../../types';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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

const SOCIAL_KEYS = ['facebook', 'instagram', 'strava', 'youtube', 'tiktok', 'bluesky', 'website'];

const AVAILABILITY_OPTIONS = [
  'Weekdays', 'Weekends', 'Mornings', 'Afternoons', 'Evenings',
  'One-time', 'Ongoing',
];

const EditProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { profiles } = useAppSelector((s) => s.profile);
  const profile: UserProfile | undefined = user ? profiles[user.id] : undefined;

  const [form, setForm] = useState<UserProfile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const deleteModalRef = useFocusTrap(showDeleteModal);

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

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await dispatch(deleteAccount(user.id)).unwrap();
      dispatch(logout());
      dispatch(addToast({ message: 'Account deleted permanently', type: 'info' }));
      navigate('/auth');
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed to delete account', type: 'warning' }));
      setDeleting(false);
    }
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

        {/* Favorite Trails */}
        <span className="form-section-label">Favorite Trails</span>
        <section className="form-section">
          <div className="form-group">
            <label>Favorite Trails (one per line)</label>
            <textarea value={(form.favoriteTrails || []).join('\n')}
              onChange={(e) => save({ favoriteTrails: e.target.value.split('\n').filter(Boolean) })}
              rows={4} placeholder="Galbraith Mountain&#10;Porcupine Rim&#10;Buffalo Creek" />
          </div>
        </section>

        {/* Availability */}
        <span className="form-section-label">Availability</span>
        <section className="form-section">
          <div className="tag-grid">
            {AVAILABILITY_OPTIONS.map((a) => (
              <button key={a} className={`tag ${(form.availability || []).includes(a) ? 'active' : ''}`}
                onClick={() => {
                  const arr = form.availability || [];
                  const next = arr.includes(a) ? arr.filter((s) => s !== a) : [...arr, a];
                  save({ availability: next });
                }}>
                {a}
              </button>
            ))}
          </div>
        </section>

        {/* Dig Stats */}
        <span className="form-section-label">Dig Stats</span>
        <section className="form-section">
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Total Digs</label>
              <input type="number" min={0} value={form.digStats?.totalDigs || 0}
                onChange={(e) => save({ digStats: { ...form.digStats, totalDigs: parseInt(e.target.value) || 0 } })} />
            </div>
            <div className="form-group flex-1">
              <label>Total Hours</label>
              <input type="number" min={0} step={0.5} value={form.digStats?.totalHours || 0}
                onChange={(e) => save({ digStats: { ...form.digStats, totalHours: parseFloat(e.target.value) || 0 } })} />
            </div>
            <div className="form-group flex-1">
              <label>Total Miles</label>
              <input type="number" min={0} step={0.1} value={form.digStats?.totalMiles || 0}
                onChange={(e) => save({ digStats: { ...form.digStats, totalMiles: parseFloat(e.target.value) || 0 } })} />
            </div>
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

        {/* ── Delete Account ── */}
        <span className="form-section-label" style={{ color: 'var(--red-600)' }}>Danger Zone</span>
        <section className="form-section" style={{ border: '1px solid var(--red-200)', borderRadius: 'var(--radius)', padding: 16 }}>
          <p className="muted" style={{ marginBottom: 8 }}>Permanently delete your account and all associated data. This cannot be undone.</p>
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </section>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" ref={deleteModalRef} onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirm(''); } }}>
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-label="Delete account confirmation" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--red-600)' }}>Delete Account</h3>
              <button className="modal-close" onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirm(''); } }}>✕</button>
            </div>
            <div className="modal-body">
              <p className="muted" style={{ marginBottom: 8, lineHeight: 1.5 }}>
                This will permanently delete your profile, remove you from all events, and sign you out. This action cannot be undone.
              </p>
              <label style={{ fontSize: '.85rem', color: 'var(--stone-600)' }}>
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE"
                disabled={deleting}
                style={{ marginTop: 6, width: '100%', padding: '8px 10px', border: '1px solid var(--stone-200)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', background: 'var(--bg)', color: 'var(--stone-800)' }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE' || deleting}>
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfilePage;
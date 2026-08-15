import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MapExtras from '../../features/map/MapExtras';
import L from 'leaflet';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { followOrg, unfollowOrg } from '../events/eventsSlice';
import type { UserProfile } from '../../types';

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

/* ── Shared / Volunteer Dig Dates Tab ── */
const DigDatesTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { items } = useAppSelector((s) => s.events);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'mine'>('upcoming');
  const [page, setPage] = useState<Record<string, number>>({ upcoming: 1, past: 1, mine: 1 });
  const PAGE_SIZE = 5;

  const userEvents = items.filter(
    (e) => e.creatorId === userId || e.registeredVolunteers.includes(userId)
  );
  const now = new Date();
  const upcoming = userEvents.filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = userEvents.filter((e) => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const created = items.filter((e) => e.creatorId === userId);
  const signedUp = items.filter((e) => e.registeredVolunteers.includes(userId) && e.creatorId !== userId);

  const participantLabel = (eventId: string) => {
    if (created.find((e) => e.id === eventId)) return 'Created';
    if (signedUp.find((e) => e.id === eventId)) return 'Signed Up';
    return '';
  };

  const handleTabChange = (t: typeof tab) => {
    setTab(t);
    if (!page[t]) setPage((p) => ({ ...p, [t]: 1 }));
  };

  const paginate = (list: typeof upcoming, t: typeof tab) => {
    const p = page[t] || 1;
    const start = (p - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  };

  const totalPages = (list: typeof upcoming) => Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  return (
    <section className="profile-section tabs-section">
      <div className="dig-dates-tabs">
        <button className={`tab-btn ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => handleTabChange('upcoming')}>
          Upcoming {!!upcoming.length && <span className="tab-count">{upcoming.length}</span>}
        </button>
        <button className={`tab-btn ${tab === 'past' ? 'active' : ''}`} onClick={() => handleTabChange('past')}>
          Past {!!past.length && <span className="tab-count">{past.length}</span>}
        </button>
        <button className={`tab-btn ${tab === 'mine' ? 'active' : ''}`} onClick={() => handleTabChange('mine')}>
          My Events {!!(created.length + signedUp.length) && <span className="tab-count">{created.length + signedUp.length}</span>}
        </button>
      </div>

      {tab === 'mine' ? (
        (() => {
          const allMine = [...created, ...signedUp];
          const tp = totalPages(allMine);
          const items = paginate(allMine, 'mine');
          return allMine.length === 0 ? (
            <p className="muted" style={{ padding: '24px 0' }}>No events yet.</p>
          ) : (
            <>
            <div className="dig-date-list">
              {items.map((e) => (
                <Link to={`/events/${e.id}`} key={e.id} className="dig-date-card">
                  <div className="ddc-left">
                    <span className="ddc-date">{new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="ddc-time">{e.startTime}</span>
                  </div>
                  <div className="ddc-mid">
                    <span className="ddc-title">{e.title}</span>
                    <span className="ddc-trail">{e.trailName} · {e.locationName}</span>
                  </div>
                </Link>
              ))}
            </div>
              {tp > 1 && (
                <div className="pagination-row">
                  <button className="btn btn-ghost btn-sm" disabled={(page.mine || 1) <= 1} onClick={() => setPage((p) => ({ ...p, mine: (p.mine || 1) - 1 }))}>← Prev</button>
                  <span className="pagination-info">Page {(page.mine || 1)} of {tp}</span>
                  <button className="btn btn-ghost btn-sm" disabled={(page.mine || 1) >= tp} onClick={() => setPage((p) => ({ ...p, mine: (p.mine || 1) + 1 }))}>Next →</button>
                </div>
              )}
            </>
          );
        })()
      ) : tab === 'upcoming' ? (
        upcoming.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>No upcoming dig dates.</p>
        ) : (
          <>
          <div className="dig-date-list">
            {paginate(upcoming, 'upcoming').map((e) => (
              <Link to={`/events/${e.id}`} key={e.id} className="dig-date-card">
                <div className="ddc-left">
                  <span className="ddc-date">
                    {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="ddc-time">{e.startTime}</span>
                </div>
                <div className="ddc-mid">
                  <span className="ddc-title">{e.title} <span className="participant-tag">{participantLabel(e.id)}</span></span>
                  <span className="ddc-trail">{DIFF_ICONS[e.difficulty]} {e.trailName} · {e.locationName}</span>
                </div>
              </Link>
            ))}
          </div>
            {(totalPages(upcoming) > 1) && (
              <div className="pagination-row">
                <button className="btn btn-ghost btn-sm" disabled={(page.upcoming || 1) <= 1} onClick={() => setPage((p) => ({ ...p, upcoming: (p.upcoming || 1) - 1 }))}>← Prev</button>
                <span className="pagination-info">Page {(page.upcoming || 1)} of {totalPages(upcoming)}</span>
                <button className="btn btn-ghost btn-sm" disabled={(page.upcoming || 1) >= totalPages(upcoming)} onClick={() => setPage((p) => ({ ...p, upcoming: (p.upcoming || 1) + 1 }))}>Next →</button>
              </div>
            )}
          </>
        )
      ) : (
        past.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>No past dig dates.</p>
        ) : (
          <>
          <div className="dig-date-list">
            {paginate(past, 'past').map((e) => (
              <Link to={`/events/${e.id}`} key={e.id} className="dig-date-card">
                <div className="ddc-left">
                  <span className="ddc-date">
                    {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="ddc-time">{e.startTime}</span>
                </div>
                <div className="ddc-mid">
                  <span className="ddc-title">{e.title} <span className="participant-tag">{participantLabel(e.id)}</span></span>
                  <span className="ddc-trail">{DIFF_ICONS[e.difficulty]} {e.trailName} · {e.locationName}</span>
                </div>
              </Link>
            ))}
          </div>
            {(totalPages(past) > 1) && (
              <div className="pagination-row">
                <button className="btn btn-ghost btn-sm" disabled={(page.past || 1) <= 1} onClick={() => setPage((p) => ({ ...p, past: (p.past || 1) - 1 }))}>← Prev</button>
                <span className="pagination-info">Page {(page.past || 1)} of {totalPages(past)}</span>
                <button className="btn btn-ghost btn-sm" disabled={(page.past || 1) >= totalPages(past)} onClick={() => setPage((p) => ({ ...p, past: (p.past || 1) + 1 }))}>Next →</button>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
};

/* ── Organization Portfolio Tab ── */
const OrgPortfolioTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { items } = useAppSelector((s) => s.events);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const orgEvents = items
    .filter((e) => e.creatorId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = filter === 'all' ? orgEvents : orgEvents.filter((e) => e.status === filter);

  const tp = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const display = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusLabels: Record<string, string> = {
    all: 'All Events',
    planned: 'Planned',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <section className="profile-section">
      <div className="org-portfolio-header">
        <h3>Event Portfolio</h3>
        <span className="muted">{orgEvents.length} event{orgEvents.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="org-portfolio-filters">
        {['all', 'planned', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            className={`filter-chip ${filter === s ? 'active' : ''}`}
            onClick={() => { setFilter(s); setPage(1); }}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>
      {display.length === 0 ? (
        <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>
          {orgEvents.length === 0 ? 'No events created yet.' : 'No events match this filter.'}
        </p>
      ) : (
        <div className="org-portfolio-grid">
          {display.map((e) => (
            <Link to={`/events/${e.id}`} key={e.id} className="portfolio-card">
              <div className="portfolio-card-header">
                <span className={`status-dot status-${e.status}`} />
                <span className="portfolio-date">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h4 className="portfolio-title">{e.title}</h4>
              <p className="portfolio-meta">{e.trailName} · {e.locationName}</p>
              <div className="portfolio-stats-row">
                <span>{e.registeredVolunteers.length}/{e.maxVolunteers} registered</span>
                <span>{e.startTime}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {tp > 1 && (
        <div className="pagination-row">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="pagination-info">Page {page} of {tp}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= tp} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </section>
  );
};

/* ── Organization Dashboard (own profile only) ── */
const OrgDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const { items } = useAppSelector((s) => s.events);
  const orgEvents = items.filter((e) => e.creatorId === userId);

  const totalEvents = orgEvents.length;
  const byStatus = {
    planned: orgEvents.filter((e) => e.status === 'planned').length,
    confirmed: orgEvents.filter((e) => e.status === 'confirmed').length,
    completed: orgEvents.filter((e) => e.status === 'completed').length,
    cancelled: orgEvents.filter((e) => e.status === 'cancelled').length,
  };
  const totalRegistrations = orgEvents.reduce((sum, e) => sum + e.registeredVolunteers.length, 0);
  // Unique volunteers across all org events
  const uniqueVolunteers = new Set(orgEvents.flatMap((e) => e.registeredVolunteers)).size;
  const totalCapacity = orgEvents.reduce((sum, e) => sum + e.maxVolunteers, 0);

  return (
    <section className="profile-section org-dashboard">
      <h3>Organization Dashboard</h3>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <span className="dash-stat">{totalEvents}</span>
          <span className="dash-label">Events Created</span>
        </div>
        <div className="dashboard-card">
          <span className="dash-stat">{totalRegistrations}</span>
          <span className="dash-label">Total Sign-ups</span>
        </div>
        <div className="dashboard-card">
          <span className="dash-stat">{uniqueVolunteers}</span>
          <span className="dash-label">Unique Volunteers</span>
        </div>
        <div className="dashboard-card">
          <span className="dash-stat">{totalCapacity}</span>
          <span className="dash-label">Total Capacity</span>
        </div>
      </div>
      <div className="status-breakdown">
        <div className="sb-row"><span className="status-dot status-planned" /> Planned <span className="sb-count">{byStatus.planned}</span></div>
        <div className="sb-row"><span className="status-dot status-confirmed" /> Confirmed <span className="sb-count">{byStatus.confirmed}</span></div>
        <div className="sb-row"><span className="status-dot status-completed" /> Completed <span className="sb-count">{byStatus.completed}</span></div>
        <div className="sb-row"><span className="status-dot status-cancelled" /> Cancelled <span className="sb-count">{byStatus.cancelled}</span></div>
      </div>
    </section>
  );
};

/* ── Main ProfilePage ── */
const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewUserId = searchParams.get('userId');
  const { user } = useAppSelector((s) => s.auth);
  const { profiles } = useAppSelector((s) => s.profile);
  const targetId = viewUserId || user?.id;
  const profile: UserProfile | undefined = targetId ? profiles[targetId] : undefined;
  const isOwnProfile = !viewUserId || viewUserId === user?.id;
  const followedOrgs = useAppSelector((s) => s.events.followedOrgs);
  const isOrg = profile?.userType === 'organization';

  if (!profile) {
    return <div className="profile-page"><p className="muted">Profile not found.</p></div>;
  }

  const theme = profile.theme;
  const hasSocial = Object.entries(profile.socialLinks).filter(([, v]) => v).length > 0;
  const hasCustomFields = profile.customFields.filter((f) => f.label && f.value).length > 0;
  const isFollowing = followedOrgs.includes(targetId!);

  return (
    <div className="profile-page">
      <div className={`profile-header ${theme.layout}`}>
        <div className="profile-cover" style={{
          background: theme.headerImage
            ? `url(${theme.headerImage}) ${theme.coverPosition}% / cover no-repeat`
            : 'linear-gradient(135deg, var(--green-700) 0%, #1a1a2e 100%)',
        }} />
        <div className="profile-avatar-section">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar placeholder">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-meta">
            <div className="profile-name-row">
              <h1 className="profile-name">{profile.displayName}</h1>
              {isOrg && <span className="org-badge">Organization</span>}
            </div>
            {profile.trailCrew && (
              <p className="profile-crew">
                {profile.trailCrewUrl ? (
                  <a href={profile.trailCrewUrl} target="_blank" rel="noreferrer">{profile.trailCrew}</a>
                ) : profile.trailCrew}
              </p>
            )}
            {hasSocial && (
              <div className="social-links" style={{ margin: '4px 0' }}>
                {Object.entries(profile.socialLinks).filter(([, v]) => v).map(([key, val]) => (
                  <a key={key} href={val} target="_blank" rel="noreferrer">{key}</a>
                ))}
              </div>
            )}
            <p className="profile-metrics">
              <span>{profile.digStats.totalDigs} Dig Days</span>
              <span className="sep">·</span>
              <span>{profile.digStats.totalHours} Hours</span>
              <span className="sep">·</span>
              <span>{profile.digStats.totalMiles} mi</span>
              <span className="sep">·</span>
              <span>Member Since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
              {profile.location && <><span className="sep">·</span><span>{profile.location}</span></>}
            </p>
            {!isOwnProfile && (
              <button
                className={`btn ${isFollowing ? 'btn-ghost' : 'btn-primary'} btn-sm follow-org-btn`}
                onClick={() => dispatch(isFollowing ? unfollowOrg(targetId!) : followOrg(targetId!))}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
            {isOwnProfile && (
              <button className="profile-edit-btn" onClick={() => navigate('/edit-profile')}>Edit</button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-body">
        {profile.bio && (
          <section className="profile-section">
            <h3>{isOrg ? 'Mission' : 'About'}</h3>
            <p>{profile.bio}</p>
          </section>
        )}

        {/* Organization Dashboard — own profile only */}
        {isOwnProfile && isOrg && targetId && <OrgDashboard userId={targetId} />}

        {/* Organization Portfolio — always visible on org profiles */}
        {isOrg && targetId && <OrgPortfolioTab userId={targetId} />}

        {/* Dig dates tab — for volunteers, or as secondary tab for orgs */}
        {targetId && <DigDatesTab userId={targetId} />}

        {profile.location && (
          <section className="profile-section">
            <h3>Location</h3>
            <div>
              <p>{profile.location}</p>
              <LocationMap location={profile.location} />
            </div>
          </section>
        )}

        {profile.skills.length > 0 && (
          <section className="profile-section">
            <h3>Skills & Expertise</h3>
            <div className="tag-grid">
              {profile.skills.map((s) => <span key={s} className="tag active">{s}</span>)}
            </div>
          </section>
        )}

        {profile.certifications.length > 0 && (
          <section className="profile-section">
            <h3>Certifications</h3>
            <div className="tag-grid">
              {profile.certifications.map((c) => <span key={c} className="tag active">{c}</span>)}
            </div>
          </section>
        )}

        {profile.gearList.length > 0 && (
          <section className="profile-section">
            <h3>My Gear</h3>
            <div className="tag-grid">
              {profile.gearList.map((g) => <span key={g} className="tag active">{g}</span>)}
            </div>
          </section>
        )}

        {profile.favoriteTrails.length > 0 && (
          <section className="profile-section">
            <h3>Favorite Trails</h3>
            <div className="tag-grid">
              {profile.favoriteTrails.map((t) => <span key={t} className="tag-meta">{t}</span>)}
            </div>
          </section>
        )}

        {profile.availability.length > 0 && (
          <section className="profile-section">
            <h3>Availability</h3>
            <div className="tag-grid">
              {profile.availability.map((a) => <span key={a} className="tag-meta">{a}</span>)}
            </div>
          </section>
        )}

        {hasCustomFields && (
          <section className="profile-section">
            <h3>Custom Fields</h3>
            <div className="custom-fields">
              {profile.customFields.filter((f) => f.label && f.value).map((cf) => (
                <div key={cf.id} className="custom-field-row">
                  <strong>{cf.label}:</strong> {cf.value}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
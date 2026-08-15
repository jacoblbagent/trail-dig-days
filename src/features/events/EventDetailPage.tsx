import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MapExtras from '../map/MapExtras';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { registerForEvent, loadEventsFromStorage, removeVolunteer, promoteFromWaitlist, addNotification } from './eventsSlice';
import { addToast } from '../toast/toastSlice';
import CommentSection from '../comments/CommentSection';
import { v4 as uuidv4 } from 'uuid';

const MapRefCapture: React.FC<{ mapRef: React.MutableRefObject<L.Map | null> }> = ({ mapRef }) => {
  const map = useMap();
  mapRef.current = map;
  return null;
};

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const { user } = useAppSelector((s) => s.auth);
  const event = useAppSelector((s) => s.events.items.find((e) => e.id === id));
  const referrerPath = useAppSelector((s) => s.events.referrerPath);
  const [refreshing, setRefreshing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  if (!event) return <div className="loading">Event not found.</div>;

  const isCreator = user ? event.creatorId === user.id : false;
  const isRegistered = user ? event.registeredVolunteers.includes(user.id) : false;
  const isOnWaitlist = user ? event.waitlist.includes(user.id) : false;
  const isPast = new Date(event.date) < new Date(new Date().toDateString());
  const isFull = event.registeredVolunteers.length >= event.maxVolunteers;
  const volCount = event.registeredVolunteers.length;
  const { profiles } = useAppSelector((s) => s.profile);
  const creatorProfile = profiles[event.creatorId];

  const handleRegister = async () => {
    if (!user) { navigate('/auth'); dispatch(addToast({ message: 'Please sign in to register for dig days', type: 'warning' })); return; }
    try {
      const result = await dispatch(registerForEvent({ eventId: event.id, userId: user.id })).unwrap();
      const nowOnWaitlist = result.waitlist.includes(user.id);
      dispatch(addToast({
        message: isRegistered ? 'Unregistered' : nowOnWaitlist ? 'Added to waitlist' : 'Signed up!',
        type: nowOnWaitlist ? 'warning' : 'success',
      }));
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed', type: 'warning' }));
    }
  };

  const handleRemoveVolunteer = async (userId: string) => {
    try {
      await dispatch(removeVolunteer({ eventId: event.id, userId })).unwrap();
      dispatch(addToast({ message: 'Volunteer removed', type: 'info' }));
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed to remove', type: 'warning' }));
    }
  };

  const handlePromoteFromWaitlist = async (userId: string) => {
    try {
      await dispatch(promoteFromWaitlist({ eventId: event.id, userId })).unwrap();
      dispatch(addToast({ message: 'Promoted from waitlist', type: 'success' }));
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed to promote', type: 'warning' }));
    }
  };

  const handleMessageVolunteers = async () => {
    if (!messageText.trim() || !user) return;
    setSendingMessage(true);
    const msg = messageText.trim();
    for (const vid of event.registeredVolunteers) {
      if (vid === user.id) continue;
      dispatch(addNotification({
        id: uuidv4(),
        eventId: event.id,
        type: 'event',
        message: `Message from ${user.displayName}: ${msg}`,
        read: false,
        createdAt: new Date().toISOString(),
        fromUserId: user.id,
      }));
    }
    await new Promise((r) => setTimeout(r, 100));
    dispatch(addToast({ message: `Message sent to ${event.registeredVolunteers.filter((v) => v !== user.id).length} volunteer(s)`, type: 'success' }));
    setMessageText('');
    setShowMessageModal(false);
    setSendingMessage(false);
  };

  const handleExportCSV = () => {
    const rows: string[][] = [['Name', 'Email', 'Location', 'Skills', 'Gear', 'Digs', 'Hours']];
    for (const vid of event.registeredVolunteers) {
      const p = profiles[vid];
      const name = p?.displayName || vid.slice(0, 8);
      const email = vid === event.creatorId ? event.contactEmail : '';
      const loc = p?.location || '';
      const skills = p?.skills?.join('; ') || '';
      const gear = p?.gearList?.join('; ') || '';
      const digs = String(p?.digStats?.totalDigs ?? '');
      const hours = String(p?.digStats?.totalHours ?? '');
      rows.push([name, email, loc, skills, gear, digs, hours]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
    dispatch(addToast({ message: 'Roster exported as CSV', type: 'info' }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    dispatch(loadEventsFromStorage());
    await new Promise((r) => setTimeout(r, 400));
    setRefreshing(false);
  };

  return (
    <div className="event-detail-page">
      <div className="event-detail-inner">
        <button className="event-detail-page-back" onClick={() => navigate(referrerPath || '/')}><span className="nav-arrow">←</span> Back</button>
        <div className="event-detail-header">
          {event.imageUrl && (
            <div
              className="event-cover"
              style={{ backgroundImage: `url(${event.imageUrl})` }}
            />
          )}
          <div className="event-detail-title-group">
            <h1>
              {event.title}
              {event.isPrivate && <span className="private-badge">Private</span>}
              {isFull && <span className="full-badge">Full</span>}
              <span className={`status-badge status-${event.status}`}>{event.status}</span>
            </h1>
          </div>
        </div>

        <div className="event-detail-grid">
          <div className={`event-detail-main${showContent ? '' : ' collapsed-mobile'}`}>
            <button className="content-toggle-btn" onClick={() => setShowContent(!showContent)}>
              <span>{showContent ? 'Hide Details' : 'Show Details'}</span>
              <span className="nav-arrow">{showContent ? '▾' : '▸'}</span>
            </button>
            <section>
              <p>{event.description}</p>
            </section>

            <div className="items-columns">
              <section className="items-section">
                <h2>Provided:</h2>
                {event.providedItems.length > 0 ? (
                  <ul className="items-grid">
                    {event.providedItems.map((item) => (
                      <li key={item.name} className="item-card provided">
                        <span className="item-name">{item.name}</span>
                        <span className={`item-qty qty-${String(item.quantity).toLowerCase()}`}>{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Bring your own tools — nothing provided.</p>
                )}
              </section>

              <section className="items-section">
                <h2>Bring:</h2>
                {event.recommendedItems.length > 0 ? (
                  <ul className="items-grid">
                    {event.recommendedItems.map((item) => (
                      <li key={item.name} className={`item-card rec ${item.essential ? 'essential' : ''}`}>
                        <span className="item-name">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No specific recommendations.</p>
                )}
              </section>
            </div>

            {event.requirements.length > 0 && (
              <section>
                <h2>Requirements</h2>
                <ul className="requirements-list">
                  {event.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </section>
            )}
          </div>

          <div className="event-detail-sidebar">
            <div className="sidebar-card">
              <div className="date-badge">
                <span className="date-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                <span className="date-day">{new Date(event.date).getDate()}</span>
                <span className="date-year">{new Date(event.date).getFullYear()}</span>
                <span className="date-time">{event.startTime} – {event.endTime}</span>
              </div>

              <div className="volunteer-info">
                <div className="vol-progress">
                  <div
                    className="vol-progress-bar"
                    style={{ width: `${Math.min(100, (volCount / event.maxVolunteers) * 100)}%` }}
                  />
                </div>
                <p>{volCount} / {event.maxVolunteers} registered
                  <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh registration count">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'spin' : ''}>
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </button>
                </p>
              </div>

              {!isCreator && (
                <button
                  disabled={isPast}
                  style={{ opacity: isPast ? 0.5 : 1, cursor: isPast ? 'not-allowed' : 'pointer' }}
                  className={`btn btn-lg btn-block ${isOnWaitlist ? 'btn-ghost' : isRegistered ? 'btn-danger' : 'btn-primary'}`}
                  onClick={handleRegister}
                >
                  {isPast ? 'Event has passed' : isOnWaitlist ? 'Leave waitlist' : isRegistered ? ' Unregister' : isFull ? 'Join waitlist' : " I'll be there"}
                </button>
              )}

              {!isPast && isCreator && event.registeredVolunteers.length > 0 && (
                <div className="creator-message-area">
                  <button className="btn btn-ghost btn-block btn-sm" onClick={() => setShowMessageModal(true)}>
                    Message Volunteers
                  </button>
                  <button className="btn btn-ghost btn-block btn-sm" onClick={handleExportCSV}>
                    Export Roster (CSV)
                  </button>
                </div>
              )}

              <div className="contact-card">
                <h4>Contact</h4>
                <div className="contact-row">
                  <Link to={`/profile?userId=${event.creatorId}`} className="contact-link">
                  {creatorProfile?.avatarUrl ? (
                    <img src={creatorProfile.avatarUrl} alt="" className="contact-avatar" />
                  ) : (
                    <div className="contact-avatar contact-avatar-fallback">
                      {event.contactName.charAt(0)}
                    </div>
                  )}
                  <div className="contact-info">
                    <p>{event.contactName}</p>
                    <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
                    {event.contactPhone && <p>{event.contactPhone}</p>}
                  </div>
                  </Link>
                </div>
              </div>

              {isCreator && (
                <div className="creator-actions">
                  <Link to={`/events/${event.id}/edit`} className="btn btn-ghost btn-block">Edit Event</Link>
                </div>
              )}

              {isCreator && event.registeredVolunteers.length > 0 && (
                <div className="volunteer-roster">
                  <h4>Volunteers ({event.registeredVolunteers.length})</h4>
                  <ul className="roster-list">
                    {event.registeredVolunteers.map((vid) => {
                      const p = profiles[vid];
                      return (
                        <li key={vid} className="roster-item">
                          {p?.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="roster-avatar" />
                          ) : (
                            <div className="roster-avatar roster-avatar-fallback">
                              {p?.displayName?.charAt(0) || vid.charAt(0)}
                            </div>
                          )}
                          <span className="roster-name">{p?.displayName || vid.slice(0, 8)}</span>
                          {isCreator && !isPast && vid !== user?.id && (
                            <button
                              className="roster-remove-btn"
                              onClick={() => handleRemoveVolunteer(vid)}
                              title="Remove volunteer"
                            >
                              ✕
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {isCreator && event.waitlist.length > 0 && (
                <div className="waitlist-section">
                  <h4>Waitlist ({event.waitlist.length})</h4>
                  <ul className="roster-list">
                    {event.waitlist.map((vid) => {
                      const p = profiles[vid];
                      return (
                        <li key={vid} className="roster-item waitlist-item">
                          {p?.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="roster-avatar" />
                          ) : (
                            <div className="roster-avatar roster-avatar-fallback">
                              {p?.displayName?.charAt(0) || vid.charAt(0)}
                            </div>
                          )}
                          <span className="roster-name">{p?.displayName || vid.slice(0, 8)}</span>
                          {!isPast && (
                            <button
                              className="roster-promote-btn"
                              onClick={() => handlePromoteFromWaitlist(vid)}
                              title="Promote from waitlist"
                            >
                              ↑
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              </div>
          </div>
        </div>

        <div className="location-section-wrap">
          <div className="location-section">
            <div className="location-details">
              <h2>Location</h2>
              <p>{event.locationName} <span className="coords">{event.coordinates[0].toFixed(4)}, {event.coordinates[1].toFixed(4)}</span>
                <button className="pin-btn" onClick={() => mapRef.current?.flyTo(event.coordinates, 14, { duration: .8 })} title="Recenter map on event">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                  </svg>
                </button>
              </p>
              {event.parkingNotes && (
                <div className="notes-card">
                  <strong> Parking:</strong> {event.parkingNotes}
                </div>
              )}
              {event.weatherNotes && (
                <div className="notes-card">
                  <strong> Weather:</strong> {event.weatherNotes}
                </div>
              )}
            </div>
            <div className="detail-map">
              <MapContainer
                center={event.coordinates}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '250px', width: '100%', borderRadius: '8px' }}
                maxBounds={[[24, -125], [50, -66]]}
                maxBoundsViscosity={1}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={event.coordinates}>
                  <Popup>{event.locationName}</Popup>
                </Marker>
                <MapRefCapture mapRef={mapRef} />
                <MapExtras />
              </MapContainer>
            </div>
          </div>
        </div>

        <CommentSection eventId={event.id} eventCreatorId={event.creatorId} />

      </div>

      {/* Message Volunteers Modal */}
      {showMessageModal && (
        <div className="modal-backdrop" onClick={() => { if (!sendingMessage) setShowMessageModal(false); }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Message Volunteers</h3>
              <button className="modal-close" onClick={() => { if (!sendingMessage) setShowMessageModal(false); }}>✕</button>
            </div>
            <div className="modal-body">
              <p className="muted">Sending to {event.registeredVolunteers.filter((v) => v !== user?.id).length} registered volunteer(s). The message will appear in their notifications.</p>
              <textarea
                className="modal-textarea"
                placeholder="Write your message to volunteers..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                disabled={sendingMessage}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowMessageModal(false)} disabled={sendingMessage}>Cancel</button>
              <button className="btn btn-primary" onClick={handleMessageVolunteers} disabled={!messageText.trim() || sendingMessage}>
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
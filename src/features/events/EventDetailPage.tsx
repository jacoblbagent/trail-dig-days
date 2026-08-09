import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MapExtras from '../map/MapExtras';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { registerForEvent, deleteEvent } from './eventsSlice';

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

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!event) return <div className="loading">Event not found.</div>;
  if (!user) return null;

  const isCreator = event.creatorId === user.id;
  const isRegistered = event.registeredVolunteers.includes(user.id);
  const volCount = event.registeredVolunteers.length;
  const { profiles } = useAppSelector((s) => s.profile);
  const creatorProfile = profiles[event.creatorId];

  const handleRegister = () => {
    dispatch(registerForEvent({ eventId: event.id, userId: user.id }));
  };

  const handleDelete = () => {
    if (window.confirm('Delete this dig day?')) {
      dispatch(deleteEvent(event.id));
      navigate('/');
    }
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
            <h1>{event.title}</h1>
            <p className="trail-name">{event.trailName}{event.trailSystem ? ` · ${event.trailSystem}` : ''}</p>
          </div>
        </div>

        <div className="event-detail-grid">
          <div className="event-detail-main">
            <section>
              <h2>About This Dig Day</h2>
              <p>{event.description}</p>
            </section>

            <div className="items-columns">
              <section className="items-section">
                <h2>Provided by the Crew</h2>
                {event.providedItems.length > 0 ? (
                  <ul className="items-grid">
                    {event.providedItems.map((item) => (
                      <li key={item.name} className="item-card provided">
                        <span className="item-name">{item.name}</span>
                        <span className={`item-qty qty-${String(item.quantity).toLowerCase()}`}>{item.quantity}</span>
                        {item.description && <p className="item-desc">{item.description}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Bring your own tools — nothing provided.</p>
                )}
              </section>

              <section className="items-section">
                <h2>Recommended to Bring</h2>
                {event.recommendedItems.length > 0 ? (
                  <ul className="items-grid">
                    {event.recommendedItems.map((item) => (
                      <li key={item.name} className={`item-card rec ${item.essential ? 'essential' : ''}`}>
                        <span className="item-name">
                          {item.essential ? ' ' : ''}{item.name}
                        </span>
                        {item.essential && <span className="essential-tag">ESSENTIAL</span>}
                        {item.notes && <p className="item-desc">{item.notes}</p>}
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
              </div>
              <div className="time-info">
                {event.startTime} – {event.endTime}
              </div>

              <div className="volunteer-info">
                <div className="vol-progress">
                  <div
                    className="vol-progress-bar"
                    style={{ width: `${Math.min(100, (volCount / event.maxVolunteers) * 100)}%` }}
                  />
                </div>
                <p>{volCount} / {event.maxVolunteers} registered</p>
              </div>

              {!isCreator && (
                <button
                  className={`btn btn-lg btn-block ${isRegistered ? 'btn-danger' : 'btn-primary'}`}
                  onClick={handleRegister}
                >
                  {isRegistered ? ' Unregister' : ' Sign Up for Dig Day'}
                </button>
              )}

              <div className="contact-card">
                <h4>Contact</h4>
                <div className="contact-row">
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
                </div>
              </div>

              {isCreator && (
                <div className="creator-actions">
                  <button className="btn btn-danger" onClick={handleDelete}>Delete Event</button>
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
      </div>
    </div>
  );
};

export default EventDetailPage;
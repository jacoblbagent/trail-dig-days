import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { registerForEvent, deleteEvent } from './eventsSlice';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const event = useAppSelector((s) => s.events.items.find((e) => e.id === id));

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!event) return <div className="loading">Event not found.</div>;
  if (!user) return null;

  const isCreator = event.creatorId === user.id;
  const isRegistered = event.registeredVolunteers.includes(user.id);
  const volCount = event.registeredVolunteers.length;

  const handleRegister = () => {
    dispatch(registerForEvent({ eventId: event.id, userId: user.id }));
  };

  const handleDelete = () => {
    if (window.confirm('Delete this dig day?')) {
      dispatch(deleteEvent(event.id));
      navigate('/dig-days');
    }
  };

  const statusColors: Record<string, string> = {
    planned: '#f59e0b', confirmed: '#22c55e', cancelled: '#ef4444', completed: '#6b7280',
  };

  const diffLabels: Record<string, string> = {
    easy: '🟢 Easy', moderate: '🟡 Moderate', challenging: '🟠 Challenging', expert: '🔴 Expert',
  };

  return (
    <div className="event-detail-page">
      <div className="event-detail-header">
        {event.imageUrl && (
          <div
            className="event-cover"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          />
        )}
        <div className="event-detail-meta">
          <span className="status-badge" style={{ background: statusColors[event.status] }}>
            {event.status.toUpperCase()}
          </span>
          <span>{diffLabels[event.difficulty]}</span>
        </div>
        <h1>{event.title}</h1>
        <p className="trail-name">{event.trailName}{event.trailSystem ? ` · ${event.trailSystem}` : ''}</p>
      </div>

      <div className="event-detail-grid">
        <div className="event-detail-main">
          <section>
            <h2>📝 About This Dig Day</h2>
            <p>{event.description}</p>
          </section>

          <section className="items-section">
            <h2>🛠️ Provided by the Crew</h2>
            {event.providedItems.length > 0 ? (
              <div className="items-grid">
                {event.providedItems.map((item) => (
                  <div key={item.name} className="item-card provided">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">×{item.quantity}</span>
                    {item.description && <p className="item-desc">{item.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Bring your own tools — nothing provided.</p>
            )}
          </section>

          <section className="items-section">
            <h2>🎒 Recommended to Bring</h2>
            {event.recommendedItems.length > 0 ? (
              <div className="items-grid">
                {event.recommendedItems.map((item) => (
                  <div key={item.name} className={`item-card rec ${item.essential ? 'essential' : ''}`}>
                    <span className="item-name">
                      {item.essential ? '⭐ ' : ''}{item.name}
                    </span>
                    {item.essential && <span className="essential-tag">ESSENTIAL</span>}
                    {item.notes && <p className="item-desc">{item.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No specific recommendations.</p>
            )}
          </section>

          {event.requirements.length > 0 && (
            <section>
              <h2>📋 Requirements</h2>
              <ul className="requirements-list">
                {event.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>
          )}

          <section>
            <h2>📍 Location</h2>
            <p>{event.locationName}</p>
            <div className="detail-map">
              <MapContainer
                center={event.coordinates}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '250px', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={event.coordinates}>
                  <Popup>{event.locationName}</Popup>
                </Marker>
              </MapContainer>
            </div>
            {event.parkingNotes && (
              <div className="notes-card">
                <strong>🚗 Parking:</strong> {event.parkingNotes}
              </div>
            )}
            {event.weatherNotes && (
              <div className="notes-card">
                <strong>🌤️ Weather:</strong> {event.weatherNotes}
              </div>
            )}
          </section>
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
              <h3>Volunteers</h3>
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
                {isRegistered ? '✕ Unregister' : '✅ Sign Up for Dig Day'}
              </button>
            )}

            <div className="contact-card">
              <h4>Contact</h4>
              <p>{event.contactName}</p>
              <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
              {event.contactPhone && <p>{event.contactPhone}</p>}
            </div>

            {isCreator && (
              <div className="creator-actions">
                <button className="btn btn-danger" onClick={handleDelete}>🗑️ Delete Event</button>
                <Link to="/dig-days" className="btn btn-ghost">⬅ Back to Map</Link>
              </div>
            )}

            {!isCreator && (
              <Link to="/dig-days" className="btn btn-ghost btn-block">⬅ Browse More Dig Days</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
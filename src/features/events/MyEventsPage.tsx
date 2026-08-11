import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';

const MyEventsPage: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const events = useAppSelector((s) => s.events.items);

  const myEvents = user ? events.filter((e) => e.creatorId === user.id) : [];
  const signedUp = user ? events.filter((e) => e.registeredVolunteers.includes(user.id) && e.creatorId !== user.id) : [];

  if (!user) {
    return (
      <div className="page-message">
        <p>Sign in to see your events.</p>
        <Link to="/auth" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-flex' }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div className="create-event-page">
      <div className="page-header">
        <h1>My Events</h1>
        <p>Dig days you created or signed up for</p>
      </div>

      {myEvents.length > 0 && (
        <>
          <h2 style={{ color: 'var(--stone-700)', fontSize: '1rem', margin: '0 0 8px', fontWeight: 600 }}>Created by You</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
            {myEvents.map((e) => (
              <div
                key={e.id}
                className="event-list-card"
                onClick={() => navigate(`/events/${e.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="list-card-header">
                  <h3>{e.title}</h3>
                </div>
                <p className="list-card-trail">{e.trailName}{e.trailSystem ? ` · ${e.trailSystem}` : ''}</p>
                <div className="list-card-row">
                  <span className="list-card-date">{new Date(e.date).toLocaleDateString()}</span>
                  <span className="list-card-location">{e.locationName}</span>
                  <span className="list-card-spots">{e.registeredVolunteers.length}/{e.maxVolunteers}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {signedUp.length > 0 && (
        <>
          <h2 style={{ color: 'var(--stone-700)', fontSize: '1rem', margin: '0 0 8px', fontWeight: 600 }}>Signed Up</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {signedUp.map((e) => (
              <div
                key={e.id}
                className="event-list-card"
                onClick={() => navigate(`/events/${e.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="list-card-header">
                  <h3>{e.title}</h3>
                </div>
                <p className="list-card-trail">{e.trailName}{e.trailSystem ? ` · ${e.trailSystem}` : ''}</p>
                <div className="list-card-row">
                  <span className="list-card-date">{new Date(e.date).toLocaleDateString()}</span>
                  <span className="list-card-location">{e.locationName}</span>
                  <span className="list-card-spots">{e.registeredVolunteers.length}/{e.maxVolunteers}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {myEvents.length === 0 && signedUp.length === 0 && (
        <p className="muted" style={{ padding: '40px 0' }}>No events yet. Create one to get started!</p>
      )}
    </div>
  );
};

export default MyEventsPage;
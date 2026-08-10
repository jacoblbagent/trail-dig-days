import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import type { DigEvent } from '../../types';

const formatRecurrence = (r: string | undefined) => {
  if (!r) return '';
  switch (r) {
    case 'weekly': return 'Weekly';
    case 'biweekly': return 'Every 2 weeks';
    case 'monthly': return 'Monthly';
    default: return r;
  }
};

const formatDate = (d: string | undefined) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
};

const RecurringEventsPage: React.FC = () => {
  const events = useAppSelector((s) => s.events.items);
  const mapSidebarCollapsed = useAppSelector((s) => s.events.mapSidebarCollapsed);
  const currentUser = useAppSelector((s) => s.auth.user);
  const canCreate = currentUser?.userType === 'organization';
  const recurring = events.filter((e) => e.recurrence && e.recurrence !== 'none');

  const [sidebarWidth, setSidebarWidth] = useState(380);
  const widthRef = useRef(380);
  const SIDEBAR_MIN = 240;
  const SIDEBAR_MAX = 600;
  const nearMin = sidebarWidth <= SIDEBAR_MIN + 20;
  const nearMax = sidebarWidth >= SIDEBAR_MAX - 20;

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widthRef.current;
    const onMove = (me: MouseEvent) => {
      const w = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startW + me.clientX - startX));
      widthRef.current = w;
      setSidebarWidth(w);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <>
      <div className={`map-sidebar ${nearMin ? 'at-min' : ''} ${nearMax ? 'at-max' : ''}${mapSidebarCollapsed ? ' collapsed' : ''}`} style={{ width: sidebarWidth }}>
        <div className="map-sidebar-header">
          <h1>Repeating</h1>
          {canCreate && <Link to="/events/create" className="btn btn-primary btn-sm">+ New</Link>}
        </div>

        <div className="sidebar-content">
          {recurring.length === 0 ? (
            <div className="empty-state">
              <p>No recurring events yet.</p>
            </div>
          ) : (
            <div className="event-list" style={{ paddingTop: 8 }}>
              {recurring.map((event: DigEvent) => (
                <Link
                  to={`/events/${event.id}`}
                  key={event.id}
                  className="event-list-card"
                >
                  {event.imageUrl && (
                    <div
                      className="list-card-img"
                      style={{ backgroundImage: `url(${event.imageUrl})` }}
                    />
                  )}
                  <div className="list-card-body">
                    <div className="list-card-header">
                      <h3>{event.title}</h3>
                    </div>
                    <div className="list-card-row">
                      <span className="list-card-location">{event.trailName}</span>
                      <span className="list-card-sep">·</span>
                      <span className="list-card-date">{formatRecurrence(event.recurrence)}</span>
                      <span className="list-card-spots">Until {formatDate(event.recurrenceEnd)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`sidebar-resizer ${nearMin ? 'at-min' : ''} ${nearMax ? 'at-max' : ''}`} onMouseDown={handleResizeStart}>
        <div className="resizer-grip" />
        <div className="resizer-limits">
          <span className={`limit-indicator ${nearMin ? 'visible' : ''}`}>{SIDEBAR_MIN}px</span>
          <span className={`limit-indicator ${nearMax ? 'visible' : ''}`}>{SIDEBAR_MAX}px</span>
        </div>
      </div>
    </>
  );
};

export default RecurringEventsPage;
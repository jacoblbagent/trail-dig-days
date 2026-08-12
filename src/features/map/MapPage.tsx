import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { collapseRecurring, expandRecurring } from '../../utils/recurrence';
import { setSelectedDay } from '../events/eventsSlice';
import { haversine } from './mapUtils';
import type { DigEvent } from '../../types';

const DEFAULT_CENTER: [number, number] = [39.7392, -104.9903];

const EventCard = memo(function EventCard({ event, center }: { event: DigEvent; center: [number, number] | null }) {
  const dist = center ? haversine(center, event.coordinates) : null;
  return (
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
          {event.recurrence && event.recurrence !== 'none' && (
            <span className="recurring-badge">Recurring</span>
          )}
        </div>
        <p className="list-card-trail">{event.trailName}</p>
        <div className="list-card-row">
          <span className="list-card-location">{event.locationName}</span>
          <span className="list-card-sep">·</span>
          <span className="list-card-date">
            {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
            })} {event.startTime}
          </span>
          <span className="list-card-spots">{event.registeredVolunteers.length}/{event.maxVolunteers} spots</span>
        </div>
        {dist !== null && <span className="list-card-dist">{dist < 1 ? dist.toFixed(1) : Math.round(dist)} mi away</span>}
      </div>
    </Link>
  );
});

const MapPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.events.items);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const searchRadius = useAppSelector((s) => s.events.searchRadius);
  const selectedDay = useAppSelector((s) => s.events.selectedDay);
  const [radiusInput] = useState(() => String(searchRadius));
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'spots'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showRecurring] = useState(false);
  const [rightWidth, setRightWidth] = useState(380);
  const rightWidthRef = useRef(380);
  const sortRef = useRef<HTMLDivElement>(null);

  const RIGHT_SIDEBAR_MIN = 240;
  const RIGHT_SIDEBAR_MAX = 600;
  const RIGHT_SIDEBAR_DEFAULT = 380;

  useEffect(() => {
    if (sortBy === 'distance' && !searchCenter) {
      setSortBy('date');
    }
  }, [searchCenter, sortBy]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = rightWidthRef.current;
    const onMove = (me: MouseEvent) => {
      const newW = Math.max(RIGHT_SIDEBAR_MIN, Math.min(RIGHT_SIDEBAR_MAX, startW - (me.clientX - startX)));
      rightWidthRef.current = newW;
      setRightWidth(newW);
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

  const handleResizerDblClick = () => {
    rightWidthRef.current = RIGHT_SIDEBAR_DEFAULT;
    setRightWidth(RIGHT_SIDEBAR_DEFAULT);
  };

  const collapsed = useMemo(() => collapseRecurring(items), [items]);
  const expanded = useMemo(() => expandRecurring(items), [items]);

  const filtered = useMemo(() => {
    const radius = searchRadius || 100;
    let result = collapsed;
    if (radius < 100) {
      const c = searchCenter || DEFAULT_CENTER;
      result = collapsed.filter((e) => haversine(c, e.coordinates) <= radius);
    }
    if (showRecurring) {
      result = result.filter((e) => e.recurrence && e.recurrence !== 'none');
    }
    return result;
  }, [collapsed, searchCenter, searchRadius, showRecurring]);

  const eventMap = useMemo(() => {
    const radius = searchRadius || 100;
    const c = searchCenter || DEFAULT_CENTER;
    let all = radius < 100
      ? expanded.filter((e) => haversine(c, e.coordinates) <= radius)
      : expanded;
    const map = new Map<string, typeof all>();
    for (const e of all) {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [expanded, searchRadius, searchCenter]);

  const sorted = useMemo(() => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    const c = searchCenter || DEFAULT_CENTER;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortBy === 'distance') {
        return dir * (haversine(c, a.coordinates) - haversine(c, b.coordinates));
      }
      const aSpots = a.maxVolunteers - a.registeredVolunteers.length;
      const bSpots = b.maxVolunteers - b.registeredVolunteers.length;
      return dir * (aSpots - bSpots);
    });
  }, [filtered, sortBy, sortOrder, searchCenter]);

  return (
    <>
      <div className="sidebar-resizer" onMouseDown={handleResizeStart} onDoubleClick={handleResizerDblClick} style={{ order: 2 }}>
        <div className="resizer-grip" />
        <div className="resizer-limits" />
      </div>

      <div className="sidebar-col sidebar-col-list" style={{ width: rightWidth, order: 2 }}>
        {selectedDay ? (
          <div className="calendar-list">
            <h2>
              <button className="btn btn-ghost btn-sm cal-back" onClick={() => dispatch(setSelectedDay(null))}>
                <span className="nav-arrow">←</span>
              </button>
              {' '}Events on {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            {(() => {
              const dayEvents = eventMap.get(selectedDay) || [];
              return dayEvents.length === 0 ? (
                <p className="muted">No events on this day.</p>
              ) : (
                <ul className="calendar-event-list">
                  {[...dayEvents]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((e) => (
                      <li key={e.id} className="calendar-event-item">
                        <Link to={`/events/${e.id}`} className="calendar-event-link">
                          <span className="cal-event-title">{e.title}</span>
                          <div className="cal-event-meta">
                            <span className="cal-event-date">{e.date}</span>
                            <span className="cal-event-location">{e.locationName}</span>
                            <span className="cal-event-time">{e.startTime}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              );
            })()}
          </div>
        ) : (
          <>
            <div className="event-list-header">
              <span className="event-list-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              <div className="event-list-sort" ref={sortRef}>
                <span className="event-list-sort-label" onClick={() => setShowSortMenu(!showSortMenu)}>
                  {sortBy === 'date' ? 'Date' : sortBy === 'distance' ? 'Distance' : 'Spots'}
                </span>
                {showSortMenu && (
                  <div className="event-list-sort-menu">
                    <button onClick={() => { setSortBy('date'); setShowSortMenu(false); }} className={sortBy === 'date' ? 'active' : ''}>Date</button>
                    <button onClick={() => { setSortBy('distance'); setShowSortMenu(false); }} className={sortBy === 'distance' ? 'active' : ''} disabled={!searchCenter} style={{ opacity: !searchCenter ? 0.4 : 1 }}>Distance</button>
                    <button onClick={() => { setSortBy('spots'); setShowSortMenu(false); }} className={sortBy === 'spots' ? 'active' : ''}>Spots</button>
                  </div>
                )}
                <span className="event-list-sort-arrow" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>{sortOrder === 'desc' ? '↓' : '↑'}</span>
              </div>
            </div>
            <div className="event-list">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <p>No dig days found within {radiusInput} miles.</p>
                  <p>Try expanding your radius or <Link to="/events/create">create one</Link>!</p>
                </div>
              ) : (
                sorted.map((event) => (
                  <EventCard event={event} key={event.id} center={searchCenter || DEFAULT_CENTER} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MapPage;
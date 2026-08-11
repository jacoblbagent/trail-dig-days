import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setSearchRadius, setSearchCenter } from '../events/eventsSlice';
import { expandRecurring, collapseRecurring } from '../../utils/recurrence';
import { haversine } from './mapUtils';
import type { DigEvent } from '../../types';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

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
  const mapSidebarCollapsed = useAppSelector((s) => s.events.mapSidebarCollapsed);
  const currentUser = useAppSelector((s) => s.auth.user);
  const canCreate = currentUser?.userType === 'organization';

  const [radiusInput, setRadiusInput] = useState('25');
  const [addressQuery, setAddressQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'spots'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const widthRef = useRef(380);
  const sortRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    if (sortBy === 'distance' && !searchCenter) {
      setSortBy('date');
    }
  }, [searchCenter, sortBy]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showSortMenu]);

  const SIDEBAR_MIN = 240;
  const SIDEBAR_MAX = 600;
  const SIDEBAR_DEFAULT = 380;

  const nearMin = sidebarWidth <= SIDEBAR_MIN + 20 && sidebarWidth > 0;
  const nearMax = sidebarWidth >= SIDEBAR_MAX - 20;

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widthRef.current;
    const onMove = (me: MouseEvent) => {
      const newW = Math.max(0, Math.min(SIDEBAR_MAX, startW + (me.clientX - startX)));
      widthRef.current = newW;
      setSidebarWidth(newW);
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
    widthRef.current = SIDEBAR_DEFAULT;
    setSidebarWidth(SIDEBAR_DEFAULT);
  };

  const expanded = useMemo(() => expandRecurring(items), [items]);
  const collapsed = useMemo(() => collapseRecurring(items), [items]);

  // Filter expanded events by radius (for calendar dots)
  const filteredExpanded = useMemo(() => {
    const radius = parseFloat(radiusInput) || 250;
    if (radius >= 250) return expanded;
    if (!searchCenter) return expanded;
    return expanded.filter((e) => haversine(searchCenter, e.coordinates) <= radius);
  }, [expanded, searchCenter, radiusInput]);

  // Calendar: events per day (within radius)
  const eventMap = useMemo(() => {
    const map = new Map<string, typeof expanded>();
    for (const e of filteredExpanded) {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [expanded]);

  const filtered = useMemo(() => {
    const radius = parseFloat(radiusInput) || 250;
    if (radius >= 250) return collapsed;
    if (!searchCenter) return collapsed;
    return collapsed.filter((e) => haversine(searchCenter, e.coordinates) <= radius);
  }, [collapsed, searchCenter, radiusInput]);

  const sorted = useMemo(() => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    const c = searchCenter;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortBy === 'distance') {
        if (!c) return 0;
        return dir * (haversine(c, a.coordinates) - haversine(c, b.coordinates));
      }
      const aSpots = a.maxVolunteers - a.registeredVolunteers.length;
      const bSpots = b.maxVolunteers - b.registeredVolunteers.length;
      return dir * (aSpots - bSpots);
    });
  }, [filtered, sortBy, sortOrder, searchCenter]);

  const prevMonth = () => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRadiusInput(val);
    dispatch(setSearchRadius(parseFloat(val) || 250));
  };

  const handleAddressSearch = async (q: string) => {
    if (!q.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        dispatch(setSearchCenter([parseFloat(lat), parseFloat(lon)]));
        setAddressQuery(data[0].display_name);
      }
    } catch { /* ignore */ }
  };

  // Calendar cells
  const cells: { day: number; events: typeof expanded }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, events: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, events: eventMap.get(dateStr) || [] });
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, events: [] });
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <>
      <div className={`map-sidebar ${nearMin ? 'at-min' : ''} ${nearMax ? 'at-max' : ''}${mapSidebarCollapsed ? ' collapsed' : ''}`} style={{ width: sidebarWidth }}>
        <div className="map-sidebar-header">
          <h1>Dig Days</h1>
          {canCreate && <Link to="/events/create" className="btn btn-primary btn-sm">+ New</Link>}
        </div>

              <div className="search-controls">
          <div className="radius-control">
            <label>Search radius: <strong>{radiusInput} mi</strong></label>
            <input
              type="range"
              min={5}
              max={250}
              value={radiusInput}
              onChange={handleRadiusChange}
            />
          </div>
          <div className="address-search">
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddressSearch(addressQuery); }}
              placeholder="Search address…"
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleAddressSearch(addressQuery)}>Go</button>
          </div>
        </div>

        <div className="calendar-grid-wrap">
          <div className="calendar-nav">
            <button className="btn btn-ghost btn-sm" onClick={prevMonth}><span className="nav-arrow">←</span></button>
            <strong>{MONTHS[month]} {year}</strong>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth}>→</button>
            <button className="btn btn-ghost btn-sm cal-collapse-btn" onClick={() => setCalendarCollapsed(!calendarCollapsed)}>{calendarCollapsed ? '▸' : '▾'}</button>
          </div>
          {!calendarCollapsed && (
          <div className="calendar-grid">
            {DAYS.map((d) => (<div key={d} className="cal-day-header">{d}</div>))}
            {cells.map((cell, i) => {
              const dateStr = cell.day
                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
                : '';
              return (
                <div
                  key={i}
                  className={`cal-cell ${cell.day === 0 ? 'cal-empty' : ''} ${cell.events.length > 0 ? 'cal-has-events' : ''} ${isToday(cell.day) ? 'cal-today' : ''} ${selectedDay === dateStr ? 'cal-selected' : ''}`}
                  onClick={() => { if (cell.day > 0) { setSelectedDay(selectedDay === dateStr ? null : dateStr); } }}
                  title={cell.events.length > 0 ? `${cell.events.length} event${cell.events.length > 1 ? 's' : ''}` : undefined}
                >
                  {cell.day > 0 && (
                    <>
                      <span className="cal-day-num">{cell.day}</span>
                      {cell.events.length > 0 && <span className="cal-dot">{cell.events.length}</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>

        <hr className="calendar-separator" />

        {selectedDay ? (
          <div className="calendar-list">
            <h2>
              <button className="btn btn-ghost btn-sm cal-back" onClick={() => setSelectedDay(null)}><span className="nav-arrow">←</span></button>
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
                  <EventCard event={event} key={event.id} center={searchCenter} />
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className={`sidebar-resizer ${nearMin ? 'at-min' : ''} ${nearMax ? 'at-max' : ''}`} onMouseDown={handleResizeStart} onDoubleClick={handleResizerDblClick}>
        <div className="resizer-grip" />
        <div className="resizer-limits">
          <span className={`limit-indicator ${nearMin ? 'visible' : ''}`}>{SIDEBAR_MIN}px</span>
          <span className={`limit-indicator ${nearMax ? 'visible' : ''}`}>{SIDEBAR_MAX}px</span>
        </div>
      </div>
    </>
  );
};

export default MapPage;
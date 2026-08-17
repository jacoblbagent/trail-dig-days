import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { collapseRecurring, expandRecurring } from '../../utils/recurrence';
import { setSelectedDay, setFilterPanel } from '../events/eventsSlice';
import { haversine } from './mapUtils';
import type { DigEvent } from '../../types';

const DEFAULT_CENTER: [number, number] = [39.7392, -104.9903];

const inBounds = (coord: [number, number], bounds: [[number, number], [number, number]]): boolean => {
  const [lat, lng] = coord;
  const [[south, west], [north, east]] = bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
};

const boundsCenter = (bounds: [[number, number], [number, number]]): [number, number] => {
  const [[south, west], [north, east]] = bounds;
  return [(south + north) / 2, (west + east) / 2];
};

const EventCard = memo(function EventCard({ event, center }: { event: DigEvent; center: [number, number] | null }) {
  const dist = center ? haversine(center, event.coordinates) : null;
  const isFull = event.registeredVolunteers.length >= event.maxVolunteers;
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
          <div className="list-card-badges">
            {event.recurrence && event.recurrence !== 'none' && (
              <span className="recurring-badge">Recurring</span>
            )}
            {isFull && <span className="full-badge">Full</span>}
          </div>
        </div>
        <p className="list-card-trail">
            {event.trailName}
            {dist !== null && <span className="list-card-dist"> ({dist < 1 ? dist.toFixed(1) : Math.round(dist)} mi)</span>}
          </p>
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
  const mapBounds = useAppSelector((s) => s.events.mapBounds);
  const selectedDay = useAppSelector((s) => s.events.selectedDay);
  const searchQuery = useAppSelector((s) => s.events.searchQuery);
  const showRecurring = useAppSelector((s) => s.events.showRecurring);
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'spots'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);
  const [rightWidth, setRightWidth] = useState(380);
  const rightWidthRef = useRef(380);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const filterPanel = useAppSelector((s) => s.events.filterPanel);

  const RIGHT_SIDEBAR_MIN = 240;
  const RIGHT_SIDEBAR_MAX = 600;
  const RIGHT_SIDEBAR_DEFAULT = 380;

  const viewCenter: [number, number] | null = mapBounds ? boundsCenter(mapBounds) : null;

  useEffect(() => {
    if (sortBy === 'distance' && !viewCenter) {
      setSortBy('date');
    }
  }, [viewCenter, sortBy]);

  useEffect(() => {
    const el = document.querySelector('.map-page');
    if (el) {
      if (eventsCollapsed) el.removeAttribute('data-events-open');
      else el.setAttribute('data-events-open', '');
      (el as HTMLElement).style.setProperty('--events-width', `${rightWidth}px`);
    }
    // Notify Leaflet to recalculate map container size
    window.dispatchEvent(new Event('resize'));
  }, [eventsCollapsed, rightWidth]);

  // Keep map bottom edge matched to events list height on mobile
  useEffect(() => {
    const listEl = document.querySelector('.sidebar-col-list');
    if (!listEl) return;
    const ro = new ResizeObserver((entries) => {
      const page = document.querySelector('.map-page') as HTMLElement | null;
      if (page) {
        page.style.setProperty('--events-height', `${entries[0].contentRect.height}px`);
      }
    });
    ro.observe(listEl);
    return () => ro.disconnect();
  }, []);

  // Close sort menu and filter menu on click outside
  useEffect(() => {
    if (!showSortMenu && !showFilters) return;
    const handler = (e: MouseEvent) => {
      if (showSortMenu && sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (showFilters && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSortMenu, showFilters]);

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
    let result = collapsed;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.trailName.toLowerCase().includes(q) ||
        e.trailSystem.toLowerCase().includes(q) ||
        e.locationName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    if (mapBounds) {
      result = result.filter((e) => inBounds(e.coordinates, mapBounds));
    }
    if (showRecurring) {
      result = result.filter((e) => e.recurrence && e.recurrence !== 'none');
    }
    if (selectedDay) {
      result = result.filter((e) => {
        const eDate = (e.date as string).slice(0, 10);
        return eDate === selectedDay;
      });
    }
    return result;
  }, [collapsed, mapBounds, showRecurring, searchQuery, selectedDay]);

  const eventMap = useMemo(() => {
    let all = expanded;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      all = all.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.trailName.toLowerCase().includes(q) ||
        e.trailSystem.toLowerCase().includes(q) ||
        e.locationName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    if (mapBounds) {
      all = all.filter((e) => inBounds(e.coordinates, mapBounds));
    }
    const map = new Map<string, typeof all>();
    for (const e of all) {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [expanded, mapBounds, searchQuery]);

  const visibleCount = selectedDay
    ? (eventMap.get(selectedDay) || []).length
    : filtered.length;

  const sorted = useMemo(() => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    const c = viewCenter || DEFAULT_CENTER;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortBy === 'distance') {
        return dir * (haversine(c, a.coordinates) - haversine(c, b.coordinates));
      }
      const aSpots = a.maxVolunteers - a.registeredVolunteers.length;
      const bSpots = b.maxVolunteers - b.registeredVolunteers.length;
      return dir * (aSpots - bSpots);
    });
  }, [filtered, sortBy, sortOrder, viewCenter]);

  return (
    <>
      <div className="sidebar-resizer" onMouseDown={handleResizeStart} onDoubleClick={handleResizerDblClick} style={{ order: 2 }}>
        <div className="resizer-grip" />
        <div className="resizer-limits" />
      </div>

      <div className={`sidebar-col sidebar-col-list${eventsCollapsed ? ' collapsed' : ''}`} style={{ width: rightWidth, order: 2 }}>
        <div className={`events-toggle-bar${eventsCollapsed ? ' collapsed' : ''}`} onClick={() => setEventsCollapsed(!eventsCollapsed)}>
          <span className="events-toggle-label">
            Events ({visibleCount})
          </span>
          <span className="events-toggle-arrow">{eventsCollapsed ? '▸' : '▾'}</span>
        </div>
        {!eventsCollapsed && (
          <>{selectedDay ? (
          <>
            <div className="event-list-header">
              <button className="btn btn-ghost btn-sm cal-back" onClick={() => dispatch(setSelectedDay(null))}>
                <span className="nav-arrow">←</span>
              </button>
              <span className="event-list-count">Events on {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="event-list">
              {(() => {
                const dayEvents = eventMap.get(selectedDay) || [];
                return dayEvents.length === 0 ? (
                  <div className="empty-state"><p>No events on this day.</p></div>
                ) : (
                  [...dayEvents]
                    .sort((a, b) => sortOrder === 'asc'
                      ? new Date(a.date).getTime() - new Date(b.date).getTime()
                      : new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((event) => (
                      <EventCard event={event} key={event.id} center={viewCenter} />
                    ))
                );
              })()}
            </div>
          </>
        ) : (
          <>
            <div className="event-list-header">
              <span className="event-list-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              {selectedDay && (
                <span className="event-list-filter-badge">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <button className="event-list-filter-clear" onClick={() => dispatch(setSelectedDay(null))} aria-label="Clear date filter">✕</button>
                </span>
              )}
              <div className="event-list-sort" ref={sortRef}>
                <span className="event-list-sort-label" onClick={() => setShowSortMenu(!showSortMenu)}>
                  {sortBy === 'date' ? 'Date' : sortBy === 'distance' ? 'Distance' : 'Spots'}
                </span>
                {showSortMenu && (
                  <div className="event-list-sort-menu">
                    <button onClick={() => { setSortBy('date'); setShowSortMenu(false); }} className={sortBy === 'date' ? 'active' : ''}>Date</button>
                    <button onClick={() => { setSortBy('distance'); setShowSortMenu(false); }} className={sortBy === 'distance' ? 'active' : ''} disabled={!viewCenter} style={{ opacity: !viewCenter ? 0.4 : 1 }}>Distance</button>
                    <button onClick={() => { setSortBy('spots'); setShowSortMenu(false); }} className={sortBy === 'spots' ? 'active' : ''}>Spots</button>
                  </div>
                )}
                <span className="event-list-sort-arrow" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>{sortOrder === 'desc' ? '↓' : '↑'}</span>
              </div>
              <div className="event-list-filter" ref={filterRef}>
                <button
                  className={`event-list-filter-btn${showFilters ? ' active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                  aria-label="Toggle filters"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="8" y1="12" x2="20" y2="12" />
                    <line x1="12" y1="18" x2="20" y2="18" />
                  </svg>
                </button>
                {showFilters && (
                  <div className="event-list-filter-menu" ref={filterRef}>
                    <button className={`filter-menu-trigger ${filterPanel === 'location' ? 'active' : ''}`} onClick={() => dispatch(setFilterPanel(filterPanel === 'location' ? null : 'location'))}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      Location
                    </button>
                    <button className={`filter-menu-trigger ${filterPanel === 'time' ? 'active' : ''}`} onClick={() => dispatch(setFilterPanel(filterPanel === 'time' ? null : 'time'))}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Date
                    </button>
                    <button className={`filter-menu-trigger ${filterPanel === 'recurring' ? 'active' : ''}`} onClick={() => dispatch(setFilterPanel(filterPanel === 'recurring' ? null : 'recurring'))}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                      Recurring
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="event-list">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  {searchQuery ? (
                    <p>No results for &ldquo;{searchQuery}&rdquo;.</p>
                  ) : (
                    <>
                      <p>No dig days in this area. <Link to="/events/create">Create one</Link>!</p>
                    </>
                  )}
                </div>
              ) : (
                sorted.map((event) => (
                  <EventCard event={event} key={event.id} center={viewCenter} />
                ))
              )}
            </div>
          </>
        )}
        </>)}
      </div>
    </>
  );
};

export default MapPage;
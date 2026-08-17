import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { collapseRecurring, expandRecurring } from '../../utils/recurrence';
import { setSelectedDay, setShowRecurring, setSearchRadius, setSearchCenter } from '../events/eventsSlice';
import { haversine } from './mapUtils';
import SearchRadiusMap from '../calendar/SearchRadiusMap';
import type { DigEvent } from '../../types';

const DEFAULT_CENTER: [number, number] = [39.7392, -104.9903];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];
const US_STATE_COORDS: Record<string, [number, number]> = {
  'Alabama': [32.806671,-86.791130],'Alaska': [61.370716,-152.404419],'Arizona': [33.729759,-111.431221],
  'Arkansas': [34.969704,-92.373123],'California': [36.116203,-119.681564],'Colorado': [39.059811,-105.311104],
  'Connecticut': [41.597782,-72.755371],'Delaware': [39.318523,-75.507141],'Florida': [27.766279,-81.686783],
  'Georgia': [33.040619,-83.643074],'Hawaii': [21.094318,-157.498337],'Idaho': [44.240459,-114.478828],
  'Illinois': [40.349457,-88.986137],'Indiana': [39.849426,-86.258278],'Iowa': [42.011539,-93.210526],
  'Kansas': [38.526600,-96.726486],'Kentucky': [37.668140,-84.670067],'Louisiana': [31.169546,-91.867805],
  'Maine': [44.693947,-69.381927],'Maryland': [39.063946,-76.802101],'Massachusetts': [42.230171,-71.530106],
  'Michigan': [43.326618,-84.536095],'Minnesota': [45.694454,-93.900192],'Mississippi': [32.741646,-89.678696],
  'Missouri': [38.456085,-92.288368],'Montana': [46.921925,-110.454353],'Nebraska': [41.125370,-98.268082],
  'Nevada': [38.313515,-117.055374],'New Hampshire': [43.452492,-71.563896],'New Jersey': [40.298904,-74.521011],
  'New Mexico': [34.840515,-106.248482],'New York': [42.165726,-74.948051],'North Carolina': [35.630066,-79.806419],
  'North Dakota': [47.528912,-99.784012],'Ohio': [40.388783,-82.764915],'Oklahoma': [35.565342,-96.928917],
  'Oregon': [43.804133,-120.554201],'Pennsylvania': [40.590752,-77.209755],'Rhode Island': [41.680893,-71.511780],
  'South Carolina': [33.856892,-80.945007],'South Dakota': [44.299782,-99.438828],'Tennessee': [35.747845,-86.692345],
  'Texas': [31.054487,-97.563461],'Utah': [40.150032,-111.862434],'Vermont': [44.045876,-72.710686],
  'Virginia': [37.769337,-78.169968],'Washington': [47.400902,-121.490494],'West Virginia': [38.491226,-80.954453],
  'Wisconsin': [44.268543,-89.616508],'Wyoming': [42.755966,-107.302490],
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const FilterCalendar: React.FC<{ expanded: any[]; mapBounds: any; selectedDay: string | null; onSelectDay: (d: string | null) => void }> = ({ expanded, mapBounds, selectedDay, onSelectDay }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventMap = useMemo(() => {
    const filtered = mapBounds
      ? expanded.filter((e: any) => {
          const [lat, lng] = e.coordinates;
          const [[south, west], [north, east]] = mapBounds;
          return lat >= south && lat <= north && lng >= west && lng <= east;
        })
      : expanded;
    const map = new Map<string, number>();
    for (const e of filtered) {
      map.set((e.date as string).slice(0, 10), (map.get((e.date as string).slice(0, 10)) || 0) + 1);
    }
    return map;
  }, [expanded, mapBounds]);

  const cells: { day: number; count: number }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, count: 0 });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, count: eventMap.get(dateStr) || 0 });
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, count: 0 });

  return (
    <div>
      <div className="calendar-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(year, month - 1, 1))}>←</button>
        <strong>{MONTHS[month]} {year}</strong>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(year, month + 1, 1))}>→</button>
      </div>
      <div className="calendar-grid">
        {DAYS.map((d) => (<div key={d} className="cal-day-header">{d}</div>))}
        {cells.map((cell, i) => {
          const dateStr = cell.day > 0 ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}` : '';
          const isToday = cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div key={i}
              className={`cal-cell ${cell.day === 0 ? 'cal-empty' : ''} ${cell.count > 0 ? 'cal-has-events' : ''} ${isToday ? 'cal-today' : ''} ${dateStr === selectedDay ? 'cal-selected' : ''}`}
              onClick={() => { if (cell.day > 0) onSelectDay(dateStr === selectedDay ? null : dateStr); }}
            >
              {cell.day > 0 && <span className="cal-day-num">{cell.day}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

  const searchRadius = useAppSelector((s) => s.events.searchRadius);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const [locTab, setLocTab] = useState<'country' | 'nearme'>('nearme');
  const [selectedState, setSelectedState] = useState('');
  const [radiusInput, setRadiusInput] = useState(() => String(searchRadius));
  const [pendingCenter, setPendingCenter] = useState<[number, number] | null>(null);

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
                    {/* Location */}
                    <div className="filter-menu-section">
                      <div className="filter-menu-section-label">Location</div>
                      <div className="search-tabs">
                        <button className={`search-tab ${locTab === 'country' ? 'active' : ''}`} onClick={() => setLocTab('country')}>Country</button>
                        <button className={`search-tab ${locTab === 'nearme' ? 'active' : ''}`} onClick={() => setLocTab('nearme')}>Near Me</button>
                      </div>
                      {locTab === 'country' ? (
                        <div>
                          <select className="search-select" disabled>
                            <option>United States</option>
                          </select>
                          <select className="search-select" value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                            <option value="">Select a state...</option>
                            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="btn btn-search" disabled={!selectedState} onClick={() => {
                            if (selectedState && US_STATE_COORDS[selectedState]) {
                              dispatch(setSearchCenter(US_STATE_COORDS[selectedState]));
                              dispatch(setSearchRadius(100));
                            }
                          }}>Search</button>
                        </div>
                      ) : (
                        <div>
                          <div className="radius-control">
                            <label>Search radius: <strong>{radiusInput} mi</strong></label>
                            <input type="range" min={5} max={100} value={radiusInput} onChange={(e) => setRadiusInput(e.target.value)} />
                          </div>
                          <SearchRadiusMap center={pendingCenter || searchCenter || DEFAULT_CENTER} radius={parseFloat(radiusInput) || 10} onCenterChange={setPendingCenter} onLocate={(c) => { setPendingCenter(c); }} />
                          <button className="btn btn-search" disabled={!pendingCenter && parseFloat(radiusInput) === searchRadius} onClick={() => {
                            const c = pendingCenter || searchCenter || DEFAULT_CENTER;
                            dispatch(setSearchCenter(c));
                            dispatch(setSearchRadius(parseFloat(radiusInput) || 10));
                            if (pendingCenter) setPendingCenter(null);
                          }}>Search</button>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="filter-menu-section">
                      <div className="filter-menu-section-label">Date</div>
                      <FilterCalendar expanded={expanded} mapBounds={mapBounds} selectedDay={selectedDay} onSelectDay={(d) => dispatch(setSelectedDay(d))} />
                    </div>

                    {/* Other */}
                    <div className="filter-menu-section">
                      <div className="filter-menu-section-label">Other</div>
                      <label className="filter-menu-item">
                        <input type="checkbox" checked={showRecurring} onChange={(e) => dispatch(setShowRecurring(e.target.checked))} />
                        <span>Recurring only</span>
                      </label>
                    </div>
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
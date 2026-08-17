import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setSearchRadius, setSearchCenter, setSelectedDay, setShowRecurring, setFilterPanel } from '../features/events/eventsSlice';
import SearchRadiusMap from '../features/calendar/SearchRadiusMap';
import { expandRecurring } from '../utils/recurrence';

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

const DEFAULT_CENTER: [number, number] = [39.7392, -104.9903];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const FilterCalendar: React.FC = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.events.items);
  const mapBounds = useAppSelector((s) => s.events.mapBounds);
  const selectedDay = useAppSelector((s) => s.events.selectedDay);

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const expanded = React.useMemo(() => expandRecurring(items), [items]);

  const eventMap = React.useMemo(() => {
    const filtered = mapBounds
      ? expanded.filter((e: any) => {
          const [lat, lng] = e.coordinates;
          const [[south, west], [north, east]] = mapBounds;
          return lat >= south && lat <= north && lng >= west && lng <= east;
        })
      : expanded;
    const map = new Map<string, number>();
    for (const e of filtered) {
      const key = (e.date as string).slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
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

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleDayClick = (day: number) => {
    if (day === 0) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dispatch(setSelectedDay(selectedDay === dateStr ? null : dateStr));
  };

  return (
    <div className="filter-panel filter-panel--time">
      <div className="calendar-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(year, month - 1, 1))}>←</button>
        <strong>{MONTHS[month]} {year}</strong>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(year, month + 1, 1))}>→</button>
      </div>
      <div className="calendar-grid">
        {DAYS.map((d) => (<div key={d} className="cal-day-header">{d}</div>))}
        {cells.map((cell, i) => {
          const dateStr = cell.day > 0
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
            : '';
          return (
            <div key={i}
              className={`cal-cell ${cell.day === 0 ? 'cal-empty' : ''} ${cell.count > 0 ? 'cal-has-events' : ''} ${isToday(cell.day) ? 'cal-today' : ''} ${dateStr === selectedDay ? 'cal-selected' : ''}`}
              onClick={() => handleDayClick(cell.day)}
              title={cell.count > 0 ? `${cell.count} event${cell.count > 1 ? 's' : ''}` : undefined}
            >
              {cell.day > 0 && (
                <>
                  <span className="cal-day-num">{cell.day}</span>
                  {cell.count > 0 && <span className="cal-dot">{cell.count}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Toolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const filterPanel = useAppSelector((s) => s.events.filterPanel);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const searchRadius = useAppSelector((s) => s.events.searchRadius);
  const showRecurring = useAppSelector((s) => s.events.showRecurring);

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const [locTab, setLocTab] = useState<'country' | 'nearme'>('nearme');
  const [selectedState, setSelectedState] = useState('');
  const [radiusInput, setRadiusInput] = useState(() => String(searchRadius));
  const [pendingCenter, setPendingCenter] = useState<[number, number] | null>(null);

  const center = (() => {
    if (searchCenter) return searchCenter;
    try {
      const raw = localStorage.getItem('trail-dig-location');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed as [number, number];
      }
    } catch {}
    return DEFAULT_CENTER;
  })();

  const closePanel = () => dispatch(setFilterPanel(null));

  // Close filter menu on click outside
  useEffect(() => {
    if (!showFilterMenu) return;
    const handler = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilterMenu]);

  return (
    <>
      {filterPanel && <div className="filter-backdrop" onClick={closePanel} />}

      <div className="map-toolbar">
        <div className="toolbar-filter-wrap" ref={filterMenuRef}>
          <button
            className={`toolbar-filter-btn${showFilterMenu ? ' active' : ''}`}
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            aria-label="Toggle filter menu"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          {showFilterMenu && (
            <div className="toolbar-filter-menu">
              <button className={`filter-menu-trigger ${filterPanel === 'location' ? 'active' : ''}`} onClick={() => { dispatch(setFilterPanel(filterPanel === 'location' ? null : 'location')); setShowFilterMenu(false); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Location
              </button>
              <button className={`filter-menu-trigger ${filterPanel === 'time' ? 'active' : ''}`} onClick={() => { dispatch(setFilterPanel(filterPanel === 'time' ? null : 'time')); setShowFilterMenu(false); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Date
              </button>
              <button className={`filter-menu-trigger ${filterPanel === 'recurring' ? 'active' : ''}`} onClick={() => { dispatch(setFilterPanel(filterPanel === 'recurring' ? null : 'recurring')); setShowFilterMenu(false); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                Recurring
              </button>
            </div>
          )}
        </div>
      </div>

      {filterPanel === 'location' && (
        <div className="filter-panel filter-panel--location">
          <div className="search-tabs">
            <button className={`search-tab ${locTab === 'country' ? 'active' : ''}`} onClick={() => setLocTab('country')}>Country</button>
            <button className={`search-tab ${locTab === 'nearme' ? 'active' : ''}`} onClick={() => setLocTab('nearme')}>Near Me</button>
          </div>
          {locTab === 'country' ? (
            <div className="search-country">
              <select className="search-select" disabled>
                <option>United States</option>
              </select>
              <select className="search-select" value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                <option value="">Select a state...</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ) : (
            <div className="search-nearme">
              <div className="radius-control">
                <label>Search radius: <strong>{radiusInput} mi</strong></label>
                <input type="range" min={5} max={100} value={radiusInput} onChange={(e) => setRadiusInput(e.target.value)} />
              </div>
              <SearchRadiusMap center={pendingCenter || searchCenter || DEFAULT_CENTER} radius={parseFloat(radiusInput) || 10} onCenterChange={setPendingCenter} onLocate={(c) => { setPendingCenter(c); }} />
            </div>
          )}
          <button className="btn btn-search" aria-label="Apply location filter" disabled={locTab === 'country' ? !selectedState : !pendingCenter && parseFloat(radiusInput) === searchRadius} onClick={() => {
              if (locTab === 'country') {
                if (selectedState && US_STATE_COORDS[selectedState]) {
                  dispatch(setSearchCenter(US_STATE_COORDS[selectedState]));
                  dispatch(setSearchRadius(100));
                }
              } else {
                const c = pendingCenter || searchCenter || center;
                dispatch(setSearchCenter(c));
                dispatch(setSearchRadius(parseFloat(radiusInput) || 10));
                if (pendingCenter) setPendingCenter(null);
              }
              closePanel();
            }}>Search</button>
          </div>
        )}

        {filterPanel === 'time' && (
          <FilterCalendar />
        )}

        {filterPanel === 'recurring' && (
          <div className="filter-panel filter-panel--recurring">
            <label className="recurring-toggle">
              <input type="checkbox" checked={showRecurring} onChange={() => dispatch(setShowRecurring(!showRecurring))} aria-label="Show recurring only" />
              Show recurring only
            </label>
          </div>
        )}
    </>
  );
};

export default Toolbar;
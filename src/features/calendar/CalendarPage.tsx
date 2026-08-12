import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { setSearchRadius, setSearchCenter } from '../../features/events/eventsSlice';
import { expandRecurring } from '../../utils/recurrence';
import { haversine } from '../../features/map/mapUtils';
import SearchRadiusMap from './SearchRadiusMap';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const US_STATE_COORDS: Record<string, [number, number]> = {
  'Alabama': [32.806671, -86.791130],
  'Alaska': [61.370716, -152.404419],
  'Arizona': [33.729759, -111.431221],
  'Arkansas': [34.969704, -92.373123],
  'California': [36.116203, -119.681564],
  'Colorado': [39.059811, -105.311104],
  'Connecticut': [41.597782, -72.755371],
  'Delaware': [39.318523, -75.507141],
  'Florida': [27.766279, -81.686783],
  'Georgia': [33.040619, -83.643074],
  'Hawaii': [21.094318, -157.498337],
  'Idaho': [44.240459, -114.478828],
  'Illinois': [40.349457, -88.986137],
  'Indiana': [39.849426, -86.258278],
  'Iowa': [42.011539, -93.210526],
  'Kansas': [38.526600, -96.726486],
  'Kentucky': [37.668140, -84.670067],
  'Louisiana': [31.169546, -91.867805],
  'Maine': [44.693947, -69.381927],
  'Maryland': [39.063946, -76.802101],
  'Massachusetts': [42.230171, -71.530106],
  'Michigan': [43.326618, -84.536095],
  'Minnesota': [45.694454, -93.900192],
  'Mississippi': [32.741646, -89.678696],
  'Missouri': [38.456085, -92.288368],
  'Montana': [46.921925, -110.454353],
  'Nebraska': [41.125370, -98.268082],
  'Nevada': [38.313515, -117.055374],
  'New Hampshire': [43.452492, -71.563896],
  'New Jersey': [40.298904, -74.521011],
  'New Mexico': [34.840515, -106.248482],
  'New York': [42.165726, -74.948051],
  'North Carolina': [35.630066, -79.806419],
  'North Dakota': [47.528912, -99.784012],
  'Ohio': [40.388783, -82.764915],
  'Oklahoma': [35.565342, -96.928917],
  'Oregon': [44.572021, -122.070938],
  'Pennsylvania': [40.590752, -77.209755],
  'Rhode Island': [41.680893, -71.511780],
  'South Carolina': [33.856892, -80.945007],
  'South Dakota': [44.299782, -99.438828],
  'Tennessee': [35.747845, -86.692345],
  'Texas': [31.054487, -97.563461],
  'Utah': [40.150032, -111.862434],
  'Vermont': [44.045876, -72.710686],
  'Virginia': [37.769337, -78.169968],
  'Washington': [47.400902, -121.490494],
  'West Virginia': [38.491226, -80.954456],
  'Wisconsin': [44.268543, -89.616508],
  'Wyoming': [42.755966, -107.302490],
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const events = useAppSelector((s) => s.events.items);
  const expanded = useMemo(() => expandRecurring(events), [events]);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [radiusInput, setRadiusInput] = useState('10');
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [calendarCollapsed, setCalendarCollapsed] = useState(true);
  const [searchTab, setSearchTab] = useState<'country' | 'nearme'>('country');
  const [selectedState, setSelectedState] = useState('');
  const [pendingCenter, setPendingCenter] = useState<[number, number] | null>(null);
  const widthRef = useRef(380);
  const SIDEBAR_MIN = 240;
  const SIDEBAR_MAX = 600;

  // When a state is selected from Country tab, update pending center
  useEffect(() => {
    if (selectedState && US_STATE_COORDS[selectedState]) {
      setPendingCenter(US_STATE_COORDS[selectedState]);
    }
  }, [selectedState]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widthRef.current;
    const onMove = (me: MouseEvent) => {
      const newW = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startW + (me.clientX - startX)));
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

  const nearMin = sidebarWidth <= SIDEBAR_MIN + 20;
  const nearMax = sidebarWidth >= SIDEBAR_MAX - 20;

  const center = searchCenter || [39.7392, -104.9903];
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const filtered = useMemo(() => {
    const radius = parseFloat(radiusInput) || 100;
    if (radius >= 100) return expanded;
    return expanded.filter((e) => haversine(center, e.coordinates) <= radius);
  }, [expanded, radiusInput, center]);

  const eventMap = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [filtered]);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRadiusInput(val);
    dispatch(setSearchRadius(parseFloat(val) || 10));
  };

  const prevMonth = () => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); };

  const cells: { day: number; events: typeof filtered }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, events: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, events: eventMap.get(dateStr) || [] });
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, events: [] });

  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <>
      <div className={`map-sidebar ${nearMin ? 'at-min' : ''} ${nearMax ? 'at-max' : ''}`} style={{ width: sidebarWidth }}>

              <div className="search-controls">
          <div className="search-tabs">
            <button className={`search-tab ${searchTab === 'country' ? 'active' : ''}`} onClick={() => setSearchTab('country')}>Country</button>
            <button className={`search-tab ${searchTab === 'nearme' ? 'active' : ''}`} onClick={() => setSearchTab('nearme')}>Near Me</button>
          </div>
          {searchTab === 'country' ? (
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
                <input type="range" min={5} max={100} value={radiusInput} onChange={handleRadiusChange} />
              </div>
              <SearchRadiusMap center={pendingCenter || searchCenter || [39.7392, -104.9903]} radius={parseFloat(radiusInput) || 10} onCenterChange={setPendingCenter} />
            </div>
          )}
          <button className="btn btn-search" onClick={() => {
            if (searchTab === 'country') {
              if (selectedState && US_STATE_COORDS[selectedState]) {
                dispatch(setSearchCenter(US_STATE_COORDS[selectedState]));
                dispatch(setSearchRadius(100));
              }
            } else if (pendingCenter) {
              dispatch(setSearchCenter(pendingCenter));
            }
          }}>Search</button>
        </div>

        <button className="cal-collapse-btn" style={{ margin: '4px 0' }} onClick={() => setCalendarCollapsed(!calendarCollapsed)}>
          {calendarCollapsed ? '▶' : '▼'} Calendar
        </button>
        <div className="calendar-grid-wrap" style={{ display: calendarCollapsed ? 'none' : '' }}>
          <div className="calendar-nav">
            <button className="btn btn-ghost btn-sm" onClick={prevMonth} disabled={calendarCollapsed}><span className="nav-arrow">←</span></button>
            <strong>{MONTHS[month]} {year}</strong>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth} disabled={calendarCollapsed}>→</button>
          </div>
          {!calendarCollapsed && <div className="calendar-grid">
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
          </div>}
        </div>

        <hr className="calendar-separator" />

        <div className="calendar-list">
          {selectedDay ? (
            <>
              <h2><button className="btn btn-ghost btn-sm cal-back" onClick={() => setSelectedDay(null)}><span className="nav-arrow">←</span></button> Events on {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
              {(() => {
                const dayEvents = eventMap.get(selectedDay) || [];
                return dayEvents.length === 0 ? (
                  <p className="muted">No events on this day.</p>
                ) : (
                  <ul className="calendar-event-list">
                    {dayEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((e) => (
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
            </>
          ) : (
            <>
              <h2>Events in {MONTHS[month]} {year}</h2>
              {filtered.filter((e) => e.date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`).length === 0 ? (
                <p className="muted">No events this month.</p>
              ) : (
                <ul className="calendar-event-list">
                  {[...filtered]
                    .filter((e) => e.date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`)
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
              )}
            </>
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

export default CalendarPage;
import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { setSearchRadius, setSearchCenter } from '../../features/events/eventsSlice';
import { expandRecurring } from '../../utils/recurrence';
import { haversine } from '../../features/map/mapUtils';

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
  const [radiusInput, setRadiusInput] = useState('25');
  const [addressQuery, setAddressQuery] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [calendarCollapsed, setCalendarCollapsed] = useState(true);
  const widthRef = useRef(380);
  const SIDEBAR_MIN = 240;
  const SIDEBAR_MAX = 600;

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
    const radius = parseFloat(radiusInput) || 250;
    if (radius >= 250) return expanded;
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

  const handleAddressSearch = async (q: string) => {
    if (!q.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        dispatch(setSearchCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]));
      }
    } catch {}
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRadiusInput(val);
    dispatch(setSearchRadius(parseFloat(val) || 50));
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
          <div className="radius-control">
            <label>Search radius: <strong>{radiusInput} mi</strong></label>
            <input type="range" min={5} max={250} value={radiusInput} onChange={handleRadiusChange} />
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
            <button className="btn btn-ghost btn-sm" onClick={prevMonth} disabled={calendarCollapsed}><span className="nav-arrow">←</span></button>
            <strong>{MONTHS[month]} {year}</strong>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth} disabled={calendarCollapsed}>→</button>
            <button className="cal-collapse-btn" onClick={() => setCalendarCollapsed(!calendarCollapsed)}>
              {calendarCollapsed ? '▶' : '▼'} Calendar
            </button>
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
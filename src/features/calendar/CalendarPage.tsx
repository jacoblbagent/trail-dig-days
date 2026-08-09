import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { setSearchRadius, setSearchCenter } from '../events/eventsSlice';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const haversine = (c1: [number, number], c2: [number, number]): number => {
  const R = 3958.8;
  const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
  const dLng = ((c2[1] - c1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((c1[0] * Math.PI) / 180) *
      Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const LocateButton: React.FC<{ userLocation: [number, number] | null }> = ({ userLocation }) => {
  const map = useMap();
  return (
    <button
      className="map-locate-btn"
      onClick={() => userLocation && map.flyTo(userLocation, 12, { duration: 1 })}
      title="Center on your location"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
    </button>
  );
};

const CalendarPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const events = useAppSelector((s) => s.events.items);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const navigate = useNavigate();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modalDay, setModalDay] = useState<{ date: string; label: string } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radiusInput, setRadiusInput] = useState('25');
  const [addressQuery, setAddressQuery] = useState('');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          if (!searchCenter) dispatch(setSearchCenter(loc));
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const center = searchCenter || userLocation || [39.7392, -104.9903];
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Filter events by distance
  const filtered = useMemo(() => {
    const radius = parseFloat(radiusInput) || 250;
    if (radius >= 250) return events;
    return events.filter((e) => haversine(center, e.coordinates) <= radius);
  }, [events, radiusInput, center]);

  // Group filtered events by date
  const eventMap = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [filtered]);

  // Events in the current month, newest first
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = useMemo(() => {
    return [...filtered]
      .filter((e) => e.date.slice(0, 7) === monthStr)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filtered, monthStr]);

  const handleAddressSearch = async (q: string) => {
    if (!q.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const loc: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        dispatch(setSearchCenter(loc));
      }
    } catch {
      // silently fail
    }
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRadiusInput(val);
    dispatch(setSearchRadius(parseFloat(val) || 50));
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Calendar cells
  const cells: { day: number; events: typeof filtered }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, events: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, events: eventMap.get(dateStr) || [] });
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, events: [] });

  const isToday = (d: number) => {
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <Link to="/" className="btn btn-ghost btn-sm">← Map</Link>
        <h1>Calendar</h1>
      </div>

      <div className="search-controls">
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
      </div>

      <div className="calendar-layout">
        <div className="calendar-layout-top">
          <div className="calendar-grid-wrap">
            <div className="calendar-nav">
              <button className="btn btn-ghost btn-sm" onClick={prevMonth}>←</button>
              <strong>{MONTHS[month]} {year}</strong>
              <button className="btn btn-ghost btn-sm" onClick={nextMonth}>→</button>
            </div>
            <div className="calendar-grid">
              {DAYS.map((d) => (
                <div key={d} className="cal-day-header">{d}</div>
              ))}
              {cells.map((cell, i) => {
                const dateStr = cell.day
                  ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
                  : '';
                return (
                  <div
                    key={i}
                    className={`cal-cell ${cell.day === 0 ? 'cal-empty' : ''} ${cell.events.length > 0 ? 'cal-has-events' : ''} ${isToday(cell.day) ? 'cal-today' : ''}`}
                    onClick={() => {
                      if (cell.events.length > 0) {
                        setModalDay({
                          date: dateStr,
                          label: `${MONTHS[month]} ${cell.day}, ${year}`,
                        });
                      }
                    }}
                    title={cell.events.length > 0 ? `${cell.events.length} event${cell.events.length > 1 ? 's' : ''}` : undefined}
                  >
                    {cell.day > 0 && (
                      <>
                        <span className="cal-day-num">{cell.day}</span>
                        {cell.events.length > 0 && (
                          <span className="cal-dot">{cell.events.length}</span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="calendar-map">
            <MapContainer
              center={center}
              zoom={8}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map((e) => (
                <Marker key={e.id} position={e.coordinates}>
                  <Popup>
                    <strong>{e.title}</strong><br />
                    {e.date} · {e.locationName}
                  </Popup>
                </Marker>
              ))}
              <Circle
                center={center}
                radius={parseFloat(radiusInput || '25') * 1609.34}
                pathOptions={{ color: '#2d6a4f', fillOpacity: 0.08, weight: 2 }}
              />
              <LocateButton userLocation={userLocation} />
            </MapContainer>
          </div>
        </div>

        <div className="calendar-list">
          <h2>Events in {MONTHS[month]} {year}</h2>
          {monthEvents.length === 0 ? (
            <p className="muted">No events this month.</p>
          ) : (
            <ul className="calendar-event-list">
              {monthEvents.map((e) => (
                <li key={e.id} className="calendar-event-item">
                  <Link to={`/events/${e.id}`} className="calendar-event-link">
                    <span className="cal-event-date">{e.date}</span>
                    <span className="cal-event-title">{e.title}</span>
                    <span className="cal-event-location">{e.locationName}</span>
                    <span className="cal-event-time">{e.startTime}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Day-event modal */}
      {modalDay && (
        <div className="cal-modal-overlay" onClick={() => setModalDay(null)}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h3>{modalDay.label}</h3>
              <button className="cal-modal-close" onClick={() => setModalDay(null)}>×</button>
            </div>
            {(() => {
              const dayEvents = eventMap.get(modalDay.date) || [];
              return dayEvents.length === 0 ? (
                <p className="muted">No events on this day.</p>
              ) : (
                <ul className="cal-modal-list">
                  {dayEvents.map((e) => (
                    <li key={e.id} className="cal-modal-item" onClick={() => { setModalDay(null); navigate(`/events/${e.id}`); }}>
                      <span className="cal-modal-item-title">{e.title}</span>
                      <span className="cal-modal-item-meta">{e.startTime} · {e.locationName}</span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
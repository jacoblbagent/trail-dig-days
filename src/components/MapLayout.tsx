import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setSearchRadius, setSearchCenter, setSelectedDay, setShowRecurring } from '../features/events/eventsSlice';
import { expandRecurring } from '../utils/recurrence';
import MapMoveHandler from '../features/map/MapMoveHandler';
import TileLoadIndicator from '../features/map/TileLoadIndicator';
import PageMarkerContent from '../features/map/PageMarkerContent';
import MapExtras from '../features/map/MapExtras';
import SearchRadiusMap from '../features/calendar/SearchRadiusMap';

const LOCATION_KEY = 'trail-dig-location';

const loadCachedLocation = (): [number, number] | null => {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 2) return parsed as [number, number];
    return null;
  } catch { return null; }
};

const saveLocation = (loc: [number, number]) => {
  try { localStorage.setItem(LOCATION_KEY, JSON.stringify(loc)); } catch {}
};

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

const MapCenterUpdater: React.FC<{ loc: [number, number] | null }> = ({ loc }) => {
  const map = useMap();
  const prevRef = React.useRef(loc);

  useEffect(() => {
    if (!loc) return;
    const prev = prevRef.current;
    prevRef.current = loc;
    if (prev && prev[0] === loc[0] && prev[1] === loc[1]) return;
    map.flyTo(loc, map.getZoom(), { duration: 1.2 });
  }, [loc, map]);

  return null;
};

const MapRefSetter: React.FC<{ mapRef: React.MutableRefObject<L.Map | null> }> = ({ mapRef }) => {
  const map = useMap();
  mapRef.current = map;
  return null;
};

const MapResizeWatcher: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => { map.invalidateSize(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
};

const PanelPopupCloser: React.FC<{ showPanel: string | null }> = ({ showPanel }) => {
  const map = useMap();
  const prevRef = React.useRef(showPanel);
  useEffect(() => {
    if (prevRef.current !== showPanel) {
      prevRef.current = showPanel;
      map.closePopup();
    }
  }, [showPanel, map]);
  return null;
};

const FilterCalendar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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

  const expanded = useMemo(() => expandRecurring(items), [items]);

  const eventMap = useMemo(() => {
    const filtered = mapBounds
      ? expanded.filter((e) => {
          const [lat, lng] = e.coordinates;
          const [[south, west], [north, east]] = mapBounds;
          return lat >= south && lat <= north && lng >= west && lng <= east;
        })
      : expanded;
    const map = new Map<string, number>();
    for (const e of filtered) {
      const key = e.date.slice(0, 10);
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
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
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

const MapLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.events.theme);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const searchRadius = useAppSelector((s) => s.events.searchRadius);
  const mapZoom = useAppSelector((s) => s.events.mapZoom);
  const [showPanel, setShowPanel] = useState<'location' | 'time' | 'recurring' | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  // Locate / re-detect state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const initRef = useRef(false);

  // On mount: restore cached location, then detect fresh
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const cached = loadCachedLocation();
    if (cached && !searchCenter) {
      setUserLocation(cached);
      dispatch(setSearchCenter(cached));
    }

    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        saveLocation(loc);
        dispatch(setSearchCenter(loc));
      },
      () => {}
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRedetect = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        saveLocation(loc);
        dispatch(setSearchCenter(loc));
        setIsDetecting(false);
      },
      () => { setIsDetecting(false); }
    );
  }, [dispatch]);

  const handleLocateClick = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo(userLocation, 12, { duration: 1 });
    } else {
      handleRedetect();
    }
  };

  // Location panel local state
  const [locTab, setLocTab] = useState<'country' | 'nearme'>('nearme');
  const [selectedState, setSelectedState] = useState('');
  const [radiusInput, setRadiusInput] = useState(() => String(searchRadius));
  const [pendingCenter, setPendingCenter] = useState<[number, number] | null>(null);

  // Recurring panel state
  const showRecurring = useAppSelector((s) => s.events.showRecurring);

  const togglePanel = (name: 'location' | 'time' | 'recurring') => {
    setShowPanel((prev) => (prev === name ? null : name));
  };

  const center = (() => {
    if (searchCenter) return searchCenter;
    try {
      const raw = localStorage.getItem('trail-dig-location');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed as [number, number];
      }
    } catch {}
    return [39.7392, -104.9903] as [number, number];
  })();

  return (
    <div className="map-page">
      <Outlet />
      <div className="map-toolbar">
        <button className={`toolbar-btn${showPanel === 'location' ? ' active' : ''}`} onClick={() => togglePanel('location')}>Location</button>
        <button className={`toolbar-btn${showPanel === 'time' ? ' active' : ''}`} onClick={() => togglePanel('time')}>Date</button>
        <button className={`toolbar-btn${showPanel === 'recurring' ? ' active' : ''}`} onClick={() => togglePanel('recurring')}>Is Recurring</button>
      </div>

      <div className="map-actions">
        <button
          className="map-locate-btn"
          onClick={handleLocateClick}
          disabled={isDetecting}
          title="Find my location"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
        {userLocation && (
          <button className="map-redetect-btn" onClick={handleRedetect} disabled={isDetecting}>
            {isDetecting ? 'Detecting…' : 'Re-detect'}
          </button>
        )}
      </div>

      <div className="map-container" style={{ order: 1 }}>
        <MapContainer center={center} zoom={mapZoom} style={{ width: '100%', height: '100%' }} maxBounds={[[24, -125], [50, -66]]} maxBoundsViscosity={1}>
          <TileLayer
            key={theme}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={theme === 'dark'
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            }
          />
          <MapMoveHandler />
          <MapRefSetter mapRef={mapRef} />
          <MapResizeWatcher />
          <PanelPopupCloser showPanel={showPanel} />
          <MapCenterUpdater loc={searchCenter} />
          <TileLoadIndicator />
          <PageMarkerContent />
          <MapExtras />
          {userLocation && (
            <CircleMarker
              center={userLocation}
              radius={7}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#3b82f6', fillOpacity: 1, className: 'user-location-dot' }}
            />
          )}
        </MapContainer>
      </div>

      {showPanel && <div className="filter-backdrop" onClick={() => setShowPanel(null)} />}

      {showPanel === 'location' && (
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
          <button className="btn btn-search" disabled={locTab === 'country' ? !selectedState : !pendingCenter && parseFloat(radiusInput) === searchRadius} onClick={() => {
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
            }}>Search</button>
          </div>
        )}

        {showPanel === 'time' && (
          <FilterCalendar onClose={() => setShowPanel(null)} />
        )}

        {showPanel === 'recurring' && (
          <div className="filter-panel filter-panel--recurring">
            <label className="recurring-toggle">
              <input type="checkbox" checked={showRecurring} onChange={() => dispatch(setShowRecurring(!showRecurring))} />
              Show recurring only
            </label>
          </div>
        )}
    </div>
  );
};

export default MapLayout;
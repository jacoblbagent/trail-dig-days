import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setSearchRadius, setSearchCenter } from '../events/eventsSlice';
import type { DigEvent } from '../../types';

// Fix Leaflet icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const haversine = (c1: [number, number], c2: [number, number]): number => {
  const R = 3958.8; // miles
  const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
  const dLng = ((c2[1] - c1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((c1[0] * Math.PI) / 180) *
      Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Component that fits bounds to visible events
const FitBounds: React.FC<{ events: DigEvent[] }> = ({ events }) => {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (events.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(events.map((e) => e.coordinates));
      map.fitBounds(bounds, { padding: [50, 50] });
      fitted.current = true;
    }
  }, [events, map]);
  return null;
};

// Floating locate button on the map
const LocateButton: React.FC<{ userLocation: [number, number] | null }> = ({ userLocation }) => {
  const map = useMap();
  return (
    <div className="map-locate-btn" onClick={() => userLocation && map.flyTo(userLocation, 12, { duration: 1 })}>
      
    </div>
  );
};

const DIFF_ICONS: Record<string, string> = {
  easy: 'Easy', moderate: 'Moderate', challenging: 'Challenging', expert: 'Expert',
};

const MapPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { items, searchCenter } = useAppSelector((s) => s.events);
  const { profiles } = useAppSelector((s) => s.profile);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locError, setLocError] = useState('');
  const [radiusInput, setRadiusInput] = useState('250');
  const [sidebarWidth, setSidebarWidth] = useState(380);
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

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const center: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(center);
          dispatch(setSearchCenter(center));
        },
        () => setLocError('Location access denied — showing all events'),
        { enableHighAccuracy: true }
      );
    } else {
      setLocError('Geolocation not available');
    }
  }, [user, navigate, dispatch]);

  const center = searchCenter || userLocation || [39.7392, -104.9903]; // Denver fallback

  // Filter events by distance
  const filtered = useMemo(() => {
    if (!searchCenter && !userLocation) return items;
    const c = searchCenter || userLocation!;
    return items.filter((e) => haversine(c, e.coordinates) <= parseFloat(radiusInput || '50'));
  }, [items, searchCenter, userLocation, radiusInput]);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRadiusInput(val);
    dispatch(setSearchRadius(parseFloat(val) || 50));
  };

  return (
    <div className="map-page">
      <div className={`map-sidebar ${nearMin ? 'at-min' : ''} ${nearMax ? 'at-max' : ''}`} style={{ width: sidebarWidth }}>
        <div className="map-sidebar-header">
          <h1>Dig Days</h1>
          <Link to="/events/create" className="btn btn-primary btn-sm">+ New Dig Day</Link>
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
          {locError && <p className="loc-error">{locError}</p>}
        </div>

        <div className="event-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No dig days found within {radiusInput} miles.</p>
              <p>Try expanding your radius or <Link to="/events/create">create one</Link>!</p>
            </div>
          ) : (
            filtered.map((event) => {
              const creator = profiles[event.creatorId];
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
                      <span className={`status-dot status-${event.status}`} />
                    </div>
                    <p className="list-card-trail">
                      {DIFF_ICONS[event.difficulty]} {event.trailName}
                    </p>
                    <p className="list-card-date">
                       {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })} · {event.startTime}
                    </p>
                    <p className="list-card-location"> {event.locationName}</p>
                    <div className="list-card-meta">
                      <span>{event.registeredVolunteers.length}/{event.maxVolunteers} spots</span>
                      {creator && <span className="creator-name">by {creator.displayName}</span>}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="sidebar-resizer" onMouseDown={handleResizeStart}>
        <div className="resizer-grip" />
        <div className="resizer-limits">
          <span className={`limit-indicator ${nearMin ? 'visible' : ''}`}>{SIDEBAR_MIN}px</span>
          <span className={`limit-indicator ${nearMax ? 'visible' : ''}`}>{SIDEBAR_MAX}px</span>
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={center}
          zoom={10}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds events={filtered} />
          <LocateButton userLocation={userLocation} />
          {userLocation && (
            <>
              <Marker position={userLocation}>
                <Popup>Your location</Popup>
              </Marker>
              <Circle
                center={userLocation}
                radius={parseFloat(radiusInput) * 1609.34}
                pathOptions={{ color: '#2d6a4f', fillOpacity: 0.08, weight: 2 }}
              />
            </>
          )}
          {filtered.map((event) => (
            <Marker
              key={event.id}
              position={event.coordinates}
              eventHandlers={{
                click: () => navigate(`/events/${event.id}`),
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{event.title}</strong>
                  <p>{event.trailName}</p>
                  <p>{new Date(event.date).toLocaleDateString()} · {event.startTime}</p>
                  <p>{event.registeredVolunteers.length}/{event.maxVolunteers} spots</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
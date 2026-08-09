import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setSearchCenter } from '../events/eventsSlice';
import { expandRecurring } from '../../utils/recurrence';

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

const LocateButton: React.FC<{ userLocation: [number, number] | null }> = ({ userLocation }) => {
  const map = useMap();
  return (
    <button
      className="map-locate-btn"
      onClick={() => userLocation && map.flyTo(userLocation, 12, { duration: 1 })}
      title="Center on your location"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    </button>
  );
};

const FitBounds: React.FC = () => {
  const location = useLocation();
  const map = useMap();
  const events = useAppSelector((s) => s.events.items);

  const isCalendarPage = location.pathname.startsWith('/calendar');
  const isRecurringPage = location.pathname.startsWith('/events/recurring');

  useEffect(() => {
    if (!isCalendarPage && !isRecurringPage) return;

    let target = events;
    if (isRecurringPage) {
      target = events.filter((e) => e.recurrence && e.recurrence !== 'none');
    }

    const expanded = expandRecurring(target);
    if (expanded.length === 0) return;

    const coords = expanded.map((e) => e.coordinates);
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [events, isCalendarPage, isRecurringPage, map]);

  return null;
};

const MapExtras: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchCenter = useAppSelector((s) => s.events.searchCenter);

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

  return (
    <>
      {userLocation && <LocateButton userLocation={userLocation} />}
      {userLocation && (
        <button className="map-redetect-btn" onClick={handleRedetect} disabled={isDetecting}>
          {isDetecting ? 'Detecting…' : 'Re-detect'}
        </button>
      )}
      <FitBounds />
    </>
  );
};

export default MapExtras;
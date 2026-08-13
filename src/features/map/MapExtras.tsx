import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppSelector } from '../../app/hooks';
import { expandRecurring } from '../../utils/recurrence';

const FitBounds: React.FC = () => {
  const location = useLocation();
  const map = useMap();
  const events = useAppSelector((s) => s.events.items);

  const isCalendarPage = location.pathname.startsWith('/calendar');

  useEffect(() => {
    if (!isCalendarPage) return;

    const expanded = expandRecurring(events);
    if (expanded.length === 0) return;

    const coords = expanded.map((e) => e.coordinates);
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [events, isCalendarPage, map]);

  return null;
};

const MapExtras: React.FC = () => {
  return <FitBounds />;
};

export default MapExtras;

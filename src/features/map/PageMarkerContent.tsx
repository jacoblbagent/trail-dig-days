import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useAppSelector } from '../../app/hooks';
import { expandRecurring } from '../../utils/recurrence';
import { haversine } from './mapUtils';
import type { DigEvent } from '../../types';

const greenIcon = () =>
  new L.DivIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#2d6a4f;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>',
  });

const coloredIcon = (inRange: boolean, highlight: boolean) =>
  new L.DivIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${highlight ? '#d97706' : inRange ? '#2d6a4f' : '#a8a29e'};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`,
  });

const PageMarkerContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const events = useAppSelector((s) => s.events.items);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const hoveredId = useAppSelector((s) => s.events.hoveredMarkerId);

  const isMapPage = location.pathname === '/';
  const isRecurringPage = location.pathname.startsWith('/events/recurring');

  const expanded = useMemo(() => {
    if (isRecurringPage) {
      const recurring = events.filter((e) => e.recurrence && e.recurrence !== 'none');
      return expandRecurring(recurring);
    }
    return expandRecurring(events);
  }, [events, isRecurringPage]);

  const inRangeIds = useMemo(() => {
    if (!isMapPage || !searchCenter) return null;
    const r = 250;
    return new Set(expanded.filter((e) => haversine(searchCenter, e.coordinates) <= r).map((e) => e.id));
  }, [expanded, searchCenter, isMapPage]);

  return (
    <MarkerClusterGroup chunkedLoading spiderfyOnMaxZoom={false} showCoverageOnHover={false} maxClusterRadius={10} disableClusteringAtZoom={4}>
      {expanded.filter((e: DigEvent) => !e.isPrivate).map((e: DigEvent) => {
        const inRange = !inRangeIds || inRangeIds.has(e.id);
        const highlight = hoveredId === e.id;
        return (
          <Marker key={e.id} position={e.coordinates} icon={isMapPage ? coloredIcon(inRange, highlight) : greenIcon()}
            eventHandlers={{ mouseover: (ev) => ev.target.openPopup() }}
          >
            <Popup>
              <div className="map-popup">
                <a href={`/events/${e.id}`} onClick={(ev) => { ev.preventDefault(); navigate(`/events/${e.id}`); }}
                  style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                  <strong>{e.title}</strong>
                </a>
                <p>{new Date(e.date).toLocaleDateString()} · {e.startTime} — {e.locationName}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
};

export default PageMarkerContent;
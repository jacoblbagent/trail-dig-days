import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAppSelector } from '../../app/hooks';
import { expandRecurring } from '../../utils/recurrence';
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
  const navigate = useNavigate();
  const events = useAppSelector((s) => s.events.items);
  const mapBounds = useAppSelector((s) => s.events.mapBounds);
  const hoveredId = useAppSelector((s) => s.events.hoveredMarkerId);

  const isMapPage = true;

  const expanded = useMemo(() => {
    return expandRecurring(events);
  }, [events]);

  const inRangeIds = useMemo(() => {
    if (!isMapPage || !mapBounds) return null;
    const [[south, west], [north, east]] = mapBounds;
    return new Set(
      expanded
        .filter((e) => {
          const [lat, lng] = e.coordinates;
          return lat >= south && lat <= north && lng >= west && lng <= east;
        })
        .map((e) => e.id)
    );
  }, [expanded, mapBounds, isMapPage]);

  return (
    <>
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
    </>
  );
};

export default PageMarkerContent;
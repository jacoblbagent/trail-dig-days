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

const coloredIcon = (inRange: boolean, highlight: boolean, count?: number) => {
  const dot = `<div style="width:14px;height:14px;border-radius:50%;background:${highlight ? '#d97706' : inRange ? '#2d6a4f' : '#a8a29e'};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;
  if (!count || count <= 1) {
    return new L.DivIcon({ className: '', iconSize: [16, 16], iconAnchor: [8, 8], html: dot });
  }
  return new L.DivIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${highlight ? '#d97706' : inRange ? '#2d6a4f' : '#a8a29e'};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;line-height:1">${count}</div>`,
  });
};

/** Keep only one marker per location — the latest event by date */
const dedupeByLocation = (events: DigEvent[]): { event: DigEvent; count: number }[] => {
  const groups = new Map<string, DigEvent[]>();
  for (const e of events) {
    const key = e.coordinates[0].toFixed(5) + ',' + e.coordinates[1].toFixed(5);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  const result: { event: DigEvent; count: number }[] = [];
  for (const group of groups.values()) {
    // Latest event by date (then startTime as tiebreaker)
    group.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
    // Count each recurring series once — multiple instances of the same
    // recurrenceGroupId (expanded by expandRecurring) are a single event on the map
    const counted = new Set<string>();
    let count = 0;
    for (const e of group) {
      const key = e.recurrenceGroupId || e.id;
      if (counted.has(key)) continue;
      counted.add(key);
      count++;
    }
    result.push({ event: group[0], count });
  }
  return result;
};

const PageMarkerContent: React.FC = () => {
  const navigate = useNavigate();
  const events = useAppSelector((s) => s.events.items);
  const mapBounds = useAppSelector((s) => s.events.mapBounds);
  const hoveredId = useAppSelector((s) => s.events.hoveredMarkerId);

  const isMapPage = true;

  const expanded = useMemo(() => {
    return expandRecurring(events);
  }, [events]);

  const markers = useMemo(() => {
    return dedupeByLocation(expanded.filter((e: DigEvent) => !e.isPrivate));
  }, [expanded]);

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
      {markers.map(({ event, count }) => {
        const inRange = !inRangeIds || inRangeIds.has(event.id);
        const highlight = hoveredId === event.id;
        return (
          <Marker key={event.id} position={event.coordinates} icon={isMapPage ? coloredIcon(inRange, highlight, count) : greenIcon()}
            eventHandlers={{ mouseover: (ev) => ev.target.openPopup() }}
          >
            <Popup>
              <div className="map-popup">
                <a href={`/events/${event.id}`} onClick={(ev) => { ev.preventDefault(); navigate(`/events/${event.id}`); }}
                  style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                  <strong>{event.title}</strong>
                </a>
                {count > 1 && <span style={{ display: 'block', fontSize: '.8rem', color: '#6b7280', marginTop: 2 }}>{count} events at this location</span>}
                <p>{new Date(event.date).toLocaleDateString()} · {event.startTime} — {event.locationName}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default PageMarkerContent;
import React, { useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { collapseRecurring } from '../../utils/recurrence';
import type { DigEvent } from '../../types';

const coloredIcon = (inRange: boolean, highlight: boolean, isMyEvent: boolean) => {
  let color: string;
  if (highlight) color = '#d97706';
  else if (isMyEvent) color = '#a8a29e';
  else color = inRange ? '#2d6a4f' : '#a8a29e';
  const dot = `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;
  return new L.DivIcon({ className: '', iconSize: [16, 16], iconAnchor: [8, 8], html: dot });
};

/** Group events by location */
const groupByLocation = (events: DigEvent[]): DigEvent[][] => {
  const groups = new Map<string, DigEvent[]>();
  for (const e of events) {
    const key = e.coordinates[0].toFixed(5) + ',' + e.coordinates[1].toFixed(5);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return [...groups.values()];
};

/** Render each event in a group as its own marker, offset in pixel space so
 *  co-located markers sit directly adjacent (touching, no gap). */
const OffsetMarkerGroup: React.FC<{ events: DigEvent[]; inRange: boolean; hoveredId: string | null; myUserId: string | undefined }> = ({ events, inRange, hoveredId, myUserId }) => {
  const map = useMap();
  const navigate = useNavigate();

  const markers = useMemo(() => {
    const base = events[0].coordinates;
    const px = map.latLngToContainerPoint([base[0], base[1]]);
    const step = 14;
    const startX = px.x - ((events.length - 1) * step) / 2;
    return events.map((e, i) => {
      const pos = map.containerPointToLatLng([startX + i * step, px.y]);
      return { event: e, position: [pos.lat, pos.lng] as [number, number] };
    });
  }, [events, map]);

  return (
    <>
      {markers.map(({ event, position }) => (
        <Marker key={event.id} position={position} icon={coloredIcon(inRange, hoveredId === event.id, myUserId === event.creatorId)}
          eventHandlers={{
            mouseover: (ev) => ev.target.openPopup(),
            mouseout: (ev) => ev.target.closePopup(),
            click: () => navigate(`/events/${event.id}`),
          }}
        >
          <Popup>
            <div className="map-popup">
              <a href={`/events/${event.id}`} onClick={(ev) => { ev.preventDefault(); navigate(`/events/${event.id}`); }}
                style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                <strong>{event.title}</strong>
              </a>
              <p>{new Date(event.date).toLocaleDateString()} · {event.startTime} — {event.locationName}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const PageMarkerContent: React.FC = () => {
  const events = useAppSelector((s) => s.events.items);
  const mapBounds = useAppSelector((s) => s.events.mapBounds);
  const hoveredId = useAppSelector((s) => s.events.hoveredMarkerId);
  const myUserId = useAppSelector((s) => s.auth.user?.id);

  const collapsed = useMemo(() => {
    return collapseRecurring(events);
  }, [events]);

  const groups = useMemo(() => {
    return groupByLocation(collapsed.filter((e: DigEvent) => !e.isPrivate));
  }, [collapsed]);

  const inRangeIds = useMemo(() => {
    if (!mapBounds) return null;
    const [[south, west], [north, east]] = mapBounds;
    return new Set(
      collapsed
        .filter((e: DigEvent) => {
          const [lat, lng] = e.coordinates;
          return lat >= south && lat <= north && lng >= west && lng <= east;
        })
        .map((e: DigEvent) => e.id)
    );
  }, [collapsed, mapBounds]);

  return (
    <>
      {groups.map((group) => {
        const inRange = !inRangeIds || group.some((e) => inRangeIds.has(e.id));
        return <OffsetMarkerGroup key={group[0].id} events={group} inRange={inRange} hoveredId={hoveredId} myUserId={myUserId} />;
      })}
    </>
  );
};

export default PageMarkerContent;

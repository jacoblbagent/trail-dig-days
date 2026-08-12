import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Props {
  center: [number, number];
  radius: number;
  onCenterChange: (c: [number, number]) => void;
}

const SearchRadiusMap: React.FC<Props> = ({ center, radius, onCenterChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [center[0], center[1]],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    const marker = L.marker([center[0], center[1]], { draggable: true }).addTo(map);
    const circle = L.circle([center[0], center[1]], {
      radius: radius * 1609.34,
      color: 'var(--green-600, #15803d)',
      fillColor: 'var(--green-200, #bbf7d0)',
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const newCenter: [number, number] = [pos.lat, pos.lng];
      circle.setLatLng(pos);
      map.panTo(pos);
      onCenterChange(newCenter);
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      marker.setLatLng(c);
      circle.setLatLng(c);
      onCenterChange([c.lat, c.lng]);
    });

    mapInstance.current = map;
    circleRef.current = circle;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstance.current = null;
      circleRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1609.34);
    }
  }, [radius]);

  useEffect(() => {
    if (mapInstance.current && markerRef.current && circleRef.current) {
      mapInstance.current.setView([center[0], center[1]], mapInstance.current.getZoom());
      markerRef.current.setLatLng([center[0], center[1]]);
      circleRef.current.setLatLng([center[0], center[1]]);
    }
  }, [center[0], center[1]]);

  return <div ref={mapRef} className="radius-map" />;
};

export default SearchRadiusMap;
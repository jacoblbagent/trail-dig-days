import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';

interface Props {
  center: [number, number];
  radius: number;
  onCenterChange: (c: [number, number]) => void;
  onLocate?: (c: [number, number]) => void;
}

const SearchRadiusMap: React.FC<Props> = ({ center, radius, onCenterChange, onLocate }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const suppressMove = useRef(false);

  const goToLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (mapInstance.current) {
          suppressMove.current = true;
          mapInstance.current.setView(c, 10, { animate: false });
        }
        if (markerRef.current) markerRef.current.setLatLng(c);
        if (circleRef.current) circleRef.current.setLatLng(c);
        onCenterChange(c);
        onLocate?.(c);
        setLocating(false);
        setTimeout(() => { suppressMove.current = false; }, 50);
      },
      () => {
        setLocating(false);
        // Retry without high accuracy
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const c2: [number, number] = [pos.coords.latitude, pos.coords.longitude];
              if (mapInstance.current) { suppressMove.current = true; mapInstance.current.setView(c2, 10, { animate: false }); }
              if (markerRef.current) markerRef.current.setLatLng(c2);
              if (circleRef.current) circleRef.current.setLatLng(c2);
              onCenterChange(c2);
              onLocate?.(c2);
              setTimeout(() => { suppressMove.current = false; }, 50);
            },
            () => {},
            { timeout: 5000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [onCenterChange, onLocate]);

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

    marker.on('drag', () => {
      const pos = marker.getLatLng();
      circle.setLatLng(pos);
      map.setView(pos, map.getZoom(), { animate: false });
    });

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const newCenter: [number, number] = [pos.lat, pos.lng];
      onCenterChange(newCenter);
    });

    map.on('move', () => {
      if (suppressMove.current) return;
      const c = map.getCenter();
      marker.setLatLng(c);
      circle.setLatLng(c);
    });

    map.on('dragend', () => {
      const c = map.getCenter();
      onCenterChange([c.lat, c.lng]);
    });

    map.on('moveend', () => {
      if (suppressMove.current) return;
    });

    mapInstance.current = map;
    circleRef.current = circle;
    markerRef.current = marker;

    // Fit to circle on initial load (deferred so map is ready)
    setTimeout(() => {
      if (!mapInstance.current || !circleRef.current) return;
      suppressMove.current = true;
      map.fitBounds(circle.getBounds(), { padding: [20, 20], maxZoom: 10, animate: false });
      setTimeout(() => { suppressMove.current = false; }, 50);
    }, 100);

    return () => {
      map.remove();
      mapInstance.current = null;
      circleRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Fit bounds when radius changes (slider) — just update radius, don't re-center
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1609.34);
    }
  }, [radius]);

  // Update position when center changes externally (locate / Redux)
  useEffect(() => {
    if (mapInstance.current && markerRef.current && circleRef.current) {
      const c = [center[0], center[1]] as [number, number];
      suppressMove.current = true;
      mapInstance.current.setView(c, mapInstance.current.getZoom());
      markerRef.current.setLatLng(c);
      circleRef.current.setLatLng(c);
      setTimeout(() => { suppressMove.current = false; }, 50);
    }
  }, [center[0], center[1]]);

  return (
    <div className="radius-map-wrap" style={{ position: 'relative' }}>
      <div ref={mapRef} className="radius-map" />
      <button className="radius-locate-btn" onClick={goToLocation} disabled={locating} title="Go to my location">
        {locating ? '⋯' : '◎'}
      </button>
    </div>
  );
};

export default SearchRadiusMap;
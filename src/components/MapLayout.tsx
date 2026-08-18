import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, ZoomControl, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setSearchCenter, setMapStyle } from '../features/events/eventsSlice';
import MapMoveHandler from '../features/map/MapMoveHandler';
import TileLoadIndicator from '../features/map/TileLoadIndicator';
import PageMarkerContent from '../features/map/PageMarkerContent';
import MapExtras from '../features/map/MapExtras';
import Toolbar from './Toolbar';

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

const MapActionsControl: React.FC<{
  onLocate: () => void;
  isDetecting: boolean;
}> = ({ onLocate, isDetecting }) => {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const Control = L.Control.extend({
      onAdd: () => el,
    });
    const ctrl = new Control({ position: 'bottomright' });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);

  return (
    <div ref={ref} className="map-actions">
      <button
        className="map-locate-btn"
        onClick={onLocate}
        disabled={isDetecting}
        title="Find my location" aria-label="Find my location"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>
    </div>
  );
};

const MapStyleControl: React.FC = () => {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const mapStyle = useAppSelector((s) => s.events.mapStyle);
  const [showStyle, setShowStyle] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const Control = L.Control.extend({ onAdd: () => el });
    const ctrl = new Control({ position: 'bottomright' });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);

  return (
    <div ref={ref} className="map-style-ctrl">
      <button className="map-style-toggle" onClick={() => setShowStyle(!showStyle)} title="Map style" aria-label="Map style">
        <span className="map-style-label">Map: {{'carto':'Light','carto-dark':'Dark','osm':'OpenStreetMap','topo':'Topographic','satellite':'Satellite'}[mapStyle] || 'Light'}</span>
      </button>
      {showStyle && (
        <div className="map-style-panel">
          <div className="map-style-grid">
            {[
              { id: 'carto', label: 'Light', desc: 'Light street map' },
              { id: 'carto-dark', label: 'Dark', desc: 'Dark street map' },
              { id: 'osm', label: 'OpenStreetMap', desc: 'Standard OSM tiles' },
              { id: 'topo', label: 'Topographic', desc: 'Contours & terrain' },
              { id: 'satellite', label: 'Satellite', desc: 'Aerial imagery' },
            ].map((s) => (
              <button key={s.id} className={`map-style-btn${mapStyle === s.id ? ' active' : ''}`} onClick={() => { dispatch(setMapStyle(s.id)); setShowStyle(false); }}>
                <strong>{s.label}</strong>
                <span className="map-style-desc">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MapLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const mapStyle = useAppSelector((s) => s.events.mapStyle);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const mapZoom = useAppSelector((s) => s.events.mapZoom);
  const mapRef = useRef<L.Map | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const initRef = useRef(false);

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

  const handleLocateClick = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo(userLocation, 12, { duration: 1 });
    } else {
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
    }
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
    return DEFAULT_CENTER;
  })();

  return (
    <div className="map-page">
      <Toolbar />
      <Outlet />

      <div className="map-container" style={{ order: 1 }}>
        <MapContainer center={center} zoom={mapZoom} zoomControl={false} style={{ width: '100%', height: '100%' }} maxBounds={[[24, -125], [50, -66]]} maxBoundsViscosity={1}>
          <ZoomControl position="bottomright" />
          {(() => {
            const tileStyles: Record<string, { url: string; attr: string }> = {
              'carto': { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '&copy; <a href="https://carto.com/">CARTO</a>' },
              'carto-dark': { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '&copy; <a href="https://carto.com/">CARTO</a>' },
              'osm': { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>' },
              'topo': { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '&copy; <a href="https://opentopomap.org/copyright">OpenTopoMap</a>' },
              'satellite': { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '&copy; Esri, Maxar, Earthstar Geographics' },
            };
            // Always use the chosen style as-is — no theme fallback
            const tile = tileStyles[mapStyle] || tileStyles['carto'];
            return <TileLayer key={mapStyle} url={tile.url} attribution={tile.attr} />;
          })()}
          <MapMoveHandler />
          <MapRefSetter mapRef={mapRef} />
          <MapResizeWatcher />
          <MapCenterUpdater loc={searchCenter} />
          <TileLoadIndicator />
          <PageMarkerContent />
          <MapExtras />
          <MapActionsControl onLocate={handleLocateClick} isDetecting={isDetecting} />
          <MapStyleControl />
          {userLocation && (
            <Marker
              position={userLocation}
              icon={L.divIcon({
                className: '',
                iconSize: [18, 27],
                iconAnchor: [9, 27],
                html: `<svg width="18" height="27" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#3b82f6"/>
                  <circle cx="12" cy="12" r="4" fill="#fff"/>
                </svg>`,
              })}
            >
              <Tooltip direction="top" offset={[0, -8]}>Me</Tooltip>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapLayout;
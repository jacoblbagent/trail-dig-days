import React from 'react';
import { Outlet } from 'react-router-dom';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import { useAppSelector } from '../app/hooks';
import MapMoveHandler from '../features/map/MapMoveHandler';
import TileLoadIndicator from '../features/map/TileLoadIndicator';
import PageMarkerContent from '../features/map/PageMarkerContent';
import MapExtras from '../features/map/MapExtras';

const MapLayout: React.FC = () => {
  const theme = useAppSelector((s) => s.events.theme);
  const searchCenter = useAppSelector((s) => s.events.searchCenter);
  const searchRadius = useAppSelector((s) => s.events.searchRadius);
  const mapZoom = useAppSelector((s) => s.events.mapZoom);

  const center = searchCenter || [39.7392, -104.9903];
  // Use pathname as key so MapContainer remounts ONLY on route changes between map-standalone pages
  // TileLayer key forces tile swap on theme change

  return (
    <div className="map-page">
      <Outlet />
      <div className="map-container">
        <MapContainer center={center} zoom={mapZoom} style={{ width: '100%', height: '100%' }} maxBounds={[[24, -125], [50, -66]]} maxBoundsViscosity={1}>
          <TileLayer
            key={theme}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={theme === 'dark'
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            }
          />
          <MapMoveHandler />
          <TileLoadIndicator />
          <PageMarkerContent />
          <MapExtras />
          {searchCenter && <Circle center={searchCenter} radius={searchRadius * 1609.34} pathOptions={{ color: '#2d6a4f', weight: 2, fill: true, fillOpacity: 0.06 }} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapLayout;
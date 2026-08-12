import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useAppSelector } from '../../app/hooks';

const MapResizeHandler: React.FC = () => {
  const map = useMap();
  const collapsed = useAppSelector((s) => s.events.mapSidebarCollapsed);

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 180);
  }, [collapsed, map]);

  return null;
};

export default MapResizeHandler;
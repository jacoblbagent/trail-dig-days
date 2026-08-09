import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useAppDispatch } from '../../app/hooks';
import { setMapViewport } from '../../features/events/eventsSlice';

const MapMoveHandler: React.FC = () => {
  const map = useMap();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handler = () => {
      dispatch(setMapViewport(map.getZoom()));
    };
    map.on('moveend', handler);
    return () => { map.off('moveend', handler); };
  }, [map, dispatch]);

  return null;
};

export default MapMoveHandler;
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useAppDispatch } from '../../app/hooks';
import { setMapViewport, setMapBounds } from '../../features/events/eventsSlice';

const MapMoveHandler: React.FC = () => {
  const map = useMap();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handler = () => {
      dispatch(setMapViewport(map.getZoom()));
      const b = map.getBounds();
      dispatch(setMapBounds([[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]]));
    };
    // Fire once on mount so initial viewport sets bounds
    handler();
    map.on('moveend', handler);
    return () => { map.off('moveend', handler); };
  }, [map, dispatch]);

  return null;
};

export default MapMoveHandler;
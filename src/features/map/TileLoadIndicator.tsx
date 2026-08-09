import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';

const TileLoadIndicator: React.FC = () => {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onStart = () => setLoading(true);
    const onDone = () => setLoading(false);
    map.on('tileloadstart', onStart);
    map.on('tileload', onDone);
    map.on('tileerror', onDone);
    return () => {
      map.off('tileloadstart', onStart);
      map.off('tileload', onDone);
      map.off('tileerror', onDone);
    };
  }, [map]);

  return loading ? <div className="map-loading-indicator" /> : null;
};

export default TileLoadIndicator;
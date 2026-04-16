// useGeolocation.js
// Simple React hook to get user's current geolocation
import { useState, useEffect } from 'react';

export default function useGeolocation(options = {}) {
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    const watcher = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      options
    );
    // No watcher to clear for getCurrentPosition
    // If you want continuous updates, use watchPosition
    return () => {};
  }, []);

  return { ...coords, error, loading };
}

/**
 * hooks/useMyStation.js
 *
 * Returns the current user's assigned fire station (with lat/lng).
 * Fetches once on mount based on user.station_id from AuthContext.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { stationsApi } from '@/features/stations';

export function useMyStation() {
  const { user } = useAuth();
  const [station, setStation] = useState(null);

  useEffect(() => {
    if (user?.station_id) {
      stationsApi.getById(user.station_id)
        .then(s => setStation(s))
        .catch(() => setStation(null));
    }
  }, [user?.station_id]);

  return station;
}

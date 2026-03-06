import { useState, useEffect, useCallback, useMemo } from 'react';
import { incidentsApi } from '@/api/incidents';
import { fleetApi }     from '@/api/fleet';
import { personnelApi } from '@/api/personnel';

export const POLL_INTERVAL_MS = 30_000;

export default function useDashboardData() {
  const [incidents,        setIncidents]        = useState([]);
  const [fleets,           setFleets]           = useState([]);
  const [personnel,        setPersonnel]        = useState([]);
  const [loading,          setLoading]          = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [i, f, p] = await Promise.all([
        incidentsApi.list(),
        fleetApi.list(),
        personnelApi.list(),
      ]);
      setIncidents(i ?? []);
      setFleets(f ?? []);
      setPersonnel(p ?? []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll for updates every POLL_INTERVAL_MS
    const timer = setInterval(loadData, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  // Memoized filters
  const activeIncidents = useMemo(
    () => incidents.filter(i => i.incident_status === 'Active'),
    [incidents]
  );
  
  const deployedFleets = useMemo(
    () => fleets.filter(f => f.status === 'Dispatched'),
    [fleets]
  );
  
  const availableFleets = useMemo(
    () => fleets.filter(f => f.status === 'Serviceable'),
    [fleets]
  );
  
  const onDutyPersonnel = useMemo(
    () => personnel.filter(p => p.duty_status === 'On Duty'),
    [personnel]
  );

  return {
    incidents,
    fleets,
    personnel,
    loading,
    reload: loadData,
    activeIncidents,
    deployedFleets,
    availableFleets,
    onDutyPersonnel
  };
}

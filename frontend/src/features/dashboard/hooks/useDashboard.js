/**
 * features/dashboard/hooks/useDashboard.js
 *
 * Data hook for the Dashboard page.
 *
 * Responsibilities:
 * - Load initial snapshot.
 * - Poll every 30 seconds for near real-time updates.
 * - Expose derived metrics for UI cards/sections.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import dashboardApi from '../api/dashboard.api';
import { buildDashboardSummary } from '../services/dashboardSummary.service';

export const DASHBOARD_POLL_INTERVAL_MS = 30_000;

export function useDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const snapshot = await dashboardApi.loadSnapshot();
      setIncidents(snapshot.incidents);
      setFleets(snapshot.fleets);
      setPersonnel(snapshot.personnel);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const timer = setInterval(reload, DASHBOARD_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reload]);

  const summary = useMemo(
    () => buildDashboardSummary({ incidents, fleets, personnel }),
    [incidents, fleets, personnel]
  );

  return {
    incidents,
    fleets,
    personnel,
    isLoading,
    error,
    reload,
    ...summary,
  };
}

export default useDashboard;

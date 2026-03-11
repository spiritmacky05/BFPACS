import { useState, useEffect, useCallback } from 'react';
import { dispatchesApi } from '@/api/dispatches/dispatches';
import { incidentsApi  } from '@/api/incidents/incidents';
import { fleetApi      } from '@/api/fleet/fleet';
import { personnelApi  } from '@/api/personnel/personnel';
import { RADIO_CODES } from './constants';

// ─── localStorage history helpers ────────────────────────────────────────────

const HISTORY_KEY = 'bfpacs_dispatch_history';

const readAllHistory = () => {
  try   { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}'); }
  catch { return {}; }
};

const toHistoryKey = (dispatchId, incidentId) => `${incidentId}::${dispatchId}`;

const appendHistory = (dispatchId, fleetLabel, fromStatus, toStatus, incidentId) => {
  const all = readAllHistory();
  const key = toHistoryKey(dispatchId, incidentId);
  if (!all[key]) all[key] = [];
  all[key].push({
    status: toStatus,
    prev:   fromStatus,
    label:  fleetLabel,
    ts:     new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
};

export const getHistory = (dispatchId, incidentId) =>
  readAllHistory()[toHistoryKey(dispatchId, incidentId)] ?? [];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDispatchManager() {
  const [incidents,     setIncidents]     = useState([]);
  const [allFleets,     setAllFleets]     = useState([]);
  const [personnel,     setPersonnel]     = useState([]);
  const [dispatches,    setDispatches]    = useState([]);
  const [selectedInc,   setSelectedInc]   = useState('');
  const [selectedFleet, setSelectedFleet] = useState('');
  const [notes,         setNotes]         = useState('');
  const [dispatching,   setDispatching]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState({});

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadDispatches = useCallback(async (incidentId) => {
    if (!incidentId) return;
    const data = await dispatchesApi.getByIncident(incidentId);
    setDispatches(data ?? []);
  }, []);

  const loadFleets = useCallback(async () => {
    const data = await fleetApi.list();
    setAllFleets(data ?? []);
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const [incData] = await Promise.all([
        incidentsApi.list(),
        loadFleets(),
        personnelApi.list().then(d => setPersonnel(d ?? [])),
      ]);

      const active  = (incData ?? []).filter(i => i.incident_status === 'Active');
      setIncidents(active);

      const firstId = active[0]?.id ?? '';
      if (firstId) {
        setSelectedInc(firstId);
        await loadDispatches(firstId);
      }
      setLoading(false);
    };
    init();
  }, [loadFleets, loadDispatches]);

  // Reload dispatches when selected incident changes
  useEffect(() => {
    if (selectedInc) loadDispatches(selectedInc);
  }, [selectedInc, loadDispatches]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const availableFleets = allFleets.filter(
    f => f.status === 'Serviceable' || f.status === 'serviceable'
  );

  const getFleetLabel = (fleetId) => {
    const f = allFleets.find(x => x.id === fleetId);
    return f ? `${f.engine_code} — ${f.vehicle_type}` : 'Fleet Unit';
  };

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleDispatch = async () => {
    if (!selectedInc || !selectedFleet) return;
    setDispatching(true);

    const payload = {
      incident_id: selectedInc,
      fleet_id:    selectedFleet,
    };
    if (notes.trim()) payload.situational_report = notes.trim();

    const created = await dispatchesApi.dispatch(payload);

    // Mark the fleet as Dispatched
    await fleetApi.update(selectedFleet, { status: 'Dispatched' });

    appendHistory(
      created?.id ?? 'new',
      getFleetLabel(selectedFleet),
      null,
      RADIO_CODES.EN_ROUTE,
      selectedInc,
    );

    setSelectedFleet('');
    setNotes('');
    setDispatching(false);
    await Promise.all([loadDispatches(selectedInc), loadFleets()]);
  };

  const handleStatusUpdate = async (dispatch, newStatus) => {
    await dispatchesApi.updateStatus(dispatch.id, { dispatch_status: newStatus });

    const label = dispatch.fleet
      ? `${dispatch.fleet.engine_code} — ${dispatch.fleet.vehicle_type}`
      : getFleetLabel(dispatch.fleet_id);

    appendHistory(dispatch.id, label, dispatch.dispatch_status, newStatus, selectedInc);

    // When fire is out the fleet unit is no longer committed to this incident
    if ((newStatus === RADIO_CODES.FIRE_OUT || newStatus === RADIO_CODES.ENDING) && dispatch.fleet_id) {
      await fleetApi.update(dispatch.fleet_id, { status: 'Serviceable' });
      await loadFleets();
    }

    await loadDispatches(selectedInc);
  };

  const toggleExpand      = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const refreshDispatches = ()   => loadDispatches(selectedInc);

  return {
    incidents, allFleets, availableFleets, dispatches, personnel,
    selectedInc,   setSelectedInc,
    selectedFleet, setSelectedFleet,
    notes,         setNotes,
    loading, dispatching, expanded,
    handleDispatch, handleStatusUpdate, toggleExpand, refreshDispatches,
  };
}



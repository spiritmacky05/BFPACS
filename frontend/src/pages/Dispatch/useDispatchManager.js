import { useState, useEffect, useCallback } from 'react';
import { dispatchesApi } from '@/api/dispatches/dispatches';
import { incidentsApi  } from '@/api/incidents/incidents';
import { personnelApi  } from '@/api/personnel/personnel';
import { RADIO_CODES } from './constants';

// ─── localStorage history helpers ────────────────────────────────────────────

const HISTORY_KEY = 'bfpacs_dispatch_history';

const readAllHistory = () => {
  try   { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}'); }
  catch { return {}; }
};

const toHistoryKey = (dispatchId, incidentId) => `${incidentId}::${dispatchId}`;

const appendHistory = (dispatchId, responderLabel, fromStatus, toStatus, incidentId) => {
  const all = readAllHistory();
  const key = toHistoryKey(dispatchId, incidentId);
  if (!all[key]) all[key] = [];
  all[key].push({
    status: toStatus,
    prev:   fromStatus,
    label:  responderLabel,
    ts:     new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
};

export const getHistory = (dispatchId, incidentId) =>
  readAllHistory()[toHistoryKey(dispatchId, incidentId)] ?? [];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDispatchManager() {
  const [incidents,          setIncidents]          = useState([]);
  const [dispatches,         setDispatches]         = useState([]);
  const [personnel,          setPersonnel]          = useState([]);
  const [selectedInc,        setSelectedInc]        = useState('');
  const [selectedPersonnel,  setSelectedPersonnel]  = useState('');
  const [dispatching,        setDispatching]        = useState(false);
  const [loading,            setLoading]            = useState(true);
  const [expanded,           setExpanded]           = useState({});

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadDispatches = useCallback(async (incidentId) => {
    if (!incidentId) return;
    const data = await dispatchesApi.getByIncident(incidentId);
    setDispatches(data ?? []);
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const [incData, personnelData] = await Promise.all([
        incidentsApi.list(),
        personnelApi.list(),
      ]);

      setPersonnel(personnelData ?? []);

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
  }, [loadDispatches]);

  // Reload dispatches when selected incident changes
  useEffect(() => {
    if (selectedInc) loadDispatches(selectedInc);
  }, [selectedInc, loadDispatches]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  // Show On Duty personnel who are not already Deployed
  const availablePersonnel = personnel.filter(
    p => p.duty_status === 'On Duty'
  );

  const getResponderLabel = (personnelId) => {
    const p = personnel.find(x => x.id === personnelId);
    return p ? `${p.full_name} (${p.rank})` : 'Responder';
  };

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleDispatch = async () => {
    if (!selectedInc || !selectedPersonnel) return;
    setDispatching(true);

    const created = await dispatchesApi.dispatch({
      incident_id:  selectedInc,
      personnel_id: selectedPersonnel,
    });

    // Mark the responder as Deployed
    await personnelApi.updateDutyStatus(selectedPersonnel, 'Deployed');

    // Refresh personnel list so the selector updates
    personnelApi.list().then(d => setPersonnel(d ?? []));

    appendHistory(
      created?.id ?? 'new',
      getResponderLabel(selectedPersonnel),
      null,
      RADIO_CODES.EN_ROUTE,
      selectedInc,
    );

    setSelectedPersonnel('');
    setDispatching(false);
    await loadDispatches(selectedInc);
  };

  const handleStatusUpdate = async (dispatch, newStatus) => {
    await dispatchesApi.updateStatus(dispatch.id, { dispatch_status: newStatus });

    const personnelId = dispatch.personnel_id;
    const label = dispatch.personnel
      ? `${dispatch.personnel.full_name} (${dispatch.personnel.rank})`
      : getResponderLabel(personnelId);

    appendHistory(dispatch.id, label, dispatch.dispatch_status, newStatus, selectedInc);

    // When fire is out the responder returns to active duty
    if ((newStatus === RADIO_CODES.FIRE_OUT || newStatus === RADIO_CODES.ENDING) && personnelId) {
      await personnelApi.updateDutyStatus(personnelId, 'On Duty');
      personnelApi.list().then(d => setPersonnel(d ?? []));
    }

    await loadDispatches(selectedInc);
  };

  const toggleExpand      = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const refreshDispatches = ()   => loadDispatches(selectedInc);

  return {
    incidents, dispatches, personnel, availablePersonnel,
    selectedInc,       setSelectedInc,
    selectedPersonnel, setSelectedPersonnel,
    loading, dispatching, expanded,
    handleDispatch, handleStatusUpdate, toggleExpand, refreshDispatches,
  };
}

// ─── localStorage history helpers (temporary — see TODO above) ────────────────

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
    fleet:  fleetLabel,
    ts:     new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
};

/**
 * Read the status-transition log for a single dispatch.
 * Exported so DispatchItem can read history without prop-drilling through Dispatch.jsx.
 *
 * @param {string|number} dispatchId
 * @param {string|number} incidentId
 * @returns {Array<{status: string, prev: string|null, fleet: string, ts: string}>}
 */
export const getHistory = (dispatchId, incidentId) =>
  readAllHistory()[toHistoryKey(dispatchId, incidentId)] ?? [];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDispatchManager() {
  const [incidents,     setIncidents]     = useState([]);
  const [allFleets,     setAllFleets]     = useState([]);
  const [dispFleets,    setDispFleets]    = useState([]);
  const [dispatches,    setDispatches]    = useState([]);
  const [personnel,     setPersonnel]     = useState([]);
  const [selectedInc,   setSelectedInc]   = useState('');
  const [selectedFleet, setSelectedFleet] = useState('');
  const [dispatching,   setDispatching]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState({});

  // ── Loaders ─────────────────────────────────────────────────────────────────

  const loadDispatches = useCallback(async (incidentId) => {
    if (!incidentId) return;
    const data = await dispatchesApi.getByIncident(incidentId);
    setDispatches(data ?? []);
  }, []);

  const loadFleets = useCallback(async () => {
    const data = await fleetApi.list();
    setAllFleets(data ?? []);
    setDispFleets((data ?? []).filter(f => f.status === 'Serviceable'));
  }, []);

  // Initial load — run once on mount
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

  // Reload dispatches whenever the selected incident changes
  useEffect(() => {
    if (selectedInc) loadDispatches(selectedInc);
  }, [selectedInc, loadDispatches]);

  // ── Internal helpers ─────────────────────────────────────────────────────────

  const getFleetLabel = (fleetId) => {
    const fleet = allFleets.find(f => f.id === fleetId);
    return fleet ? `${fleet.engine_code} — ${fleet.vehicle_type}` : 'Fleet Unit';
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleDispatch = async () => {
    if (!selectedInc || !selectedFleet) return;
    setDispatching(true);
    const created = await dispatchesApi.dispatch({
      incident_id: selectedInc,
      fleet_id:    selectedFleet,
    });

    // Mark the fleet as Dispatched and write the first movement log entry
    // so the change is immediately visible in the Fleet page log panel.
    await Promise.all([
      fleetApi.update(selectedFleet, { status: 'Dispatched' }),
      fleetApi.logMovement(selectedFleet, { status_code: RADIO_CODES.EN_ROUTE }),
    ]);

    setDispatching(false);
    setSelectedFleet('');

    appendHistory(
      created?.id ?? 'new',
      getFleetLabel(selectedFleet),
      null,
      RADIO_CODES.EN_ROUTE,
      selectedInc,
    );

    await Promise.all([loadDispatches(selectedInc), loadFleets()]);
  };

  const handleStatusUpdate = async (dispatch, newStatus) => {
    await dispatchesApi.updateStatus(dispatch.id, { dispatch_status: newStatus });

    // Write a movement log entry so every status change appears in the Fleet page log panel.
    await fleetApi.logMovement(dispatch.fleet_id, { status_code: newStatus });

    appendHistory(
      dispatch.id,
      getFleetLabel(dispatch.fleet_id),
      dispatch.dispatch_status,
      newStatus,
      selectedInc,
    );

    // When fire is out, the fleet unit is no longer committed to this incident —
    // mark it Serviceable so it can be selected for a new dispatch.
    if (newStatus === RADIO_CODES.FIRE_OUT) {
      await fleetApi.update(dispatch.fleet_id, { status: 'Serviceable' });
    }

    await Promise.all([loadDispatches(selectedInc), loadFleets()]);
  };

  const toggleExpand      = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const refreshDispatches = ()   => loadDispatches(selectedInc);

  return {
    // Data
    incidents, allFleets, dispFleets, dispatches, personnel,
    // Selection state
    selectedInc,   setSelectedInc,
    selectedFleet, setSelectedFleet,
    // UI flags
    loading, dispatching, expanded,
    // Actions
    handleDispatch, handleStatusUpdate, toggleExpand, refreshDispatches,
  };
}

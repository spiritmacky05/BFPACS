import { useState, useEffect, useCallback } from 'react';
import { dispatchesApi } from '@/api/dispatches/dispatches';
import { incidentsApi  } from '@/api/incidents/incidents';
import { usersApi      } from '@/api/users/users';
import { personnelApi  } from '@/api/personnel/personnel';
import { DISPATCH_STATUSES } from './constants';

// ─── localStorage history helpers ────────────────────────────────────────────

const HISTORY_KEY = 'bfpacs_dispatch_history';

const readAllHistory = () => {
  try   { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}'); }
  catch { return {}; }
};

const toHistoryKey = (dispatchId, incidentId) => `${incidentId}::${dispatchId}`;

const appendHistory = (dispatchId, label, fromStatus, toStatus, incidentId) => {
  const all = readAllHistory();
  const key = toHistoryKey(dispatchId, incidentId);
  if (!all[key]) all[key] = [];
  all[key].push({ status: toStatus, prev: fromStatus, label, ts: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
};

export const getHistory = (dispatchId, incidentId) =>
  readAllHistory()[toHistoryKey(dispatchId, incidentId)] ?? [];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDispatchManager() {
  const [incidents,          setIncidents]          = useState([]);
  const [allResponders,      setAllResponders]      = useState([]);
  const [personnel,          setPersonnel]          = useState([]);
  const [dispatches,         setDispatches]         = useState([]);
  const [selectedInc,        setSelectedInc]        = useState('');
  const [selectedResponders, setSelectedResponders] = useState([]);
  const [notes,              setNotes]              = useState('');
  const [dispatching,        setDispatching]        = useState(false);
  const [loading,            setLoading]            = useState(true);
  const [expanded,           setExpanded]           = useState({});

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadDispatches = useCallback(async (incidentId) => {
    if (!incidentId) return;
    const data = await dispatchesApi.getByIncident(incidentId);
    setDispatches(data ?? []);
  }, []);

  const loadResponders = useCallback(async () => {
    const data = await usersApi.list();
    const responders = (data ?? []).filter(u => u.role === 'user' || u.user_type === 'responder');
    setAllResponders(responders);
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const [incData] = await Promise.all([
        incidentsApi.list(),
        loadResponders(),
        personnelApi.list().then(d => setPersonnel(d ?? [])),
      ]);
      const active = (incData ?? []).filter(i => i.incident_status === 'Active');
      setIncidents(active);
      const firstId = active[0]?.id ?? '';
      if (firstId) {
        setSelectedInc(firstId);
        await loadDispatches(firstId);
      }
      setLoading(false);
    };
    init();
  }, [loadResponders, loadDispatches]);

  // Reload dispatches when selected incident changes
  useEffect(() => {
    if (selectedInc) loadDispatches(selectedInc);
  }, [selectedInc, loadDispatches]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const availableResponders = allResponders;

  const toggleResponder = (id) =>
    setSelectedResponders(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const getResponderLabel = (userId) => {
    const u = allResponders.find(x => x.id === userId);
    if (!u) return 'Responder Unit';
    return u.type_of_vehicle ? `${u.full_name} — ${u.type_of_vehicle}` : u.full_name;
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleDispatch = async () => {
    if (!selectedInc || !selectedResponders.length) return;
    setDispatching(true);

    // Dispatch each selected responder individually (one API call per unit)
    await Promise.all(
      selectedResponders.map(async (userId) => {
        const payload = { incident_id: selectedInc, user_id: userId };
        if (notes.trim()) payload.situational_report = notes.trim();
        const created = await dispatchesApi.dispatch(payload);
        await usersApi.update(userId, { acs_status: 'ACS Activated' });
        appendHistory(
          created?.id ?? 'new',
          getResponderLabel(userId),
          null,
          DISPATCH_STATUSES.DISPATCHED,
          selectedInc,
        );
      })
    );

    setSelectedResponders([]);
    setNotes('');
    setDispatching(false);
    await Promise.all([loadDispatches(selectedInc), loadResponders()]);
  };

  const handleStatusUpdate = async (dispatch, newStatus) => {
    await dispatchesApi.updateStatus(dispatch.id, { dispatch_status: newStatus });

    const label = dispatch.responder
      ? (dispatch.responder.full_name + (dispatch.responder.type_of_vehicle ? ` — ${dispatch.responder.type_of_vehicle}` : ''))
      : getResponderLabel(dispatch.personnel_id);

    appendHistory(dispatch.id, label, dispatch.dispatch_status, newStatus, selectedInc);

    // On completion, reset the responder's ACS status to Serviceable
    if (newStatus === DISPATCH_STATUSES.COMPLETED && dispatch.personnel_id) {
      await usersApi.update(dispatch.personnel_id, { acs_status: 'Serviceable' });
      await loadResponders();
    }

    await loadDispatches(selectedInc);
  };

  const toggleExpand      = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const refreshDispatches = ()   => loadDispatches(selectedInc);

  return {
    incidents, allResponders, availableResponders, dispatches, personnel,
    selectedInc,        setSelectedInc,
    selectedResponders, toggleResponder,
    notes,              setNotes,
    loading, dispatching, expanded,
    handleDispatch, handleStatusUpdate, toggleExpand, refreshDispatches,
  };
}

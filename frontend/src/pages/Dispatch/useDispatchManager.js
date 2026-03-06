/**
 * useDispatchManager.js
 *
 * Custom hook — owns ALL state, data-loading, and action logic for the
 * Dispatch page. The UI layer (Dispatch.jsx) calls this hook and only
 * concerns itself with rendering what it receives.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  KNOWN TECHNICAL DEBT — localStorage History
 * ─────────────────────────────────────────────────────────────────────────────
 * Status transition history is currently persisted in localStorage.
 * This is NOT appropriate for a production emergency-dispatch system:
 *
 *  1. DEVICE-LOCAL  — Each browser has its own history. A supervisor on a
 *                     second device sees a completely different (empty) timeline.
 *
 *  2. NOT DURABLE   — Clearing browser storage silently destroys the audit log.
 *                     Browser updates, OS pressure, and incognito tabs also wipe it.
 *
 *  3. NOT AUDITABLE — Fire-service dispatch records are legally discoverable
 *                     in incident investigations. "The browser deleted it"
 *                     is not a defensible answer in court.
 *
 *  4. CLOCK SKEW    — Timestamps are taken from the client clock, which can
 *                     be wrong or deliberately manipulated.
 *
 *  5. NO REAL-TIME  — Status transitions written by one session are never
 *                     visible to concurrent sessions without a full reload.
 *
 * TODO: Replace with backend persistence:
 *
 *   Backend: Add a dispatch_status_history table:
 *     CREATE TABLE dispatch_status_history (
 *       id           BIGSERIAL    PRIMARY KEY,
 *       dispatch_id  BIGINT       NOT NULL REFERENCES incident_dispatches(id),
 *       from_status  VARCHAR(50),
 *       to_status    VARCHAR(50)  NOT NULL,
 *       changed_by   BIGINT       REFERENCES users(id),
 *       changed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
 *     );
 *
 *   API endpoints:
 *     POST /api/v1/dispatches/:id/history  { from_status, to_status }
 *     GET  /api/v1/dispatches/:id/history
 *
 *   The Go handler for PATCH /dispatches/:id/status should INSERT into this
 *   table inside the same DB transaction as the status UPDATE, using a
 *   server-side NOW() for a tamper-proof, authoritative timestamp.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { dispatchesApi } from '@/api/dispatches/dispatches';
import { incidentsApi  } from '@/api/incidents/incidents';
import { fleetApi      } from '@/api/fleet/fleet';
import { personnelApi  } from '@/api/personnel/personnel';
import { RADIO_CODES } from './constants';

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

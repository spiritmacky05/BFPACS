/**
 * pages/Dispatch.jsx
 *
 * Incident dispatch management — dispatch fleet, update BFP radio codes.
 * Status history is persisted in localStorage so it survives page refreshes.
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  ClipboardList, Send, RefreshCw, Radio, Clock,
  Truck, ChevronDown, UserCheck, Award,
} from 'lucide-react';
import { dispatchesApi } from '@/api/dispatches';
import { incidentsApi }  from '@/api/incidents';
import { fleetApi }      from '@/api/fleet';
import { personnelApi }  from '@/api/personnel';
import { useAuth }       from '@/context/AuthContext';
import PersonnelLink     from '@/components/PersonnelLink';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────

const styles = {
  loading: "text-center text-gray-500 py-16",
  pageContainer: "space-y-6",
  
  header: {
    wrapper: "flex items-center gap-3",
    iconBox: "w-9 h-9 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center justify-center",
    icon: "w-5 h-5 text-red-400",
    title: "text-white font-semibold text-lg",
    subtitle: "text-gray-500 text-xs"
  },
  
  card: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-5",
    label: "block text-gray-400 text-xs uppercase tracking-wider mb-2",
    emptyText: "text-gray-600 text-sm",
    title: "text-white font-medium mb-4 text-sm flex items-center gap-2",
    titleIcon: "w-4 h-4 text-red-400",
    hintText: "text-gray-600 text-xs mt-3",
  },
  
  form: {
    flexRow: "flex gap-3",
    select: "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none",
    selectFlex: "flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none",
    buttonContainer: "flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all",
    buttonIcon: "w-4 h-4"
  },
  
  log: {
    header: "flex items-center justify-between mb-5",
    badge: "text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full",
    refreshBtn: "p-1.5 rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white transition-all",
    refreshIcon: "w-3.5 h-3.5",
    emptyWrapper: "text-center py-12",
    emptyIcon: "w-10 h-10 text-gray-700 mx-auto mb-3",
    list: "space-y-4"
  },
  
  dispatchItem: {
    wrapper: "border border-[#1f1f1f] rounded-xl overflow-hidden",
    header: "p-4 flex items-start justify-between gap-4",
    infoBox: "flex items-start gap-3 flex-1 min-w-0",
    iconBox: "w-8 h-8 bg-red-600/10 border border-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
    icon: "w-4 h-4 text-red-400",
    titleContent: "min-w-0",
    title: "text-white text-sm font-semibold truncate",
    statusRow: "flex items-center gap-2 mt-1 flex-wrap",
    statusBadgeBase: "text-xs px-2 py-0.5 rounded border",
    time: "text-gray-600 text-xs flex items-center gap-1",
    timeIcon: "w-3 h-3",
    statusSelect: "bg-[#0a0a0a] border border-[#2a2a2a] text-gray-400 rounded-lg px-2 py-1.5 text-xs focus:border-red-600 outline-none flex-shrink-0"
  },
  
  history: {
    toggleBtn: "w-full flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-t border-[#1f1f1f] text-xs text-gray-500 hover:text-gray-300 transition-all",
    toggleContent: "flex items-center gap-1.5",
    toggleIcon: "w-3.5 h-3.5 transition-transform",
    toggleIconExpanded: "rotate-180",
    wrapper: "px-4 py-3 bg-[#0a0a0a] space-y-0",
    inner: "relative",
    row: "flex gap-3 pb-3",
    lineCol: "flex flex-col items-center flex-shrink-0",
    dotBase: "w-2 h-2 rounded-full border mt-1 flex-shrink-0",
    dotActive: "bg-red-500 border-red-500",
    dotInactive: "bg-[#2a2a2a] border-[#3a3a3a]",
    line: "w-px flex-1 bg-[#2a2a2a] mt-1",
    content: "flex-1 pb-1",
    statusRow: "flex items-center gap-2 flex-wrap",
    time: "text-gray-600 text-xs",
    prevStatus: "text-gray-700 text-xs mt-0.5"
  },
  
  report: {
    wrapper: "px-4 py-3 border-t border-[#1f1f1f] bg-[#0d0d0d]",
    label: "text-gray-500 text-xs uppercase tracking-wider mb-1",
    text: "text-gray-300 text-xs"
  }
};

// ─── BFP Radio Codes ──────────────────────────────────────────────────────────

const BFP_STATUS_CODES = [
  { code: '10-70', label: '10-70 En Route',           color: 'text-yellow-400 border-yellow-600/30 bg-yellow-600/10' },
  { code: '10-23', label: '10-23 Arrived at Scene',   color: 'text-blue-400 border-blue-600/30 bg-blue-600/10' },
  { code: '10-41', label: '10-41 Beginning Tour',     color: 'text-green-400 border-green-600/30 bg-green-600/10' },
  { code: '10-42', label: '10-42 Ending Tour',        color: 'text-gray-400 border-gray-600/30 bg-gray-600/10' },
  { code: 'ctrl',  label: 'Controlled',               color: 'text-orange-400 border-orange-600/30 bg-orange-600/10' },
  { code: 'out',   label: 'Fire Out',                 color: 'text-red-400 border-red-600/30 bg-red-600/10' },
];

const statusColor = (label) =>
  BFP_STATUS_CODES.find(s => s.label === label)?.color
  ?? 'text-gray-400 border-gray-600/30 bg-gray-600/10';

// ─── localStorage history helpers ─────────────────────────────────────────────

const HISTORY_KEY = 'bfpacs_dispatch_history';

function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}'); }
  catch { return {}; }
}

function appendHistory(dispatchId, fleetLabel, fromStatus, toStatus, incidentId) {
  const all = readHistory();
  const key = `${incidentId}::${dispatchId}`;
  if (!all[key]) all[key] = [];
  all[key].push({
    status:    toStatus,
    prev:      fromStatus,
    fleet:     fleetLabel,
    ts:        new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}

function getHistory(dispatchId, incidentId) {
  const all = readHistory();
  return all[`${incidentId}::${dispatchId}`] ?? [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dispatch() {
  const [incidents,    setIncidents]    = useState([]);
  const [allFleets,    setAllFleets]    = useState([]);   // all fleets for label lookup
  const [dispFleets,   setDispFleets]   = useState([]);   // serviceable fleets for dropdown
  const [dispatches,   setDispatches]   = useState([]);
  const [personnel,    setPersonnel]    = useState([]);   // duty personnel
  const [selectedInc,  setSelectedInc]  = useState('');
  const [selectedFleet,setSelectedFleet]= useState('');
  const [dispatching,  setDispatching]  = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [expanded,     setExpanded]     = useState({});   // dispatchId → bool

  const { role }  = useAuth();
  const isAdmin   = role === 'admin' || role === 'superadmin';

  // ── Loaders ─────────────────────────────────────────────────────────────────
  const loadIncidents = useCallback(async () => {
    const data = await incidentsApi.list();
    const active = (data ?? []).filter(i => i.incident_status === 'Active');
    setIncidents(active);
    return active;
  }, []);

  const loadFleets = useCallback(async () => {
    const data = await fleetApi.list();
    setAllFleets(data ?? []);
    setDispFleets((data ?? []).filter(f => f.status === 'Serviceable'));
  }, []);

  const loadPersonnel = useCallback(async () => {
    const data = await personnelApi.list();
    setPersonnel(data ?? []);
  }, []);

  const loadDispatches = useCallback(async (incidentId) => {
    if (!incidentId) return;
    const data = await dispatchesApi.getByIncident(incidentId);
    setDispatches(data ?? []);
  }, []);

  useEffect(() => {
    Promise.all([loadIncidents(), loadFleets(), loadPersonnel()]).then(([active]) => {
      const firstId = active[0]?.id ?? '';
      if (firstId) {
        setSelectedInc(firstId);
        loadDispatches(firstId);
      }
      setLoading(false);
    });
  }, [loadIncidents, loadFleets, loadDispatches, loadPersonnel]);

  useEffect(() => {
    if (selectedInc) loadDispatches(selectedInc);
  }, [selectedInc, loadDispatches]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleDispatch = async () => {
    if (!selectedInc || !selectedFleet) return;
    setDispatching(true);
    const created = await dispatchesApi.dispatch({ incident_id: selectedInc, fleet_id: selectedFleet });
    setDispatching(false);
    setSelectedFleet('');

    // Seed initial history entry for this dispatch
    const fleet = allFleets.find(f => f.id === selectedFleet);
    const label = fleet ? `${fleet.engine_code} — ${fleet.vehicle_type}` : 'Fleet Unit';
    appendHistory(created?.id ?? 'new', label, null, '10-70 En Route', selectedInc);

    loadDispatches(selectedInc);
    loadFleets();
  };

  const handleStatusUpdate = async (dispatch, newStatus) => {
    const fleet = allFleets.find(f => f.id === dispatch.fleet_id);
    const label = fleet ? `${fleet.engine_code} — ${fleet.vehicle_type}` : 'Fleet Unit';

    await dispatchesApi.updateStatus(dispatch.id, { dispatch_status: newStatus });
    appendHistory(dispatch.id, label, dispatch.dispatch_status, newStatus, selectedInc);
    loadDispatches(selectedInc);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) return <div className={styles.loading}>Loading dispatch...</div>;

  return (
    <div className={styles.pageContainer}>
      {/* Page header */}
      <div className={styles.header.wrapper}>
        <div className={styles.header.iconBox}>
          <ClipboardList className={styles.header.icon} />
        </div>
        <div>
          <h2 className={styles.header.title}>Dispatch System</h2>
          <p className={styles.header.subtitle}>Manage fleet deployment and BFP radio codes</p>
        </div>
      </div>

      {/* Incident selector */}
      <div className={styles.card.wrapper}>
        <label className={styles.card.label}>
          Active Incident
        </label>
        {!incidents.length ? (
          <div className={styles.card.emptyText}>No active incidents</div>
        ) : (
          <select value={selectedInc}
            onChange={e => setSelectedInc(e.target.value)}
            className={styles.form.select}>
            {incidents.map(i => (
              <option key={i.id} value={i.id}>
                📍 {i.location_text} — {i.alarm_status}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Duty Personnel Panel ─────────────────────────────────────── */}
      <div className={styles.card.wrapper}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={styles.card.title} style={{ marginBottom: 0 }}>
            <UserCheck className={styles.card.titleIcon} /> Duty Personnel
            <span className="ml-2 text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full font-normal">
              {personnel.filter(p => p.duty_status === 'On Duty').length} on duty
            </span>
          </h3>
        </div>

        {!personnel.length ? (
          <div className={styles.card.emptyText}>No personnel data available</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {personnel.map(p => {
              const statusColors = {
                'On Duty':  { dot: 'bg-green-400', badge: 'text-green-400 bg-green-600/10 border-green-600/30' },
                'Off Duty': { dot: 'bg-gray-500',  badge: 'text-gray-400 bg-gray-600/10 border-gray-600/30'  },
                'On Leave': { dot: 'bg-yellow-400',badge: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30' },
              };
              const sc = statusColors[p.duty_status] ?? statusColors['Off Duty'];
              return (
                <div key={p.id}
                  className={`bg-[#0d0d0d] border rounded-xl p-3.5 flex flex-col gap-2 transition-all ${
                    p.duty_status === 'On Duty'
                      ? 'border-green-600/20 hover:border-green-600/40'
                      : 'border-[#1f1f1f] opacity-60'
                  }`}>
                  {/* Name + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold truncate">
                        <PersonnelLink id={p.id} name={p.full_name} className="text-white font-semibold" />
                        {p.is_station_commander && (
                          <span className="ml-1.5 text-xs text-yellow-400 border border-yellow-600/30 bg-yellow-600/10 px-1.5 py-0.5 rounded">
                            Cmdr
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">{p.rank}</div>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded border ${sc.badge}`}>
                      {p.duty_status}
                    </span>
                  </div>

                  {/* Shift + Certification */}
                  <div className="flex flex-col gap-1 pt-1 border-t border-[#1f1f1f]">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="text-gray-600">Shift:</span>
                      <span className="text-gray-300">{p.shift ?? '—'}</span>
                    </div>
                    {p.certification && p.certification !== 'None' && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Award className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="text-blue-300/80 truncate">{p.certification}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispatch panel (admin only) */}
      {isAdmin && (
        <div className={styles.card.wrapper}>
          <h3 className={styles.card.title}>
            <Truck className={styles.card.titleIcon} /> Dispatch Fleet Unit
          </h3>
          <div className={styles.form.flexRow}>
            <select value={selectedFleet}
              onChange={e => setSelectedFleet(e.target.value)}
              className={styles.form.selectFlex}>
              <option value="">— Select Available Fleet —</option>
              {dispFleets.map(f => (
                <option key={f.id} value={f.id}>
                  {f.engine_code} — {f.vehicle_type} ({f.ft_capacity})
                </option>
              ))}
            </select>
            <button onClick={handleDispatch}
              disabled={dispatching || !selectedFleet || !selectedInc}
              className={styles.form.buttonContainer}>
              <Send className={styles.form.buttonIcon} />
              {dispatching ? 'Dispatching...' : 'Dispatch'}
            </button>
          </div>
          {dispFleets.length === 0 && (
            <p className={styles.card.hintText}>
              No serviceable fleet units available. All units are dispatched or inactive.
            </p>
          )}
        </div>
      )}

      {/* Dispatch Log with History */}
      <div className={styles.card.wrapper}>
        <div className={styles.log.header}>
          <h3 className={styles.card.title} style={{ marginBottom: 0 }}>
            <Radio className={styles.card.titleIcon} />
            Dispatch Log
            {dispatches.length > 0 && (
              <span className={styles.log.badge}>
                {dispatches.length} unit{dispatches.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <button onClick={() => loadDispatches(selectedInc)}
            className={styles.log.refreshBtn}>
            <RefreshCw className={styles.log.refreshIcon} />
          </button>
        </div>

        {!dispatches.length ? (
          <div className={styles.log.emptyWrapper}>
            <Truck className={styles.log.emptyIcon} />
            <div className={styles.card.emptyText}>No dispatches for this incident</div>
          </div>
        ) : (
          <div className={styles.log.list}>
            {dispatches.map(d => {
              const fleet      = allFleets.find(f => f.id === d.fleet_id);
              const fleetLabel = fleet ? `${fleet.engine_code} — ${fleet.vehicle_type}` : 'Fleet Unit';
              const history    = getHistory(d.id, selectedInc);
              const isOpen     = expanded[d.id] ?? false;
              const currentStatus = d.dispatch_status ?? '10-70 En Route';
              const currentColor  = statusColor(currentStatus);

              return (
                <div key={d.id} className={styles.dispatchItem.wrapper}>
                  {/* Dispatch header */}
                  <div className={styles.dispatchItem.header}>
                    <div className={styles.dispatchItem.infoBox}>
                      <div className={styles.dispatchItem.iconBox}>
                        <Truck className={styles.dispatchItem.icon} />
                      </div>
                      <div className={styles.dispatchItem.titleContent}>
                        <div className={styles.dispatchItem.title}>{fleetLabel}</div>
                        <div className={styles.dispatchItem.statusRow}>
                          <span className={`${styles.dispatchItem.statusBadgeBase} ${currentColor}`}>
                            {currentStatus}
                          </span>
                          <span className={styles.dispatchItem.time}>
                            <Clock className={styles.dispatchItem.timeIcon} />
                            {d.dispatched_at
                              ? format(new Date(d.dispatched_at), 'MMM d, h:mm a')
                              : 'Just dispatched'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Update status (admin) */}
                    {isAdmin && (
                      <select
                        value=""
                        onChange={e => { if (e.target.value) handleStatusUpdate(d, e.target.value); }}
                        className={styles.dispatchItem.statusSelect}>
                        <option value="" disabled>Update status...</option>
                        {BFP_STATUS_CODES.map(s => (
                          <option key={s.code} value={s.label}>{s.label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Status History timeline */}
                  {history.length > 0 && (
                    <>
                      {/* Expand toggle */}
                      <button
                        onClick={() => toggleExpand(d.id)}
                        className={styles.history.toggleBtn}>
                        <span className={styles.history.toggleContent}>
                          <Clock className={styles.dispatchItem.timeIcon} />
                          {history.length} status update{history.length !== 1 ? 's' : ''}
                        </span>
                        <ChevronDown className={`${styles.history.toggleIcon} ${isOpen ? styles.history.toggleIconExpanded : ''}`} />
                      </button>

                      {isOpen && (
                        <div className={styles.history.wrapper}>
                          {/* Timeline */}
                          <div className={styles.history.inner}>
                            {history.map((entry, idx) => {
                              const isLast = idx === history.length - 1;
                              const color  = statusColor(entry.status);
                              return (
                                <div key={idx} className={styles.history.row}>
                                  {/* Timeline line + dot */}
                                  <div className={styles.history.lineCol}>
                                    <div className={`${styles.history.dotBase} ${isLast ? styles.history.dotActive : styles.history.dotInactive}`} />
                                    {!isLast && <div className={styles.history.line} />}
                                  </div>
                                  {/* Entry content */}
                                  <div className={styles.history.content}>
                                    <div className={styles.history.statusRow}>
                                      <span className={`${styles.dispatchItem.statusBadgeBase} ${color}`}>
                                        {entry.status}
                                      </span>
                                      <span className={styles.history.time}>
                                        {format(new Date(entry.ts), 'MMM d, h:mm:ss a')}
                                      </span>
                                    </div>
                                    {entry.prev && (
                                      <div className={styles.history.prevStatus}>
                                        ← from {entry.prev}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Situational report */}
                  {d.situational_report && (
                    <div className={styles.report.wrapper}>
                      <div className={styles.report.label}>Situational Report</div>
                      <div className={styles.report.text}>{d.situational_report}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
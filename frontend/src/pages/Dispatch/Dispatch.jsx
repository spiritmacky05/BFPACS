/**
 * pages/Dispatch/Dispatch.jsx
 *
 * UI layer only — layout and composition.
 * All state, API calls, and history logic live in useDispatchManager.
 */

import { ClipboardList, Send, RefreshCw, Radio, Truck, UserCheck } from 'lucide-react';
import { useAuth }            from '@/context/AuthContext/AuthContext';
import { useDispatchManager } from './useDispatchManager';
import PersonnelCard          from './PersonnelCard';
import DispatchItem           from './DispatchItem';

const card         = 'bg-[#111] border border-[#1f1f1f] rounded-xl p-5';
const sectionTitle = 'text-white font-medium text-sm flex items-center gap-2';
const redIcon      = 'w-4 h-4 text-red-400';

export default function Dispatch() {
  const { role } = useAuth();
  const isAdmin  = role === 'admin' || role === 'superadmin';

  const {
    incidents, availableFleets, dispatches, personnel,
    selectedInc,   setSelectedInc,
    selectedFleet, setSelectedFleet,
    notes,         setNotes,
    loading, dispatching, expanded,
    handleDispatch, handleStatusUpdate, toggleExpand, refreshDispatches,
  } = useDispatchManager();

  if (loading) return <div className="text-center text-gray-500 py-16">Loading dispatch…</div>;

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Dispatch System</h2>
          <p className="text-gray-500 text-xs">Manage fleet deployment and BFP radio codes</p>
        </div>
      </div>

      {/* ── Active incident selector ──────────────────────────────────────── */}
      <div className={card}>
        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">
          Active Incident
        </label>
        {!incidents.length ? (
          <p className="text-gray-600 text-sm">No active incidents</p>
        ) : (
          <select
            value={selectedInc}
            onChange={e => setSelectedInc(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none">
            {incidents.map(i => (
              <option key={i.id} value={i.id}>
                📍 {i.location_text} — {i.alarm_status}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Duty personnel grid ───────────────────────────────────────────── */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={sectionTitle}>
            <UserCheck className={redIcon} />
            Duty Personnel
            <span className="ml-1 text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full font-normal">
              {personnel.filter(p => p.duty_status === 'On Duty').length} on duty
            </span>
          </h3>
        </div>
        {!personnel.length ? (
          <p className="text-gray-600 text-sm">No personnel data available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {personnel.map(p => <PersonnelCard key={p.id} personnel={p} />)}
          </div>
        )}
      </div>

      {/* ── Dispatch fleet unit (admin only) ──────────────────────────────── */}
      {isAdmin && (
        <div className={card}>
          <h3 className={`${sectionTitle} mb-4`}>
            <Truck className={redIcon} /> Dispatch Fleet Unit
          </h3>
          <div className="space-y-3">
            <select
              value={selectedFleet}
              onChange={e => setSelectedFleet(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none">
              <option value="">— Select Serviceable Fleet —</option>
              {availableFleets.map(f => (
                <option key={f.id} value={f.id}>
                  {f.engine_code} — {f.vehicle_type}{f.ft_capacity ? ` (${f.ft_capacity})` : ''}
                </option>
              ))}
            </select>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add dispatch notes or situational report (optional)…"
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none resize-none placeholder:text-gray-600"
            />
            <div className="flex justify-end">
              <button
                onClick={handleDispatch}
                disabled={dispatching || !selectedFleet || !selectedInc}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all">
                <Send className="w-4 h-4" />
                {dispatching ? 'Dispatching…' : 'Dispatch'}
              </button>
            </div>
          </div>
          {!availableFleets.length && (
            <p className="text-gray-600 text-xs mt-3">
              No serviceable fleet units available. All units are dispatched or inactive.
            </p>
          )}
        </div>
      )}

      {/* ── Dispatch log ─────────────────────────────────────────────────── */}
      <div className={card}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={sectionTitle}>
            <Radio className={redIcon} />
            Dispatch Log
            {dispatches.length > 0 && (
              <span className="text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full">
                {dispatches.length} unit{dispatches.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <button
            onClick={refreshDispatches}
            className="p-1.5 rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {!dispatches.length ? (
          <div className="text-center py-12">
            <Truck className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No dispatches for this incident</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dispatches.map(d => {
              const fleetLabel = d.fleet
                ? `${d.fleet.engine_code} — ${d.fleet.vehicle_type}`
                : 'Fleet Unit';
              return (
                <DispatchItem
                  key={d.id}
                  dispatch={d}
                  fleetLabel={fleetLabel}
                  isAdmin={isAdmin}
                  selectedInc={selectedInc}
                  onStatusUpdate={handleStatusUpdate}
                  expanded={expanded[d.id] ?? false}
                  onToggle={() => toggleExpand(d.id)}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}



/**
 * DispatchItem.jsx
 *
 * A single dispatched fleet unit: status badge, collapsible history timeline,
 * and optional situational report. Extracted from Dispatch.jsx so this complex
 * sub-tree has its own scope, props contract, and is individually testable.
 *
 * Props:
 *   dispatch      — dispatch object from the API
 *   fleetLabel    — pre-computed "BFP-01 — Light Fire Truck" string
 *   isAdmin       — controls visibility of the status update dropdown
 *   selectedInc   — current incident ID (used to read localStorage history)
 *   onStatusUpdate(dispatch, newStatus) — callback for status dropdown changes
 *   expanded      — boolean: whether the history timeline is open
 *   onToggle()    — callback to flip expanded state in the parent
 */

import { format } from 'date-fns';
import { Truck, Clock, ChevronDown } from 'lucide-react';
import { BFP_STATUS_CODES, RADIO_CODES, statusColor } from './constants';
import { getHistory } from './useDispatchManager';

export default function DispatchItem({
  dispatch: d,
  fleetLabel,
  isAdmin,
  selectedInc,
  onStatusUpdate,
  expanded,
  onToggle,
}) {
  const history       = getHistory(d.id, selectedInc);
  const currentStatus = d.dispatch_status ?? RADIO_CODES.EN_ROUTE;
  const currentColor  = statusColor(currentStatus);

  return (
    <div className="border border-[#1f1f1f] rounded-xl overflow-hidden">

      {/* ── Header: fleet name, current status, dispatched time, update dropdown ── */}
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-red-600/10 border border-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Truck className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-semibold truncate">{fleetLabel}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded border ${currentColor}`}>
                {currentStatus}
              </span>
              <span className="text-gray-600 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {d.dispatched_at
                  ? format(new Date(d.dispatched_at), 'MMM d, h:mm a')
                  : 'Just dispatched'}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <select
            value=""
            onChange={e => { if (e.target.value) onStatusUpdate(d, e.target.value); }}
            className="bg-[#0a0a0a] border border-[#2a2a2a] text-gray-400 rounded-lg px-2 py-1.5 text-xs focus:border-red-600 outline-none flex-shrink-0">
            <option value="" disabled>Update status…</option>
            {BFP_STATUS_CODES.map(s => (
              <option key={s.code} value={s.label}>{s.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Collapsible status history timeline ──────────────────────────────── */}
      {history.length > 0 && (
        <>
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-t border-[#1f1f1f] text-xs text-gray-500 hover:text-gray-300 transition-all">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {history.length} status update{history.length !== 1 ? 's' : ''}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="px-4 py-3 bg-[#0a0a0a]">
              {history.map((entry, idx) => {
                const isLast = idx === history.length - 1;
                return (
                  <div key={idx} className="flex gap-3 pb-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full border mt-1 flex-shrink-0 ${
                        isLast ? 'bg-red-500 border-red-500' : 'bg-[#2a2a2a] border-[#3a3a3a]'
                      }`} />
                      {!isLast && <div className="w-px flex-1 bg-[#2a2a2a] mt-1" />}
                    </div>
                    {/* Entry content */}
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded border ${statusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {format(new Date(entry.ts), 'MMM d, h:mm:ss a')}
                        </span>
                      </div>
                      {entry.prev && (
                        <div className="text-gray-700 text-xs mt-0.5">← from {entry.prev}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Situational report (when present) ───────────────────────────────── */}
      {d.situational_report && (
        <div className="px-4 py-3 border-t border-[#1f1f1f] bg-[#0d0d0d]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Situational Report</div>
          <div className="text-gray-300 text-xs">{d.situational_report}</div>
        </div>
      )}

    </div>
  );
}

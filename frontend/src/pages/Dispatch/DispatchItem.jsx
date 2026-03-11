import { format } from 'date-fns';
import { Truck, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { DISPATCH_STATUS_FLOW, statusColor } from './constants';
import { getHistory } from './useDispatchManager';

export default function DispatchItem({
  dispatch: d,
  incident,
  isAdmin,
  selectedInc,
  onStatusUpdate,
  expanded,
  onToggle,
}) {
  const history       = getHistory(d.id, selectedInc);
  const currentStatus = d.dispatch_status ?? 'Dispatched';
  const isCompleted   = currentStatus === 'Completed';
  const nextStep      = DISPATCH_STATUS_FLOW[currentStatus];

  const responderName = d.responder
    ? d.responder.full_name + (d.responder.type_of_vehicle ? ` — ${d.responder.type_of_vehicle}` : '')
    : 'Responder Unit';

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-5 hover:border-red-600/20 transition-all">

      {/* ── Header row ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-white font-semibold">{responderName}</div>
            <div className="text-gray-500 text-xs font-mono">{d.id?.slice(-8).toUpperCase()}</div>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded border font-medium ${statusColor(currentStatus)}`}>
          {currentStatus}
        </span>
      </div>

      {/* ── Info cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
        <div className="bg-[#111] rounded-lg p-3">
          <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Incident</div>
          <div className="text-gray-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
            <span className="truncate">{incident?.location_text || '—'}</span>
          </div>
        </div>
        <div className="bg-[#111] rounded-lg p-3">
          <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Dispatched At</div>
          <div className="text-gray-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500 shrink-0" />
            <span>{d.check_in_time ? format(new Date(d.check_in_time), 'MMM d, h:mm a') : 'Just dispatched'}</span>
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      {d.situational_report && (
        <p className="text-gray-500 text-xs mb-4 border-l-2 border-red-600/40 pl-3">
          {d.situational_report}
        </p>
      )}

      {/* ── Status progression buttons ── */}
      {isAdmin && !isCompleted && nextStep && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onStatusUpdate(d, nextStep.value)}
            className={`text-xs px-3 py-1.5 rounded border transition-all ${nextStep.color}`}
          >
            {nextStep.label}
          </button>
          {nextStep.value !== 'Completed' && (
            <button
              onClick={() => onStatusUpdate(d, 'Completed')}
              className="text-xs px-3 py-1.5 rounded border border-green-600/40 text-green-400 hover:bg-green-600/10 transition-all"
            >
              Mark Completed
            </button>
          )}
        </div>
      )}

      {/* ── Collapsible history ── */}
      {history.length > 0 && (
        <>
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between mt-4 pt-3 border-t border-[#1f1f1f] text-xs text-gray-500 hover:text-gray-300 transition-all"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {history.length} status update{history.length !== 1 ? 's' : ''}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div className="pt-3 space-y-2">
              {history.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${idx === history.length - 1 ? 'bg-red-500' : 'bg-[#3a3a3a]'}`} />
                  <span className={`px-2 py-0.5 rounded border ${statusColor(entry.status)}`}>{entry.status}</span>
                  <span className="text-gray-600">{format(new Date(entry.ts), 'MMM d, h:mm:ss a')}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}

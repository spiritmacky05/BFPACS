// Helper for unified ACS status label (for future use)
function getResponderAcsStatusClass(acsStatus) {
  if (acsStatus === 'Serviceable') {
    return 'text-green-400 border-green-600/30 bg-green-600/10';
  }
  if (acsStatus && acsStatus.trim().toLowerCase() === 'acs activated') {
    return 'text-blue-400 border-blue-600/30 bg-blue-600/10';
  }
  return 'text-gray-400 border-gray-600/30 bg-gray-600/10';
}
/**
 * features/dispatch/components/DispatchCard.jsx
 *
 * One dispatch log card.
 *
 * Why this component exists:
 * - Keep list item rendering isolated and readable.
 * - Keep status action controls near the displayed record.
 */

import { format } from 'date-fns';
import { AlertTriangle, ChevronDown, Clock, Truck } from 'lucide-react';
import {
  DISPATCH_STATUS,
  DISPATCH_STATUS_FLOW,
  getDispatchStatusColor,
} from '../lib/dispatch.constants';
import { getDispatchHistory } from '../services/dispatchHistory.service';

const styles = {
  card: 'bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-5 hover:border-red-600/20 transition-all',
  headerRow: 'flex flex-wrap items-start justify-between gap-3 mb-4',
  responderWrap: 'flex items-center gap-3',
  iconBox: 'w-10 h-10 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center justify-center',
  icon: 'w-5 h-5 text-red-400',
  responderName: 'text-white font-semibold',
  responderId: 'text-gray-500 text-xs font-mono',
  statusBadge: 'text-xs px-3 py-1 rounded border font-medium',
  infoGrid: 'grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4',
  infoCard: 'bg-[#111] rounded-lg p-3',
  infoLabel: 'text-gray-600 text-xs uppercase tracking-wider mb-1',
  infoValueRow: 'text-gray-300 flex items-center gap-1',
  infoValueIconAlert: 'w-3 h-3 text-red-500 shrink-0',
  infoValueIconClock: 'w-3 h-3 text-gray-500 shrink-0',
  notes: 'text-gray-500 text-xs mb-4 border-l-2 border-red-600/40 pl-3',
  actionsWrap: 'flex gap-2 flex-wrap',
  actionButton: 'text-xs px-3 py-1.5 rounded border transition-all',
  completeButton:
    'text-xs px-3 py-1.5 rounded border border-green-600/40 text-green-400 hover:bg-green-600/10 transition-all',
  historyToggle:
    'w-full flex items-center justify-between mt-4 pt-3 border-t border-[#1f1f1f] text-xs text-gray-500 hover:text-gray-300 transition-all',
  historyToggleLabel: 'flex items-center gap-1.5',
  historyToggleIcon: 'w-3.5 h-3.5',
  historyWrap: 'pt-3 space-y-2',
  historyRow: 'flex items-center gap-3 text-xs',
  historyDot: 'w-2 h-2 rounded-full flex-shrink-0',
  historyDotActive: 'bg-red-500',
  historyDotInactive: 'bg-[#3a3a3a]',
  historyStatus: 'px-2 py-0.5 rounded border',
  historyTime: 'text-gray-600',
};

export default function DispatchCard({
  dispatch,
  incident,
  incidentId,
  isAdmin,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
}) {
  const statusLabel = dispatch.dispatch_status ?? DISPATCH_STATUS.DISPATCHED;
  const nextStatusStep = DISPATCH_STATUS_FLOW[statusLabel];
  const isCompleted = statusLabel === DISPATCH_STATUS.COMPLETED;
  const history = getDispatchHistory(dispatch.id, incidentId);

  const responderName = dispatch.responder
    ? `${dispatch.responder.full_name}${dispatch.responder.type_of_vehicle ? ` — ${dispatch.responder.type_of_vehicle}` : ''}`
    : 'Responder Unit';

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <div className={styles.responderWrap}>
          <div className={styles.iconBox}>
            <Truck className={styles.icon} />
          </div>

          <div>
            <div className={styles.responderName}>{responderName}</div>
            <div className={styles.responderId}>{dispatch.id?.slice(-8).toUpperCase()}</div>
          </div>
        </div>

        <span className={`${styles.statusBadge} ${getDispatchStatusColor(statusLabel)}`}>
          {statusLabel}
        </span>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <div className={styles.infoLabel}>Incident</div>
          <div className={styles.infoValueRow}>
            <AlertTriangle className={styles.infoValueIconAlert} />
            <span className='truncate'>{incident?.location_text || '—'}</span>
          </div>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoLabel}>Dispatched At</div>
          <div className={styles.infoValueRow}>
            <Clock className={styles.infoValueIconClock} />
            <span>
              {dispatch.check_in_time
                ? format(new Date(dispatch.check_in_time), 'MMM d, h:mm a')
                : 'Just dispatched'}
            </span>
          </div>
        </div>
      </div>

      {dispatch.situational_report ? (
        <p className={styles.notes}>{dispatch.situational_report}</p>
      ) : null}

      {isAdmin && !isCompleted && nextStatusStep ? (
        <div className={styles.actionsWrap}>
          <button
            type='button'
            onClick={() => onUpdateStatus(dispatch, nextStatusStep.value)}
            className={`${styles.actionButton} ${nextStatusStep.colorClass}`}
          >
            {nextStatusStep.label}
          </button>

          {nextStatusStep.value !== DISPATCH_STATUS.COMPLETED ? (
            <button
              type='button'
              onClick={() => onUpdateStatus(dispatch, DISPATCH_STATUS.COMPLETED)}
              className={styles.completeButton}
            >
              Mark Completed
            </button>
          ) : null}
        </div>
      ) : null}

      {history.length > 0 ? (
        <>
          <button
            type='button'
            onClick={onToggleExpand}
            className={styles.historyToggle}
          >
            <span className={styles.historyToggleLabel}>
              <Clock className={styles.historyToggleIcon} />
              {history.length} status update{history.length !== 1 ? 's' : ''}
            </span>

            <ChevronDown
              className={`${styles.historyToggleIcon} ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded ? (
            <div className={styles.historyWrap}>
              {history.map((entry, index) => {
                const isLatest = index === history.length - 1;

                return (
                  <div key={entry.ts + entry.status} className={styles.historyRow}>
                    <div
                      className={`${styles.historyDot} ${
                        isLatest ? styles.historyDotActive : styles.historyDotInactive
                      }`}
                    />

                    <span
                      className={`${styles.historyStatus} ${getDispatchStatusColor(
                        entry.status
                      )}`}
                    >
                      {entry.status}
                    </span>

                    <span className={styles.historyTime}>
                      {format(new Date(entry.ts), 'MMM d, h:mm:ss a')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

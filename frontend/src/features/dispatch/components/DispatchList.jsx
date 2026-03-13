/**
 * features/dispatch/components/DispatchList.jsx
 *
 * Dispatch log list section.
 */

import { ClipboardList, RefreshCw, Users } from 'lucide-react';
import DispatchCard from './DispatchCard';

const styles = {
  wrapper: 'bg-[#111] border border-[#1f1f1f] rounded-xl p-5',
  headerRow: 'flex items-center justify-between mb-5',
  title: 'text-white font-medium text-sm flex items-center gap-2',
  titleIcon: 'w-4 h-4 text-red-400',
  countBadge:
    'text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full',
  refreshButton:
    'p-1.5 rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white transition-all',
  refreshIcon: 'w-3.5 h-3.5',
  emptyWrap: 'text-center py-12',
  emptyIcon: 'w-10 h-10 text-gray-700 mx-auto mb-3',
  emptyText: 'text-gray-600 text-sm',
  list: 'space-y-4',
};

export default function DispatchList({
  dispatches,
  incident,
  incidentId,
  isAdmin,
  expandedRows,
  onToggleRow,
  onUpdateStatus,
  onRefresh,
}) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>
          <ClipboardList className={styles.titleIcon} />
          Dispatch Log

          {dispatches.length > 0 ? (
            <span className={styles.countBadge}>
              {dispatches.length} unit{dispatches.length !== 1 ? 's' : ''}
            </span>
          ) : null}
        </h3>

        <button type='button' onClick={onRefresh} className={styles.refreshButton}>
          <RefreshCw className={styles.refreshIcon} />
        </button>
      </div>

      {!dispatches.length ? (
        <div className={styles.emptyWrap}>
          <Users className={styles.emptyIcon} />
          <p className={styles.emptyText}>No dispatches for this incident</p>
        </div>
      ) : (
        <div className={styles.list}>
          {dispatches.map((dispatch) => (
            <DispatchCard
              key={dispatch.id}
              dispatch={dispatch}
              incident={incident}
              incidentId={incidentId}
              isAdmin={isAdmin}
              isExpanded={expandedRows[dispatch.id] ?? false}
              onToggleExpand={() => onToggleRow(dispatch.id)}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
}

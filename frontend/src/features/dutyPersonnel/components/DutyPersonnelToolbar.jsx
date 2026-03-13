import { Plus } from 'lucide-react';

const styles = {
  wrapper: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
  statsWrap: 'flex gap-4',
  statCard: 'bg-[#111] border border-[#1f1f1f] rounded-xl px-5 py-3 text-center',
  statValue: 'text-2xl font-bold text-white',
  statOnDutyLabel: 'text-xs text-green-400 uppercase tracking-widest',
  statOffDutyLabel: 'text-xs text-gray-500 uppercase tracking-widest',
  statTotalLabel: 'text-xs text-red-400 uppercase tracking-widest',
  addButton:
    'flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all',
  addIcon: 'w-4 h-4',
};

export default function DutyPersonnelToolbar({
  onDutyCount,
  offDutyCount,
  totalCount,
  canModify,
  onOpenCreate,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.statsWrap}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{onDutyCount}</div>
          <div className={styles.statOnDutyLabel}>On Duty</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{offDutyCount}</div>
          <div className={styles.statOffDutyLabel}>Off Duty</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalCount}</div>
          <div className={styles.statTotalLabel}>Total</div>
        </div>
      </div>

      {canModify ? (
        <button type='button' onClick={onOpenCreate} className={styles.addButton}>
          <Plus className={styles.addIcon} />
          Add Personnel
        </button>
      ) : null}
    </div>
  );
}

/**
 * features/incidents/components/IncidentsToolbar.jsx
 *
 * Presentational toolbar for filters + view switch + create action.
 *
 * Why split this out:
 * - Keeps page JSX smaller.
 * - Makes toolbar reusable for archived/all incidents screens.
 */

import { Grid, List, Plus } from 'lucide-react';

const STATUS_FILTERS = ['All', 'Active', 'Controlled', 'Fire Out', 'Done'];

const styles = {
  wrapper: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between',
  filtersRow: 'flex gap-2 flex-wrap',
  filterButtonBase: 'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
  filterButtonActive: 'bg-red-600 border-red-600 text-white',
  filterButtonInactive: 'border-[#1f1f1f] text-gray-400 hover:border-red-600/40 hover:text-white',
  rightControls: 'flex items-center gap-2',
  viewToggleContainer: 'flex gap-1 border border-[#1f1f1f] rounded-lg p-1 bg-[#0a0a0a]',
  viewToggleButton: 'p-1.5 rounded transition-all',
  viewToggleActive: 'bg-red-600/20 text-red-400',
  viewToggleInactive: 'text-gray-500 hover:text-gray-300',
  createButton: 'flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all',
};

export default function IncidentsToolbar({
  selectedStatusFilter,
  onSelectStatusFilter,
  viewMode,
  onChangeViewMode,
  canCreate,
  onOpenCreate,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.filtersRow}>
        {STATUS_FILTERS.map((statusFilter) => {
          const isSelected = selectedStatusFilter === statusFilter;

          return (
            <button
              key={statusFilter}
              type="button"
              onClick={() => onSelectStatusFilter(statusFilter)}
              className={`${styles.filterButtonBase} ${
                isSelected ? styles.filterButtonActive : styles.filterButtonInactive
              }`}
            >
              {statusFilter}
            </button>
          );
        })}
      </div>

      <div className={styles.rightControls}>
        <div className={styles.viewToggleContainer}>
          <button
            type="button"
            onClick={() => onChangeViewMode('card')}
            className={`${styles.viewToggleButton} ${
              viewMode === 'card' ? styles.viewToggleActive : styles.viewToggleInactive
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('table')}
            className={`${styles.viewToggleButton} ${
              viewMode === 'table' ? styles.viewToggleActive : styles.viewToggleInactive
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {canCreate && (
          <button type="button" onClick={onOpenCreate} className={styles.createButton}>
            <Plus className="w-4 h-4" />
            Report Incident
          </button>
        )}
      </div>
    </div>
  );
}

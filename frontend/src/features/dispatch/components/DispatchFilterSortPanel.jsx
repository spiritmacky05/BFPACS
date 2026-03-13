/**
 * features/dispatch/components/DispatchFilterSortPanel.jsx
 *
 * Shared location filter/sort panel used by Dispatch, Duty Personnel, and Equipment pages.
 */

import { Filter } from 'lucide-react';

const styles = {
  wrapper: 'bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4 mb-4',
  header: 'flex items-center gap-2 mb-3',
  headerIcon: 'w-3.5 h-3.5 text-red-400',
  headerText: 'text-gray-400 text-xs font-semibold uppercase tracking-widest',
  filtersGrid: 'grid grid-cols-2 md:grid-cols-4 gap-3 mb-3',
  filterLabel: 'block text-gray-600 text-xs mb-1',
  filterSelect:
    'bg-[#0a0a0a] border border-[#2a2a2a] text-gray-300 rounded-lg px-3 py-2 text-xs focus:border-red-600 outline-none w-full',
  sortRow: 'flex flex-wrap items-center gap-2',
  sortLabel: 'text-gray-600 text-xs',
  clearButton:
    'ml-auto text-xs text-red-400 hover:text-red-300 border border-red-600/30 px-2.5 py-1 rounded-lg transition-all',
};

function getSortButtonClass(isActive) {
  const baseClass = 'text-xs px-3 py-1 rounded border transition-all';
  const activeClass = 'border-red-600/50 text-red-400 bg-red-600/10';
  const inactiveClass =
    'border-[#2a2a2a] text-gray-500 hover:text-gray-300 hover:border-[#3a3a3a]';

  return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
}

export default function DispatchFilterSortPanel({
  stationOptions,
  cityOptions,
  districtOptions,
  regionOptions,
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
}) {
  const hasFilters =
    Boolean(filters.station) ||
    Boolean(filters.city) ||
    Boolean(filters.district) ||
    Boolean(filters.region);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Filter className={styles.headerIcon} />
        <span className={styles.headerText}>Filter &amp; Sort</span>
      </div>

      <div className={styles.filtersGrid}>
        <div>
          <label className={styles.filterLabel}>Station</label>
          <select
            value={filters.station}
            onChange={(event) => onFilterChange('station', event.target.value)}
            className={styles.filterSelect}
          >
            <option value=''>All Stations</option>
            {stationOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.filterLabel}>City / Municipality</label>
          <select
            value={filters.city}
            onChange={(event) => onFilterChange('city', event.target.value)}
            className={styles.filterSelect}
          >
            <option value=''>All Cities</option>
            {cityOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.filterLabel}>District</label>
          <select
            value={filters.district}
            onChange={(event) => onFilterChange('district', event.target.value)}
            className={styles.filterSelect}
          >
            <option value=''>All Districts</option>
            {districtOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.filterLabel}>Region</label>
          <select
            value={filters.region}
            onChange={(event) => onFilterChange('region', event.target.value)}
            className={styles.filterSelect}
          >
            <option value=''>All Regions</option>
            {regionOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.sortRow}>
        <span className={styles.sortLabel}>Sort by:</span>

        {['station', 'city', 'district', 'region'].map((field) => (
          <button
            key={field}
            type='button'
            onClick={() => onSortChange(field)}
            className={getSortButtonClass(sortBy === field)}
          >
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </button>
        ))}

        {(hasFilters || sortBy) && (
          <button
            type='button'
            onClick={() => {
              onFilterChange('all', '');
              onSortChange('');
            }}
            className={styles.clearButton}
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}

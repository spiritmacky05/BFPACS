import { Filter } from 'lucide-react';

const selectCls = 'bg-[#0a0a0a] border border-[#2a2a2a] text-gray-300 rounded-lg px-3 py-2 text-xs focus:border-red-600 outline-none w-full';
const sortBtn   = (active) => `text-xs px-3 py-1 rounded border transition-all ${active ? 'border-red-600/50 text-red-400 bg-red-600/10' : 'border-[#2a2a2a] text-gray-500 hover:text-gray-300 hover:border-[#3a3a3a]'}`;

export default function FilterSortPanel({ stationOptions, cityOptions, districtOptions, regionOptions, filters, onFilterChange, sortBy, onSortChange }) {
  const hasFilter = filters.station || filters.city || filters.district || filters.region;

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-3.5 h-3.5 text-red-400" />
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Filter &amp; Sort</span>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-gray-600 text-xs mb-1">Station</label>
          <select value={filters.station} onChange={e => onFilterChange('station', e.target.value)} className={selectCls}>
            <option value="">All Stations</option>
            {stationOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-600 text-xs mb-1">City / Municipality</label>
          <select value={filters.city} onChange={e => onFilterChange('city', e.target.value)} className={selectCls}>
            <option value="">All Cities</option>
            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-600 text-xs mb-1">District</label>
          <select value={filters.district} onChange={e => onFilterChange('district', e.target.value)} className={selectCls}>
            <option value="">All Districts</option>
            {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-600 text-xs mb-1">Region</label>
          <select value={filters.region} onChange={e => onFilterChange('region', e.target.value)} className={selectCls}>
            <option value="">All Regions</option>
            {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Sort by + Clear */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-600 text-xs">Sort by:</span>
        {['station', 'city', 'district', 'region'].map(field => (
          <button key={field} onClick={() => onSortChange(field)} className={sortBtn(sortBy === field)}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </button>
        ))}
        {(hasFilter || sortBy) && (
          <button
            onClick={() => { onFilterChange('all', ''); onSortChange(''); }}
            className="ml-auto text-xs text-red-400 hover:text-red-300 border border-red-600/30 px-2.5 py-1 rounded-lg transition-all"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}

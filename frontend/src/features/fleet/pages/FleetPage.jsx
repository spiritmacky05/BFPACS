/**
 * features/fleet/pages/FleetPage.jsx
 *
 * Fleet management — shows registered users as responder units with ACS status tracking.
 */

import React from 'react';
import { Truck, Search, Filter } from 'lucide-react';
import { ACS_STATUSES, ACS_STATUS_COLORS, ACS_STATUS_LABELS } from '@/features/shared/components/acsStatus';
import FleetUnitCard from '../components/FleetUnitCard';
import FleetUnitModal from '../components/FleetUnitModal';
import { useFleet } from '../hooks/useFleet';

const STATUS_FILTERS = ["All", ...ACS_STATUSES];

export default function FleetPage() {
  const {
    respondersLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    editingUnit,
    setEditingUnit,
    loadResponders,
    canEdit,
    isOwnUnit,
    handleStatusChange,
    filtered,
    counts,
  } = useFleet();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {ACS_STATUSES.map(key => (
          <div key={key} className={`border rounded-xl p-4 text-center ${ACS_STATUS_COLORS[key]}`}>
            <div className="text-3xl font-bold">{counts[key]}</div>
            <div className="text-xs mt-1 font-medium">{ACS_STATUS_LABELS[key]}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, vehicle type..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-[#1f1f1f] text-white rounded-lg text-sm focus:border-red-500 outline-none placeholder-gray-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === s
                  ? "bg-red-600 text-white border-red-600"
                  : "text-gray-400 border-[#2a2a2a] hover:border-red-500"
              }`}
            >
              {s === "All" ? "All" : ACS_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Responder Units Table */}
      {respondersLoading ? (
        <div className="text-center text-gray-500 py-16">Loading fleet data...</div>
      ) : !filtered.length ? (
        <div className="text-center text-gray-500 py-16">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No fleet units found</p>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                  {["Responder / Unit", "Vehicle Type", "Capacity", "Station Commander", "ACS Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151515]">
                {filtered.map(unit => (
                  <FleetUnitCard
                    key={unit.id}
                    unit={unit}
                    canEdit={canEdit(unit)}
                    isOwnUnit={isOwnUnit(unit)}
                    statusColors={ACS_STATUS_COLORS}
                    statusLabels={ACS_STATUS_LABELS}
                    onStatusChange={handleStatusChange}
                    onEdit={() => setEditingUnit(unit)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUnit && (
        <FleetUnitModal
          unit={editingUnit}
          onClose={() => setEditingUnit(null)}
          onSaved={() => { setEditingUnit(null); loadResponders(); }}
        />
      )}
    </div>
  );
}

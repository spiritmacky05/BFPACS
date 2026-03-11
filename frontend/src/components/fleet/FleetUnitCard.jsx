import { Truck, Users, Edit2, Radio, CheckCircle } from "lucide-react";

export default function FleetUnitCard({ unit, canEdit, isOwnUnit, statusColors, statusLabels, onStatusChange, onEdit }) {
  const acsStatus = unit.acs_status || "Serviceable";

  return (
    <tr className={`hover:bg-white/[0.02] transition-all ${isOwnUnit ? "bg-blue-500/5" : ""}`}>
      {/* Responder */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              {unit.full_name}
              {isOwnUnit && <span className="ml-2 text-xs text-blue-400 font-normal">(You)</span>}
            </div>
            <div className="text-gray-500 text-xs">{unit.engine_number || unit.plate_number || unit.email || "—"}</div>
          </div>
        </div>
      </td>

      {/* Vehicle Type */}
      <td className="px-4 py-4 text-gray-300 text-sm">
        {unit.type_of_vehicle || <span className="text-gray-500">—</span>}
      </td>

      {/* Capacity */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Users className="w-3.5 h-3.5" />
          {unit.fire_truck_capacity ?? <span className="text-gray-500">—</span>}
        </div>
      </td>

      {/* Station Commander */}
      <td className="px-4 py-4 text-gray-400 text-sm">
        {unit.station_commander || <span className="text-gray-500">—</span>}
      </td>

      {/* ACS Status */}
      <td className="px-4 py-4">
        <span className={`text-xs px-2 py-1 rounded border font-medium ${statusColors[acsStatus] || ''}`}>
          {statusLabels[acsStatus] || acsStatus}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStatusChange(unit.id, 'ACS Activated')}
              disabled={acsStatus === 'ACS Activated'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-blue-400 border-blue-600/40 hover:bg-blue-600/10"
            >
              <Radio className="w-3 h-3" /> ACS Activated
            </button>
            <button
              onClick={() => onStatusChange(unit.id, 'Serviceable')}
              disabled={acsStatus === 'Serviceable'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-green-400 border-green-600/40 hover:bg-green-600/10"
            >
              <CheckCircle className="w-3 h-3" /> Serviceable
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-500 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

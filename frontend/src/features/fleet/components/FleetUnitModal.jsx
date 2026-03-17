import { useState } from "react";
import { X, Truck } from "lucide-react";
import { ACS_STATUSES } from "@/features/shared/components/acsStatus";
import { superadminApi } from "@/features/superadmin";

export default function FleetUnitModal({ unit, onClose, onSaved }) {
  const [form, setForm] = useState({
    type_of_vehicle: unit.type_of_vehicle || "",
    fire_truck_capacity: unit.fire_truck_capacity || "",
    station_commander: unit.station_commander || "",
    station_contact_number: unit.station_contact_number || "",
    city_fire_marshal: unit.city_fire_marshal || "",
    acs_status: unit.acs_status || "Serviceable",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superadminApi.updateUser(unit.id, {
        ...form,
        fire_truck_capacity: form.fire_truck_capacity ? Number(form.fire_truck_capacity) : null,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-500 outline-none placeholder-gray-600"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-400" /> Edit Fleet Unit
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">{unit.full_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {field("Vehicle Type", "type_of_vehicle", "text", "e.g. Pumper, Ladder, Tanker")}
          {field("Personnel Capacity", "fire_truck_capacity", "number", "e.g. 6")}
          {field("Station Commander", "station_commander", "text", "Name of station commander")}
          {field("Station Contact Number", "station_contact_number", "text", "e.g. +63 912 345 6789")}
          {field("City Fire Marshal", "city_fire_marshal", "text", "Name of city fire marshal")}

          <div>
            <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1">ACS Status</label>
            <select
              value={form.acs_status}
              onChange={e => setForm(f => ({ ...f, acs_status: e.target.value }))}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-500 outline-none"
            >
              {ACS_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

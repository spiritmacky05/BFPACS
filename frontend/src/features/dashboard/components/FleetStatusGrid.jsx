import { useState } from "react";
import { Truck, MapPin, X, AlertTriangle, Check } from "lucide-react";
import { fleetApi } from "@/api/fleet/fleet";

const statusColors = {
  Available: "text-green-400 bg-green-600/10 border-green-600/30",
  Serviceable: "text-green-400 bg-green-600/10 border-green-600/30",
  Deployed: "text-red-400 bg-red-600/10 border-red-600/30",
  Dispatched: "text-red-400 bg-red-600/10 border-red-600/30",
  "Under Maintenance": "text-yellow-400 bg-yellow-600/10 border-yellow-600/30",
  "Out of Service": "text-gray-400 bg-gray-600/10 border-gray-600/30",
};

export default function FleetStatusGrid({ trucks, incidents = [], isAdmin = false, onAssigned }) {
  const [assigning, setAssigning] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState("");

  const activeIncidents = incidents.filter(i => i.incident_status === "Active");

  const getAssignedIncident = (truck) => {
    if (!truck.current_incident_id) return null;
    return incidents.find(i => i.id === truck.current_incident_id) || null;
  };

  const handleAssign = async () => {
    if (!assigning || !selectedIncident) return;
    setSaving(true);
    await fleetApi.update(assigning.id, {
      status: "Dispatched",
    });
    setSaving(false);
    setAssigning(null);
    setSelectedIncident("");
    if (onAssigned) onAssigned();
  };

  const handleUnassign = async (truck) => {
    await fleetApi.update(truck.id, {
      status: "Serviceable",
    });
    if (onAssigned) onAssigned();
  };

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Truck className="w-4 h-4 text-red-400" /> Fleet Status
      </h3>
      {!trucks?.length ? (
        <p className="text-gray-600 text-sm text-center py-8">No fleet units registered</p>
      ) : (
        <div className="space-y-3">
          {trucks.map(truck => {
            const assignedInc = getAssignedIncident(truck);
            return (
              <div key={truck.id} className="border border-[#1f1f1f] rounded-lg p-3 hover:border-[#2a2a2a] transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Truck className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-white text-sm font-bold truncate">{truck.engine_code || truck.unit_code}</span>
                    <span className="text-gray-600 text-xs hidden sm:inline">· {truck.vehicle_type || truck.truck_type}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${statusColors[truck.status] || statusColors.Available}`}>
                    {truck.status}
                  </span>
                </div>

                {truck.station && (
                  <div className="flex items-center gap-1 text-gray-600 text-xs mt-1.5">
                    <MapPin className="w-3 h-3" /> {truck.station}
                  </div>
                )}

                {assignedInc && (
                  <div className="mt-2 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-red-400 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> Assigned Incident
                      </div>
                      <div className="text-gray-300 text-xs mt-0.5 truncate">{assignedInc.response_type || assignedInc.occupancy_type} — {assignedInc.location_text}</div>
                      <div className="text-gray-500 text-xs">{assignedInc.alarm_status}</div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleUnassign(truck)} title="Unassign"
                        className="text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {isAdmin && !assignedInc && (truck.status === "Available" || truck.status === "Serviceable") && activeIncidents.length > 0 && (
                  <button
                    onClick={() => { setAssigning(truck); setSelectedIncident(""); }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/50 px-2 py-1 rounded transition-all"
                  >
                    + Assign Incident
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {assigning && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-red-400" /> Assign Incident to {assigning.engine_code || assigning.unit_code}
              </h3>
              <button onClick={() => setAssigning(null)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Select Active Incident</label>
              {activeIncidents.length === 0 ? (
                <p className="text-gray-600 text-sm">No active incidents available.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activeIncidents.map(inc => (
                    <button
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                        selectedIncident === inc.id
                          ? "border-red-600/60 bg-red-600/10"
                          : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-white text-sm font-medium truncate">{inc.response_type || inc.occupancy_type}</div>
                          <div className="text-gray-500 text-xs truncate">{inc.location_text}</div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-xs text-yellow-400">{inc.alarm_status}</span>
                          {selectedIncident === inc.id && <Check className="w-4 h-4 text-green-400" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-[#1f1f1f] flex justify-end gap-3">
              <button onClick={() => setAssigning(null)}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={handleAssign} disabled={!selectedIncident || saving}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

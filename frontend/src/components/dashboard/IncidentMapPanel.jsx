import { useState, useEffect } from "react";
import { MapPin, Users, Truck, Shield } from "lucide-react";

export default function IncidentMapPanel({ incident, trucks, checkins, personnel }) {
  const [unitCount, setUnitCount] = useState(0);
  const [personnelCount, setPersonnelCount] = useState(0);
  
  useEffect(() => {
    if (!incident) return;

    // Count dispatched trucks for this incident
    const dispatchedUnits = trucks.filter(t => t.current_incident_id === incident.id).length;
    setUnitCount(dispatchedUnits);

    // Count personnel checked in for this incident
    const checkedInPersonnel = checkins.filter(c => c.incident_id === incident.id && c.type !== "Check-Out").length;
    setPersonnelCount(checkedInPersonnel);
  }, [incident, trucks, checkins]);

  if (!incident) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
        <p className="text-gray-500 text-sm">No active incident selected</p>
      </div>
    );
  }

  const groundCommanderInfo = personnel.find(p => p.full_name === incident.ground_commander);

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="w-full h-96 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center relative">
          {/* Simple map placeholder with incident location */}
          <div className="text-center space-y-2">
            <MapPin className="w-12 h-12 text-red-500 mx-auto" />
            <div className="text-white font-semibold text-sm">{incident.location_text}</div>
            <div className="text-gray-500 text-xs">
              {incident.lat && incident.lng
                ? `${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}`
                : "Location coordinates not available"}
            </div>
            {incident.lat && incident.lng && (
              <a
                href={`https://maps.google.com/?q=${incident.lat},${incident.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 text-xs mt-2 inline-block"
              >
                Open in Maps →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-500 text-xs uppercase tracking-wider">Units</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{unitCount}</div>
          <div className="text-gray-600 text-xs mt-1">responding</div>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-gray-500 text-xs uppercase tracking-wider">Personnel</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{personnelCount}</div>
          <div className="text-gray-600 text-xs mt-1">on scene</div>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-gray-500 text-xs uppercase tracking-wider">Status</span>
          </div>
          <div className={`text-sm font-bold ${incident.incident_status === 'Active' ? 'text-red-400' : incident.incident_status === 'Controlled' ? 'text-yellow-400' : 'text-green-400'}`}>
            {incident.incident_status}
          </div>
          <div className="text-gray-600 text-xs mt-1">{incident.alarm_status || "—"}</div>
        </div>
      </div>

      {/* Ground Commander Info */}
      {incident.ground_commander && (
        <div className="bg-gradient-to-r from-green-950/20 to-[#0d0d0d] border border-green-900/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 border border-green-600/40 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="text-gray-500 text-xs uppercase tracking-wider">Ground Commander</div>
              <div className="text-white font-semibold text-sm">{incident.ground_commander}</div>
              {groundCommanderInfo && (
                <div className="text-gray-600 text-xs mt-0.5">
                  {groundCommanderInfo.rank} • {groundCommanderInfo.badge_number}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ICS Commander Info */}
      {incident.ics_commander && (
        <div className="bg-gradient-to-r from-purple-950/20 to-[#0d0d0d] border border-purple-900/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 border border-purple-600/40 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="text-gray-500 text-xs uppercase tracking-wider">ICS Commander</div>
              <div className="text-white font-semibold text-sm">{incident.ics_commander}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
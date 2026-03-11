import { useState, useEffect } from "react";
import { MapPin, Users, Truck, Shield, Navigation } from "lucide-react";
import MapView from "@/components/common/MapView/MapView";
import { hydrantsApi } from "@/api/hydrants/hydrants";
import { useMyStation } from "@/hooks/useMyStation/useMyStation";

export default function IncidentMapPanel({ incident, trucks, checkins, personnel }) {
  const [unitCount, setUnitCount] = useState(0);
  const [personnelCount, setPersonnelCount] = useState(0);
  const [nearbyHydrants, setNearbyHydrants] = useState([]);
  const myStation = useMyStation();
  
  useEffect(() => {
    if (!incident) return;

    // Count dispatched trucks for this incident
    const dispatchedUnits = trucks.filter(t => t.current_incident_id === incident.id).length;
    setUnitCount(dispatchedUnits);

    // Count personnel checked in for this incident
    const checkedInPersonnel = checkins.filter(c => c.incident_id === incident.id && c.type !== "Check-Out").length;
    setPersonnelCount(checkedInPersonnel);

    // Fetch nearby hydrants if we have coordinates
    if (incident.lat && incident.lng) {
      hydrantsApi.nearby(incident.lat, incident.lng, 2000)
        .then(data => setNearbyHydrants(data ?? []))
        .catch(() => setNearbyHydrants([]));
    }
  }, [incident, trucks, checkins]);

  if (!incident) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
        <p className="text-gray-500 text-sm">No active incident selected</p>
      </div>
    );
  }

  const groundCommanderInfo = personnel.find(p => p.full_name === incident.ground_commander);

  // Build map markers: incident + nearby hydrants
  const markers = [];
  if (incident.lat && incident.lng) {
    markers.push({
      type: 'incident',
      lat: incident.lat,
      lng: incident.lng,
      label: incident.location_text || 'Fire Location',
      sub: `${incident.alarm_status || ''} — ${incident.incident_status}`,
    });
    nearbyHydrants.forEach(h => {
      if (h.lat != null && h.lng != null) {
        markers.push({
          type: 'hydrant',
          lat: h.lat,
          lng: h.lng,
          label: h.address_text || h.address || 'Hydrant',
          sub: `${h.hydrant_type || 'Hydrant'} • ${h.status} ${h.psi ? `• ${h.psi} PSI` : ''}`,
          status: h.status,
          distance: h.distance_meters,
        });
      }
    });
    // Add user's station marker
    if (myStation?.lat != null && myStation?.lng != null) {
      markers.push({
        type: 'station',
        lat: myStation.lat,
        lng: myStation.lng,
        label: myStation.station_name || 'Your Station',
        sub: myStation.address_text || myStation.city || '',
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      {incident.lat && incident.lng ? (
        <div>
          <MapView markers={markers} height="400px" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* Navigate buttons */}
            {(() => {
              const origin = myStation?.lat != null && myStation?.lng != null
                ? `${myStation.lat},${myStation.lng}` : '';
              const dest = `${incident.lat},${incident.lng}`;
              const googleUrl = origin
                ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`
                : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
              const wazeUrl = `https://waze.com/ul?ll=${dest}&navigate=yes`;
              return (
                <>
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    <Navigation className="w-4 h-4" /> Navigate (Google Maps)
                  </a>
                  <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    <Navigation className="w-4 h-4" /> Navigate (Waze)
                  </a>
                </>
              );
            })()}
            {nearbyHydrants.length > 0 && (
              <span className="text-xs text-blue-400">
                🔵 {nearbyHydrants.length} hydrant{nearbyHydrants.length !== 1 ? 's' : ''} within 2km
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="w-full h-96 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="w-12 h-12 text-red-500 mx-auto" />
              <div className="text-white font-semibold text-sm">{incident.location_text}</div>
              <div className="text-gray-500 text-xs">Location coordinates not available</div>
            </div>
          </div>
        </div>
      )}

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
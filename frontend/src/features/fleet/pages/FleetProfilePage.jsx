/**
 * features/fleet/pages/FleetProfilePage.jsx
 *
 * Full profile page for a single fleet unit.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Truck, CheckCircle2, MapPin, Search } from 'lucide-react';
import { superadminApi } from '@/features/superadmin';
import { stationsApi } from '@/features/stations/api/stations.api.js';
import MapView from '@/features/shared/components/MapView';

export default function FleetProfilePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get('id');

  const [unit, setUnit] = useState(null);
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        // Fetch all users to find the fleet unit
        const allUsers = await superadminApi.listUsers();
        const foundUnit = allUsers.find(u => u.id === id);
        
        if (foundUnit) {
          setUnit(foundUnit);
          
          if (foundUnit.station_id) {
            const st = await stationsApi.getById(foundUnit.station_id).catch(() => null);
            setStation(st?.data || st); // Axios returns { data } or direct depending on setup
          }
        }
      } catch (err) {
        console.error("Failed to load fleet profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className="text-center text-gray-500 py-20">Loading profile…</div>;
  }

  if (!unit) {
    return <div className="text-center text-gray-600 py-20">Fleet unit not found.</div>;
  }

  // Determine Map markers
  const mapMarkers = [];
  if (station && station.lat != null && station.lng != null) {
    mapMarkers.push({
      type: 'station',
      lat: station.lat,
      lng: station.lng,
      label: station.station_name,
      sub: [station.address_text, station.city, station.district].filter(Boolean).join(', '),
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 md:p-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-all mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile Card */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0">
              <Truck className="w-8 h-8 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-2xl leading-tight">{unit.full_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-gray-400 text-sm">{unit.type_of_vehicle || 'No vehicle type'}</span>
                <span className={`text-xs px-2 py-0.5 rounded border font-medium bg-gray-600/10 border-gray-600/30 text-gray-400`}>
                  {unit.acs_status || 'Serviceable'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1f1f1f] mt-5 pt-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Engine Number</div>
                <div className="text-white text-sm font-medium">{unit.engine_number || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Plate Number</div>
                <div className="text-white text-sm font-medium">{unit.plate_number || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Capacity</div>
                <div className="text-white text-sm font-medium">{unit.fire_truck_capacity ? `${unit.fire_truck_capacity} pax` : '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Station Commander</div>
                <div className="text-white text-sm font-medium">{unit.station_commander || '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Assigned Station</div>
                <div className="text-white text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-400" />
                  {station ? station.station_name : 'No Station Assigned'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden p-6 space-y-4">
        <h3 className="text-white font-medium text-sm flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-400" /> Station Location Map
        </h3>
        
        {mapMarkers.length > 0 ? (
          <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
            <MapView markers={mapMarkers} height="350px" zoom={16} />
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl h-48 flex items-center justify-center">
            <div className="text-center text-gray-600 text-sm flex flex-col items-center">
              <MapPin className="w-8 h-8 mb-2 opacity-30" />
              {station ? 'Station has no GPS coordinates set.' : 'Fleet unit has no assigned station.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

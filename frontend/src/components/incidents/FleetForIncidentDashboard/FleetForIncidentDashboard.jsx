import { useState, useEffect } from "react";
import { dispatchesApi } from "@/api/dispatches/dispatches";
import { checkinApi }    from "@/api/checkin/checkin";
import { User, Users }   from "lucide-react";

const statusColors = {
  '10-70 En Route':         'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  '10-23 Arrived at Scene': 'text-blue-400   bg-blue-600/10   border-blue-600/30',
  'Controlled':             'text-orange-400 bg-orange-600/10 border-orange-600/30',
  'Fire Out':               'text-red-400    bg-red-600/10    border-red-600/30',
  '10-41 Beginning Tour':   'text-green-400  bg-green-600/10  border-green-600/30',
  '10-42 Ending Tour':      'text-gray-400   bg-gray-600/10   border-gray-600/30',
};

export default function FleetForIncidentDashboard({ incidentId }) {
  const [dispatched,    setDispatched]    = useState([]);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!incidentId) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const [dispatchData, checkIns] = await Promise.all([
          dispatchesApi.getByIncident(incidentId),
          checkinApi.getLogsForIncident(incidentId).catch(() => []),
        ]);
        setDispatched(dispatchData ?? []);
        const unique = new Set((checkIns ?? []).map(c => c.personnel_id).filter(Boolean));
        setTotalCheckIns(unique.size);
      } catch (error) {
        console.error('Error fetching dispatched responders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Users className="w-3.5 h-3.5" /> Dispatched Responders
        </div>
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!dispatched.length) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Users className="w-3.5 h-3.5" /> Dispatched Responders
        </div>
        <div className="text-gray-600 text-sm">No responders dispatched to this incident.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
        <Users className="w-3.5 h-3.5" /> Dispatched Responders
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{dispatched.length}</div>
          <div className="text-xs text-gray-500 mt-1">Responders Dispatched</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{totalCheckIns}</div>
          <div className="text-xs text-gray-500 mt-1">Personnel On-Scene (NFC/PIN)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {dispatched.map(d => {
          const p      = d.personnel;
          const status = d.dispatch_status ?? '10-70 En Route';
          const color  = statusColors[status] ?? 'text-gray-400 bg-gray-600/10 border-gray-600/30';
          return (
            <div key={d.id} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-red-600/10 border border-red-600/20 rounded flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-red-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-xs font-semibold truncate">
                    {p ? p.full_name : 'Unknown'}
                  </div>
                  <div className="text-gray-500 text-xs">{p ? p.rank : '—'}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${color}`}>
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const truckTypeColors = {
  Pumper: "text-blue-400 bg-blue-600/10 border-blue-600/30",
  Ladder: "text-yellow-400 bg-yellow-600/10 border-yellow-600/30",
  Tanker: "text-purple-400 bg-purple-600/10 border-purple-600/30",
  Rescue: "text-green-400 bg-green-600/10 border-green-600/30",
  Command: "text-red-400 bg-red-600/10 border-red-600/30",
};

const statusColors = {
  Available: "text-gray-400 bg-gray-600/10 border-gray-600/30",
  Serviceable: "text-green-400 bg-green-600/10 border-green-600/30",
  Deployed: "text-red-400 bg-red-600/10 border-red-600/30",
  "Under Maintenance": "text-orange-400 bg-orange-600/10 border-orange-600/30",
  "Out of Service": "text-gray-500 bg-gray-600/10 border-gray-600/30",
};

export default function FleetForIncidentDashboard({ incidentId }) {
  const [trucks, setTrucks] = useState([]);
  const [totalPersonnel, setTotalPersonnel] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const dispatches = await dispatchesApi.getByIncident(incidentId);

        // Fetch truck details for each dispatch
        const truckIds = (dispatches || []).map(d => d.fleet_id).filter(Boolean);
        const truckPromises = truckIds.map(id => fleetApi.getById(id).catch(() => null));
        const truckData = await Promise.all(truckPromises);
        setTrucks(truckData.filter(t => t));

        // Fetch check-in logs for personnel count
        const checkIns = await checkinApi.getLogsForIncident(incidentId);
        const uniquePersonnel = new Set((checkIns || []).map(c => c.personnel_id).filter(Boolean));
        setTotalPersonnel(uniquePersonnel.size);
      } catch (error) {
        console.error("Error fetching fleet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Truck className="w-3.5 h-3.5" /> Fleet Asset
        </div>
        <div className="text-gray-500 text-sm">Loading fleet data...</div>
      </div>
    );
  }

  if (!trucks || trucks.length === 0) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Truck className="w-3.5 h-3.5" /> Fleet Asset
        </div>
        <div className="text-gray-600 text-sm">No vehicles dispatched to this incident.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
        <Truck className="w-3.5 h-3.5" /> Fleet Asset
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{totalPersonnel}</div>
          <div className="text-xs text-gray-500 mt-1">Total Personnel On-Scene</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{trucks.length}</div>
          <div className="text-xs text-gray-500 mt-1">Vehicles Dispatched</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {trucks.map(truck => (
          <div key={truck.id} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3">
            <div className="text-xs font-mono text-gray-500 mb-2">{truck.engine_code}</div>
            <div className="mb-2">
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${truckTypeColors[truck.vehicle_type] || truckTypeColors.Pumper}`}>
                {truck.vehicle_type}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-2">{truck.plate_number}</div>
            <div>
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${statusColors[truck.status] || statusColors.Available}`}>
                {truck.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
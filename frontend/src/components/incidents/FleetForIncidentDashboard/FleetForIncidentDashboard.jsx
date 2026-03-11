import { useState, useEffect } from "react";
import { dispatchesApi } from "@/api/dispatches/dispatches";
import { checkinApi }    from "@/api/checkin/checkin";
import { Truck }         from "lucide-react";

const dispatchStatusColors = {
  'Dispatched': 'text-red-400    bg-red-600/10    border-red-600/30',
  'En Route':   'text-orange-400 bg-orange-600/10 border-orange-600/30',
  'On Scene':   'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Returning':  'text-blue-400   bg-blue-600/10   border-blue-600/30',
  'Completed':  'text-green-400  bg-green-600/10  border-green-600/30',
  // legacy
  'Fire Out':               'text-red-400    bg-red-600/10    border-red-600/30',
  '10-23 Arrived at Scene': 'text-blue-400   bg-blue-600/10   border-blue-600/30',
  'Controlled':             'text-orange-400 bg-orange-600/10 border-orange-600/30',
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

        const dispatches = dispatchData ?? [];

        setDispatched(dispatches);
        const unique = new Set((checkIns ?? []).map(c => c.personnel_id).filter(Boolean));
        setTotalCheckIns(unique.size);
      } catch (error) {
        console.error('Error fetching fleet dispatch data:', error);
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
        <div className="text-gray-500 text-sm">Loading fleet data…</div>
      </div>
    );
  }

  if (!dispatched.length) {
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
          <div className="text-2xl font-bold text-red-400">{dispatched.length}</div>
          <div className="text-xs text-gray-500 mt-1">Vehicles Dispatched</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{totalCheckIns}</div>
          <div className="text-xs text-gray-500 mt-1">Personnel On-Scene (NFC/PIN)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {dispatched.map(d => {
          const r           = d.responder;
          const dispStatus  = d.dispatch_status ?? 'En Route';
          const statusColor = dispatchStatusColors[dispStatus] ?? 'text-gray-400 bg-gray-600/10 border-gray-600/30';
          const unitName    = r?.full_name || r?.email || '—';
          return (
            <div key={d.id} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3">
              <div className="text-white text-xs font-semibold mb-1 truncate">{unitName}</div>
              <div className="text-xs text-gray-500 mb-2">{r?.type_of_vehicle ?? '—'} {r?.plate_number ? `· ${r.plate_number}` : ''}</div>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusColor}`}>
                {dispStatus}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

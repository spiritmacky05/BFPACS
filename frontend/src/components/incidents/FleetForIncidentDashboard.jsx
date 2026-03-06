import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Truck, AlertTriangle } from "lucide-react";

const truckTypeColors = {
  Pumper: "text-blue-400 bg-blue-600/10 border-blue-600/30",
  Ladder: "text-yellow-400 bg-yellow-600/10 border-yellow-600/30",
  Tanker: "text-purple-400 bg-purple-600/10 border-purple-600/30",
  Rescue: "text-green-400 bg-green-600/10 border-green-600/30",
  Command: "text-red-400 bg-red-600/10 border-red-600/30",
};

const statusColors = {
  Available: "text-gray-400 bg-gray-600/10 border-gray-600/30",
  Deployed: "text-red-400 bg-red-600/10 border-red-600/30",
  "Under Maintenance": "text-orange-400 bg-orange-600/10 border-orange-600/30",
  "Out of Service": "text-gray-500 bg-gray-600/10 border-gray-600/30",
};

export default function FleetForIncidentDashboard({ incidentId }) {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch dispatches for this incident
        const dispatches = await base44.entities.Dispatch.filter({
          incident_id: incidentId,
        });

        // Fetch truck details for each dispatch
        const truckIds = dispatches.map(d => d.truck_id);
        const truckPromises = truckIds.map(id =>
          base44.entities.FireTruck.filter({ id }).then(data => data[0])
        );

        const truckData = await Promise.all(truckPromises);
        setTrucks(truckData.filter(t => t));
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {trucks.map(truck => (
          <div key={truck.id} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3">
            <div className="text-xs font-mono text-gray-500 mb-2">{truck.unit_code}</div>
            <div className="mb-2">
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${truckTypeColors[truck.truck_type] || truckTypeColors.Pumper}`}>
                {truck.truck_type}
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
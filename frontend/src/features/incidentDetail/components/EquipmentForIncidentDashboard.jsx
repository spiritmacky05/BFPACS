import { useState, useEffect } from "react";
import { equipmentApi } from "@/features/equipment";
import { Package } from "lucide-react";
import { httpClient } from "@/shared/httpClient";

export default function EquipmentForIncidentDashboard({ incidentId }) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        // Fetch all equipment
        const allEquipment = await equipmentApi.list();
        // Fetch check-in logs for this incident
        const checkinLogs = await httpClient.get(`/checkin/logs?incident_id=${incidentId}`);
        // Get IDs of checked-in equipment (assuming logs have equipment_id or similar field)
        const checkedInEquipmentIds = new Set(
          (checkinLogs || [])
            .filter(log => log.equipment_id)
            .map(log => log.equipment_id)
        );
        // Only show equipment that is checked in for this incident
        setEquipment(
          (allEquipment || []).filter(eq => checkedInEquipmentIds.has(eq.id))
        );
      } catch (error) {
        console.error("Error fetching equipment for incident:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-orange-400 uppercase tracking-widest font-semibold mb-4">
          <Package className="w-3.5 h-3.5" /> Equipment Asset
        </div>
        <div className="text-gray-500 text-sm italic">Loading equipment data...</div>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-orange-400 uppercase tracking-widest font-semibold mb-4">
          <Package className="w-3.5 h-3.5" /> Equipment Asset
        </div>
        <div className="text-gray-600 text-sm">No equipment assigned to this incident.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs text-orange-400 uppercase tracking-widest font-semibold mb-4">
        <Package className="w-3.5 h-3.5" /> Equipment Asset
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {equipment.map(eq => (
          <div key={eq.id} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 group hover:border-orange-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-orange-600/15 border border-orange-600/25 rounded flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="text-white text-xs font-medium truncate">{eq.equipment_name}</div>
            </div>
            <div className="flex flex-col gap-1.5 text-[10px] uppercase tracking-wider">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Qty: {eq.quantity}</span>
                <span className={`px-1.5 py-0.5 rounded border ${eq.status === 'Borrowed' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-green-500 bg-green-500/10 border-green-500/20'}`}>
                  {eq.status}
                </span>
              </div>
              {eq.borrower_name && (
                <div className="text-gray-400 font-medium normal-case">By: {eq.borrower_name}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CheckedInEquipmentList
 *
 * Displays a searchable table of all equipment associated with checked-in dispatches.
 * Adapted from bfpacs_update — uses our dispatchesApi, fleetApi and equipmentApi.
 */

import { useState, useEffect } from "react";
import { equipmentApi } from "../api/equipment.api";
import { Package, Search } from "lucide-react";

export default function CheckedInEquipmentList({ incidentId }) {
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    if (!incidentId) return;
    try {
      // Get all equipment — filter those that are currently deployed/borrowed
      const allEquipment = await equipmentApi.list();
      // Show equipment that is currently not serviceable (deployed)
      const deployed = (allEquipment || []).filter(e => e.status === "Deployed" || e.borrower_name);
      setEquipmentItems(deployed);
    } catch (error) {
      console.error("Error fetching checked-in equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [incidentId]);

  const filtered = equipmentItems.filter(e =>
    e.equipment_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center gap-2">
        <Package className="w-4 h-4 text-red-400" />
        <span className="text-white font-semibold text-sm">Checked-In Equipment</span>
        <span className="ml-auto text-gray-600 text-xs">{equipmentItems.length} items</span>
      </div>

      <div className="px-6 py-3 border-b border-[#1f1f1f]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search equipment..."
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-red-600/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-gray-600 text-sm text-center">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-8 text-gray-700 text-sm text-center">No equipment currently checked in.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                {["Equipment", "Status", "Quantity", "Borrower"].map(h => (
                  <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151515]">
              {filtered.map((e, idx) => (
                <tr key={`${e.id}-${idx}`} className="hover:bg-white/[0.02] transition-all">
                  <td className="px-4 py-3 text-white font-medium text-xs">{e.equipment_name}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-0.5 rounded border text-xs ${e.status === "Serviceable" ? "text-green-400 border-green-600/30 bg-green-600/10" : "text-red-400 border-red-600/30 bg-red-600/10"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs font-mono">{e.quantity ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{e.borrower_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

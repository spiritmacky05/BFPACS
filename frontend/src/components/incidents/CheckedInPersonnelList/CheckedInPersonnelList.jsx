/**
 * CheckedInPersonnelList
 *
 * Displays a searchable table of all personnel currently checked into an incident.
 * Adapted from bfpacs_update — uses our checkinApi and personnelApi.
 */

import { useState, useEffect } from "react";
import { checkinApi } from "@/api/checkin/checkin";
import { personnelApi } from "@/api/personnel/personnel";
import { Users, Search } from "lucide-react";

export default function CheckedInPersonnelList({ incidentId }) {
  const [checkins, setCheckins] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    if (!incidentId) return;
    try {
      const [c, p] = await Promise.all([
        checkinApi.getLogsForIncident(incidentId),
        personnelApi.list(),
      ]);
      setCheckins(c || []);
      setPersonnel(p || []);
    } catch (error) {
      console.error("Error fetching checked-in personnel:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [incidentId]);

  // Map check-in logs to personnel records (only active check-ins — no check_out_time)
  const activePersonnel = checkins
    .filter(c => !c.check_out_time)
    .map(c => {
      const p = personnel.find(p => p.id === c.personnel_id);
      return p ? { ...p, check_in_time: c.check_in_time, checkin_id: c.id, check_in_method: c.check_in_method } : null;
    })
    .filter(Boolean);

  const filtered = activePersonnel.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.rank?.toLowerCase().includes(search.toLowerCase()) ||
    p.designation?.toLowerCase().includes(search.toLowerCase()) ||
    p.certification?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center gap-2">
        <Users className="w-4 h-4 text-red-400" />
        <span className="text-white font-semibold text-sm">Duty Personnel On Scene</span>
        <span className="ml-auto text-gray-600 text-xs">{activePersonnel.length} checked in</span>
      </div>

      <div className="px-6 py-3 border-b border-[#1f1f1f]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search personnel..."
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-red-600/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-gray-600 text-sm text-center">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-8 text-gray-700 text-sm text-center">No personnel currently checked in.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                {["Name", "Rank", "Designation", "Certification", "Method", "Station", "Check-In"].map(h => (
                  <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151515]">
              {filtered.map(p => (
                <tr key={p.checkin_id} className="hover:bg-white/[0.02] transition-all">
                  <td className="px-4 py-3 text-white font-medium text-xs">{p.full_name}</td>
                  <td className="px-4 py-3 text-orange-400 text-xs font-mono">{p.rank}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{p.designation || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded border text-blue-400 border-blue-600/30 bg-blue-600/10">{p.certification || "BFP"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded border text-green-400 border-green-600/30 bg-green-600/10">{p.check_in_method}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.station?.name || "—"}</td>
                  <td className="px-4 py-3 text-green-400 text-xs">
                    {p.check_in_time ? new Date(p.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

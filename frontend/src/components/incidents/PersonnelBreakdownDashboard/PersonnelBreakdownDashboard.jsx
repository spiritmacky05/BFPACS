/**
 * PersonnelBreakdownDashboard
 *
 * Displays a breakdown of checked-in personnel by type (rank/designation categories).
 * Adapted from bfpacs_update — uses our checkinApi and personnelApi.
 */

import { useState, useEffect, useCallback } from "react";
import { checkinApi } from "@/api/checkin/checkin";
import { personnelApi } from "@/api/personnel/personnel";
import { Users } from "lucide-react";

export default function PersonnelBreakdownDashboard({ incidentId }) {
  const [breakdown, setBreakdown] = useState({
    BFP: 0,
    "Fire Brigade": 0,
    "Fire Volunteer": 0,
    PNP: 0,
    DRRMO: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [checkins, personnel] = await Promise.all([
        checkinApi.getLogsForIncident(incidentId),
        personnelApi.list(),
      ]);

      const personnelMap = (personnel || []).reduce((acc, p) => {
        acc[p.id] = p.certification || "BFP";
        return acc;
      }, {});

      const counts = {
        BFP: 0,
        "Fire Brigade": 0,
        "Fire Volunteer": 0,
        PNP: 0,
        DRRMO: 0,
      };

      // Count unique personnel (skip duplicates)
      const seen = new Set();
      (checkins || []).forEach((checkin) => {
        const pid = checkin.personnel_id;
        if (pid && !seen.has(pid)) {
          seen.add(pid);
          const type = personnelMap[pid] || "BFP";
          if (counts.hasOwnProperty(type)) {
            counts[type]++;
          } else {
            counts["BFP"]++;
          }
        }
      });

      setBreakdown(counts);
    } catch (error) {
      console.error("Error fetching personnel breakdown:", error);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (!incidentId) return;
    fetchData();
  }, [incidentId, fetchData]);

  const colorMap = {
    BFP: "bg-blue-600/20 border-blue-600/40 text-blue-400",
    "Fire Brigade": "bg-yellow-600/20 border-yellow-600/40 text-yellow-400",
    "Fire Volunteer": "bg-purple-600/20 border-purple-600/40 text-purple-400",
    PNP: "bg-green-600/20 border-green-600/40 text-green-400",
    DRRMO: "bg-orange-600/20 border-orange-600/40 text-orange-400",
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading personnel data...
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
        <Users className="w-3.5 h-3.5" /> Personnel Asset
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(breakdown).map(([type, count]) => (
          <div
            key={type}
            className={`rounded-lg border p-3 text-center ${colorMap[type]}`}
          >
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs mt-1 opacity-75">{type}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
        <div className="text-center">
          <span className="text-gray-500 text-xs">Total Personnel on Scene</span>
          <div className="text-3xl font-bold text-white mt-1">{total}</div>
        </div>
      </div>
    </div>
  );
}

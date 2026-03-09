/**
 * CheckInDashboard.jsx
 *
 * Shows today's check-in totals by personnel certification type,
 * and on-duty personnel counts by type.
 * Ported from bfpacs_update CheckInDashboard — replaces base44 with custom API.
 */

import { useState, useEffect } from "react";
import { checkinApi }   from "@/api/checkin/checkin";
import { personnelApi } from "@/api/personnel/personnel";
import { Users, Clock } from "lucide-react";

const TYPES = ["BFP", "Fire Brigade", "Fire Volunteer", "PNP", "DRRMO"];

const colorMap = {
  "BFP":            "bg-blue-600/20   border-blue-600/40   text-blue-400",
  "Fire Brigade":   "bg-yellow-600/20 border-yellow-600/40 text-yellow-400",
  "Fire Volunteer": "bg-purple-600/20 border-purple-600/40 text-purple-400",
  "PNP":            "bg-green-600/20  border-green-600/40  text-green-400",
  "DRRMO":          "bg-orange-600/20 border-orange-600/40 text-orange-400",
};

const emptyByType = () => Object.fromEntries(TYPES.map(t => [t, 0]));

export default function CheckInDashboard() {
  const [todayByType,  setTodayByType]  = useState(emptyByType());
  const [onDutyByType, setOnDutyByType] = useState(emptyByType());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logs, personnel] = await Promise.all([
          checkinApi.getAllLogs(),
          personnelApi.list(),
        ]);

        // Build a personnel map for quick lookup
        const personnelMap = {};
        (personnel ?? []).forEach(p => { personnelMap[p.id] = p; });

        const today = new Date().toDateString();

        // Today's active check-ins (no checkout yet)
        const todayActive = (logs ?? []).filter(l =>
          l.check_in_time &&
          new Date(l.check_in_time).toDateString() === today &&
          !l.check_out_time
        );

        const tByType = emptyByType();
        todayActive.forEach(log => {
          const cert = personnelMap[log.personnel_id]?.certification || "BFP";
          if (cert in tByType) tByType[cert]++;
        });

        // On-duty personnel count by certification
        const oByType = emptyByType();
        (personnel ?? []).forEach(p => {
          if (p.duty_status === "On Duty") {
            const cert = p.certification || "BFP";
            if (cert in oByType) oByType[cert]++;
          }
        });

        setTodayByType(tByType);
        setOnDutyByType(oByType);
      } catch (error) {
        console.error("CheckInDashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalToday  = Object.values(todayByType).reduce((a, b) => a + b, 0);
  const totalOnDuty = Object.values(onDutyByType).reduce((a, b) => a + b, 0);

  if (loading) {
    return <div className="text-center py-8 text-gray-500 text-sm">Loading check-in data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Today's Check-ins by Type */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Clock className="w-3.5 h-3.5" /> Today's Check-ins by Type
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TYPES.map(type => (
            <div key={type} className={`rounded-lg border p-3 text-center ${colorMap[type]}`}>
              <div className="text-2xl font-bold">{todayByType[type]}</div>
              <div className="text-xs mt-1 opacity-75">{type}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1f1f1f] text-center">
          <span className="text-gray-500 text-xs">Total Active Check-ins Today</span>
          <div className="text-3xl font-bold text-white mt-1">{totalToday}</div>
        </div>
      </div>

      {/* On-Duty Personnel by Type */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Users className="w-3.5 h-3.5" /> On-Duty Personnel by Type
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TYPES.map(type => (
            <div key={type} className={`rounded-lg border p-3 text-center ${colorMap[type]}`}>
              <div className="text-2xl font-bold">{onDutyByType[type]}</div>
              <div className="text-xs mt-1 opacity-75">{type}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1f1f1f] text-center">
          <span className="text-gray-500 text-xs">Total On-Duty Personnel</span>
          <div className="text-3xl font-bold text-white mt-1">{totalOnDuty}</div>
        </div>
      </div>
    </div>
  );
}

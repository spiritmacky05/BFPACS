/**
 * CheckInDashboard.jsx
 *
 * Shows today's check-in totals by method (NFC/PIN/Manual),
 * and responder unit counts by ACS status.
 */

import { useState, useEffect } from "react";
import { Users, Clock } from "lucide-react";
import { checkinApi } from "../api/checkin.api";
import { superadminApi } from "@/features/superadmin";
import {
  ACS_STATUSES,
  ACS_STATUS_COLORS,
  ACS_STATUS_LABELS,
} from "@/features/shared/components/acsStatus";

const METHODS = ["NFC", "PIN", "Manual"];
const METHOD_COLORS = {
  NFC:    "bg-green-600/20  border-green-600/40  text-green-400",
  PIN:    "bg-blue-600/20   border-blue-600/40   text-blue-400",
  Manual: "bg-purple-600/20 border-purple-600/40 text-purple-400",
};

export default function CheckInDashboard() {
  const [todayByMethod, setTodayByMethod] = useState({ NFC: 0, PIN: 0, Manual: 0 });
  const [acsCounts,     setAcsCounts]     = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logs, users] = await Promise.all([
          checkinApi.getAllLogs(),
          superadminApi.listUsers(),
        ]);

        const today = new Date().toDateString();

        // Today's active check-ins (no checkout yet) grouped by method
        const todayActive = (logs ?? []).filter(l =>
          l.check_in_time &&
          new Date(l.check_in_time).toDateString() === today &&
          !l.check_out_time
        );

        const byMethod = { NFC: 0, PIN: 0, Manual: 0 };
        todayActive.forEach(log => {
          const m = log.entry_type;
          if (m in byMethod) byMethod[m]++;
        });

        // Responder units grouped by ACS status
        const responders = (users ?? []).filter(u => u.role === 'user' || u.user_type === 'responder');
        const counts = {};
        ACS_STATUSES.forEach(s => { counts[s] = 0; });
        responders.forEach(u => {
          const status = u.acs_status || "Serviceable";
          if (status in counts) counts[status]++;
        });

        setTodayByMethod(byMethod);
        setAcsCounts(counts);
      } catch (error) {
        console.error("CheckInDashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalToday     = Object.values(todayByMethod).reduce((a, b) => a + b, 0);
  const totalResponders = Object.values(acsCounts).reduce((a, b) => a + b, 0);

  if (loading) {
    return <div className="text-center py-8 text-gray-500 text-sm">Loading check-in data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Today's Check-ins by Method */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Clock className="w-3.5 h-3.5" /> Today's Active Check-ins by Method
        </div>
        <div className="grid grid-cols-3 gap-3">
          {METHODS.map(method => (
            <div key={method} className={`rounded-lg border p-3 text-center ${METHOD_COLORS[method]}`}>
              <div className="text-2xl font-bold">{todayByMethod[method]}</div>
              <div className="text-xs mt-1 opacity-75">{method}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1f1f1f] text-center">
          <span className="text-gray-500 text-xs">Total Active Check-ins Today</span>
          <div className="text-3xl font-bold text-white mt-1">{totalToday}</div>
        </div>
      </div>

      {/* Responder Units by ACS Status */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Users className="w-3.5 h-3.5" /> Responder Units by ACS Status
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ACS_STATUSES.map(status => (
            <div key={status} className={`rounded-lg border p-3 text-center ${ACS_STATUS_COLORS[status]}`}>
              <div className="text-2xl font-bold">{acsCounts[status] ?? 0}</div>
              <div className="text-xs mt-1 opacity-75">{ACS_STATUS_LABELS[status]}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1f1f1f] text-center">
          <span className="text-gray-500 text-xs">Total Registered Responder Units</span>
          <div className="text-3xl font-bold text-white mt-1">{totalResponders}</div>
        </div>
      </div>
    </div>
  );
}

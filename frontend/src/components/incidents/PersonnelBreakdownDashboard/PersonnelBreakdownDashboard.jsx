/**
 * PersonnelBreakdownDashboard
 *
 * Displays checked-in responder units and duty personnel for the incident.
 * Resolves names from both usersApi (responder units) and personnelApi (duty_personnel).
 */

import { useState, useEffect, useCallback } from "react";
import { checkinApi }  from "@/api/checkin/checkin";
import { personnelApi } from "@/api/personnel/personnel";
import { usersApi }    from "@/api/users/users";
import { Users, Truck, Clock } from "lucide-react";

export default function PersonnelBreakdownDashboard({ incidentId }) {
  const [checkins,    setCheckins]    = useState([]);
  const [nameMap,     setNameMap]     = useState({});
  const [typeMap,     setTypeMap]     = useState({}); // id → 'responder' | 'personnel'
  const [loading,     setLoading]     = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [logs, personnel, users] = await Promise.all([
        checkinApi.getLogsForIncident(incidentId),
        personnelApi.list(),
        usersApi.list(),
      ]);

      // Build a unified name map from both sources
      const names  = {};
      const types  = {};
      (personnel || []).forEach(p => {
        names[p.id] = `${p.full_name}${p.rank ? ` (${p.rank})` : ''}`;
        types[p.id] = 'personnel';
      });
      (users || []).forEach(u => {
        names[u.id] = u.full_name || u.email;
        types[u.id] = 'responder';
      });

      setNameMap(names);
      setTypeMap(types);
      setCheckins(logs || []);
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

  // Deduplicate by personnel_id, keep latest
  const seen    = new Set();
  const active  = [];
  const checked = [];
  checkins.forEach(log => {
    if (!log.personnel_id || seen.has(log.personnel_id)) return;
    seen.add(log.personnel_id);
    if (!log.check_out_time) active.push(log);
    else checked.push(log);
  });

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading personnel data...</div>
    );
  }

  const CheckInRow = ({ log }) => {
    const name   = nameMap[log.personnel_id] || '—';
    const isResp = typeMap[log.personnel_id] === 'responder';
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isResp ? 'bg-red-600/20 border border-red-600/30' : 'bg-blue-600/20 border border-blue-600/30'}`}>
          {isResp ? <Truck className="w-3.5 h-3.5 text-red-400" /> : <Users className="w-3.5 h-3.5 text-blue-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-medium truncate">{name}</div>
          <div className="text-gray-500 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            <span className="ml-1 text-gray-600">· {log.entry_type || 'Manual'}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${log.check_out_time ? 'text-gray-400 bg-gray-600/10 border-gray-600/30' : 'text-green-400 bg-green-600/10 border-green-600/30'}`}>
          {log.check_out_time ? 'Checked Out' : 'On-Scene'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
        <Users className="w-3.5 h-3.5" /> Personnel Asset
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{active.length + checked.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Check-ins</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{active.length}</div>
          <div className="text-xs text-gray-500 mt-1">On-Scene</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-400">{checked.length}</div>
          <div className="text-xs text-gray-500 mt-1">Checked Out</div>
        </div>
      </div>

      {/* Active on-scene */}
      {active.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Currently On-Scene</div>
          <div className="space-y-1.5">
            {active.map(log => <CheckInRow key={log.id} log={log} />)}
          </div>
        </div>
      )}

      {/* Checked out */}
      {checked.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Checked Out</div>
          <div className="space-y-1.5">
            {checked.map(log => <CheckInRow key={log.id} log={log} />)}
          </div>
        </div>
      )}

      {active.length === 0 && checked.length === 0 && (
        <div className="text-center py-8 text-gray-600 text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No check-ins recorded for this incident
        </div>
      )}
    </div>
  );
}


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

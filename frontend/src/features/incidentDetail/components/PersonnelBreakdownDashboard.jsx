/**
 * PersonnelBreakdownDashboard
 *
 * Displays checked-in responder units and duty personnel for the incident.
 * Resolves names from both usersApi (responder units) and personnelApi (duty_personnel).
 */

import { useState, useEffect, useCallback } from "react";
import { checkinApi } from "@/features/checkin";
import { personnelApi } from "@/features/personnel";
import { superadminApi }  from "@/features/superadmin";
import { Users, Truck, Clock, ChevronDown, ChevronRight } from "lucide-react";

export default function PersonnelBreakdownDashboard({ incidentId }) {
  const [checkins,         setCheckins]         = useState([]);
  const [nameMap,          setNameMap]          = useState({});
  const [typeMap,          setTypeMap]          = useState({}); // id → 'responder' | 'personnel'
  const [certMap,          setCertMap]          = useState({}); // personnel id → certification string
  const [userStationMap,   setUserStationMap]   = useState({}); // user.id → station_id
  const [personnelByStation, setPersonnelByStation] = useState({}); // station_id → [personnel]
  const [expanded,         setExpanded]         = useState({}); // log.id → bool
  const [loading,          setLoading]          = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [logs, personnel, users] = await Promise.all([
        checkinApi.getLogsForIncident(incidentId),
        personnelApi.list(),
        superadminApi.listUsers(),
      ]);

      const names  = {};
      const types  = {};
      const certs  = {};
      const stationToPersonnel = {};
      (personnel || []).forEach(p => {
        names[p.id] = `${p.full_name}${p.rank ? ` (${p.rank})` : ''}`;
        types[p.id] = 'personnel';
        certs[p.id] = p.certification || 'BFP';
        // Group personnel by station_id
        if (p.station_id) {
          if (!stationToPersonnel[p.station_id]) stationToPersonnel[p.station_id] = [];
          stationToPersonnel[p.station_id].push(p);
        }
      });

      const userStation = {};
      (users || []).forEach(u => {
        names[u.id] = u.full_name || u.email;
        types[u.id] = 'responder';
        if (u.station_id) userStation[u.id] = u.station_id;
      });

      setNameMap(names);
      setTypeMap(types);
      setCertMap(certs);
      setUserStationMap(userStation);
      setPersonnelByStation(stationToPersonnel);
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

  // Deduplicate by personnel_id, keep latest entry
  const seen    = new Set();
  const active  = [];
  const checked = [];
  checkins.forEach(log => {
    if (!log.personnel_id || seen.has(log.personnel_id)) return;
    seen.add(log.personnel_id);
    if (!log.check_out_time) active.push(log);
    else checked.push(log);
  });

  const CERT_COLORS = {
    'BFP':            'text-blue-400   bg-blue-600/15   border-blue-600/40',
    'PNP':            'text-green-400  bg-green-600/15  border-green-600/40',
    'Fire Brigade':   'text-yellow-400 bg-yellow-600/15 border-yellow-600/40',
    'Fire Volunteer': 'text-purple-400 bg-purple-600/15 border-purple-600/40',
    'DRRMO':          'text-orange-400 bg-orange-600/15 border-orange-600/40',
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading personnel data...</div>
    );
  }

  const CheckInRow = ({ log }) => {
    const name      = nameMap[log.personnel_id] || '—';
    const isResp    = typeMap[log.personnel_id] === 'responder';
    const cert      = certMap[log.personnel_id];
    const certColor = cert ? (CERT_COLORS[cert] || CERT_COLORS['BFP']) : null;
    const stationId = isResp ? userStationMap[log.personnel_id] : null;
    const stationPersonnel = stationId ? (personnelByStation[stationId] || []) : [];
    const isExpanded = !!expanded[log.id];

    return (
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg overflow-hidden">
        {/* Main row — clickable for responders that have station personnel */}
        <div
          className={`flex items-center gap-3 px-3 py-2.5 ${isResp && stationPersonnel.length > 0 ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
          onClick={() => isResp && stationPersonnel.length > 0 && setExpanded(prev => ({ ...prev, [log.id]: !isExpanded }))}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isResp ? 'bg-red-600/20 border border-red-600/30' : 'bg-blue-600/20 border border-blue-600/30'}`}>
            {isResp ? <Truck className="w-3.5 h-3.5 text-red-400" /> : <Users className="w-3.5 h-3.5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{name}</div>
            <div className="text-gray-500 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              <span className="ml-1 text-gray-600">· {log.entry_type || 'Manual'}</span>
              {isResp && stationPersonnel.length > 0 && (
                <span className="ml-1 text-gray-600">· {stationPersonnel.length} personnel</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {cert && <span className={`text-xs px-2 py-0.5 rounded border ${certColor}`}>{cert}</span>}
            <span className={`text-xs px-2 py-0.5 rounded border ${log.check_out_time ? 'text-gray-400 bg-gray-600/10 border-gray-600/30' : 'text-green-400 bg-green-600/10 border-green-600/30'}`}>
              {log.check_out_time ? 'Out' : 'On-Scene'}
            </span>
            {isResp && stationPersonnel.length > 0 && (
              isExpanded
                ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )}
          </div>
        </div>

        {/* Expandable personnel list for this station */}
        {isExpanded && stationPersonnel.length > 0 && (
          <div className="border-t border-[#1f1f1f] px-3 py-2 space-y-1.5 bg-[#080808]">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1.5 font-semibold">Station Personnel</div>
            {stationPersonnel.map(p => {
              const pCert      = p.certification || 'BFP';
              const pCertColor = CERT_COLORS[pCert] || CERT_COLORS['BFP'];
              return (
                <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg">
                  <div className="w-6 h-6 bg-blue-600/20 border border-blue-600/30 rounded flex items-center justify-center flex-shrink-0">
                    <Users className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{p.full_name}</div>
                    <div className="text-gray-600 text-xs">{p.rank}{p.designation ? ` · ${p.designation}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${pCertColor}`}>{pCert}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${p.duty_status === 'On Duty' ? 'text-green-400 bg-green-600/10 border-green-600/30' : 'text-gray-500 bg-gray-600/10 border-gray-600/30'}`}>
                      {p.duty_status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
        <Users className="w-3.5 h-3.5" /> Personnel Asset
      </div>

      {/* Summary counts — incident-scoped only */}
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

      {/* Currently on-scene */}
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

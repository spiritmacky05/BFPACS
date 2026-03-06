/**
 * pages/Dashboard.jsx
 *
 * Command Center overview — loads incidents, fleets, personnel, checkins.
 * Polls every 30s for real-time feel (replaces base44 subscriptions).
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Truck, Users, LogIn, Flame, Activity } from 'lucide-react';
import { incidentsApi } from '@/api/incidents';
import { fleetApi }     from '@/api/fleet';
import { personnelApi } from '@/api/personnel';
import StatCard              from '../components/dashboard/StatCard';
import ActiveIncidentsList   from '../components/dashboard/ActiveIncidentsList';
import FleetStatusGrid       from '../components/dashboard/FleetStatusGrid';
import AnalyticsCharts       from '../components/dashboard/AnalyticsCharts';
import IncidentMapPanel      from '../components/dashboard/IncidentMapPanel';
import { useAuth }           from '@/context/AuthContext';

const POLL_INTERVAL_MS = 30_000;

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  loadingContainer: "flex items-center justify-center h-64",
  loadingFlex: "flex items-center gap-3",
  loadingIcon: "w-8 h-8 text-red-500 animate-pulse",
  loadingText: "text-gray-400 text-lg",
  
  pageContainer: "space-y-6",
  
  banner: {
    wrapper: "bg-gradient-to-r from-red-950/50 to-[#111] border border-red-900/30 rounded-xl p-6",
    flexRow: "flex items-center gap-4",
    iconBox: "w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center glow-red",
    icon: "w-8 h-8 text-white",
    title: "text-2xl font-bold text-white glow-text",
    subtitle: "text-gray-400 text-sm mt-1",
    liveIndicator: "ml-auto hidden md:flex items-center gap-2",
    liveIcon: "w-4 h-4 text-green-400 animate-pulse",
    liveText: "text-green-400 text-sm font-medium"
  },
  
  statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4",
  mainGrid: "grid grid-cols-1 lg:grid-cols-3 gap-6",
  colSpan1: "lg:col-span-1",
  colSpan2: "lg:col-span-2",
  
  personnelLog: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-6",
    title: "text-white font-semibold mb-4 flex items-center gap-2",
    titleIcon: "w-4 h-4 text-red-400",
    emptyText: "text-gray-600 text-sm text-center py-6",
    tableWrapper: "overflow-x-auto",
    table: "w-full text-sm",
    theadTr: "border-b border-[#1f1f1f]",
    th: "text-left text-gray-500 text-xs uppercase tracking-wider pb-3 pr-4",
    tbody: "divide-y divide-[#1a1a1a]",
    tr: "hover:bg-white/2",
    tdName: "py-3 pr-4 text-white font-medium",
    tdText: "py-3 pr-4 text-gray-400",
    tdBadge: "py-3",
    badge: "text-xs px-2 py-0.5 rounded border text-green-400 border-green-600/30 bg-green-600/10"
  }
};

export default function Dashboard() {
  const [incidents,        setIncidents]        = useState([]);
  const [fleets,           setFleets]           = useState([]);
  const [personnel,        setPersonnel]        = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading,          setLoading]          = useState(true);

  const { role } = useAuth();
  const isAdmin  = role === 'admin' || role === 'superadmin';

  // ── Data loader ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [i, f, p] = await Promise.all([
      incidentsApi.list(),
      fleetApi.list(),
      personnelApi.list(),
    ]);
    setIncidents(i ?? []);
    setFleets(f ?? []);
    setPersonnel(p ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Poll for updates every 30 seconds
    const timer = setInterval(loadData, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  // Actual DB status values: fleets → 'Serviceable'/'Inactive'/'Dispatched', personnel → duty_status
  const activeIncidents  = incidents.filter(i => i.incident_status === 'Active');
  const deployedFleets   = fleets.filter(f => f.status === 'Dispatched');
  const availableFleets  = fleets.filter(f => f.status === 'Serviceable');
  const onDutyPersonnel  = personnel.filter(p => p.duty_status === 'On Duty');

  // Auto-select first active incident
  useEffect(() => {
    if (!selectedIncident && activeIncidents.length > 0) {
      setSelectedIncident(activeIncidents[0]);
    }
  }, [activeIncidents, selectedIncident]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingFlex}>
          <Flame className={styles.loadingIcon} />
          <span className={styles.loadingText}>Loading BFPACS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header Banner */}
      <div className={styles.banner.wrapper}>
        <div className={styles.banner.flexRow}>
          <div className={styles.banner.iconBox}>
            <Flame className={styles.banner.icon} />
          </div>
          <div>
            <h2 className={styles.banner.title}>Command Center Dashboard</h2>
            <p className={styles.banner.subtitle}>Real-time monitoring — Bureau of Fire Protection</p>
          </div>
          <div className={styles.banner.liveIndicator}>
            <Activity className={styles.banner.liveIcon} />
            <span className={styles.banner.liveText}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard label="Active Incidents"  value={activeIncidents.length}  icon={AlertTriangle} color="red"    sub={`${incidents.length} total`} />
        <StatCard label="Deployed Units"    value={deployedFleets.length}   icon={Truck}         color="yellow" sub={`${availableFleets.length} available`} />
        <StatCard label="On Duty Personnel" value={onDutyPersonnel.length}  icon={Users}         color="blue"   sub={`${personnel.length} total`} />
        <StatCard label="Total Fleet"       value={fleets.length}           icon={LogIn}         color="green"  sub="Registered vehicles" />
      </div>

      {/* Main Grid: Incidents + Map */}
      <div className={styles.mainGrid}>
        <div className={styles.colSpan1}>
          <ActiveIncidentsList
            incidents={activeIncidents}
            selectedIncident={selectedIncident}
            onSelect={setSelectedIncident}
          />
        </div>
        <div className={styles.colSpan2}>
          <IncidentMapPanel
            incident={selectedIncident}
            trucks={fleets}
            checkins={[]}
            personnel={personnel}
          />
        </div>
      </div>

      {/* Fleet Status */}
      <FleetStatusGrid
        trucks={fleets}
        incidents={incidents}
        isAdmin={isAdmin}
        onAssigned={loadData}
      />

      {/* Analytics */}
      <AnalyticsCharts incidents={incidents} trucks={fleets} personnel={personnel} />

      {/* Recent Personnel on Duty */}
      <div className={styles.personnelLog.wrapper}>
        <h3 className={styles.personnelLog.title}>
          <Users className={styles.personnelLog.titleIcon} /> Personnel On Duty
        </h3>
        {!onDutyPersonnel.length ? (
          <p className={styles.personnelLog.emptyText}>No personnel currently on duty</p>
        ) : (
          <div className={styles.personnelLog.tableWrapper}>
            <table className={styles.personnelLog.table}>
              <thead>
                <tr className={styles.personnelLog.theadTr}>
                  <th className={styles.personnelLog.th}>Name</th>
                  <th className={styles.personnelLog.th}>Rank</th>
                  <th className={styles.personnelLog.th}>Shift</th>
                  <th className={styles.personnelLog.th}>Status</th>
                </tr>
              </thead>
              <tbody className={styles.personnelLog.tbody}>
                {onDutyPersonnel.slice(0, 10).map(p => (
                  <tr key={p.id} className={styles.personnelLog.tr}>
                    <td className={styles.personnelLog.tdName}>{p.full_name}</td>
                    <td className={styles.personnelLog.tdText}>{p.rank}</td>
                    <td className={styles.personnelLog.tdText}>{p.shift ?? '—'}</td>
                    <td className={styles.personnelLog.tdBadge}>
                      <span className={styles.personnelLog.badge}>
                        {p.duty_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
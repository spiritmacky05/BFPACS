/**
 * pages/Dashboard.jsx
 *
 * Command Center overview — loads incidents, fleets, personnel, checkins.
 * Polls every 30s for real-time feel (replaces base44 subscriptions).
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Truck, Users, LogIn, Flame, Activity } from 'lucide-react';
import StatCard              from '../components/dashboard/StatCard';
import ActiveIncidentsList   from '../components/dashboard/ActiveIncidentsList';
import FleetStatusGrid       from '../components/dashboard/FleetStatusGrid';
import AnalyticsCharts       from '../components/dashboard/AnalyticsCharts';
import IncidentMapPanel      from '../components/dashboard/IncidentMapPanel';
import PersonnelTable        from '../components/dashboard/PersonnelTable';
import { useAuth }           from '@/context/AuthContext';
import useDashboardData      from '@/hooks/useDashboardData';
import { styles }            from './Dashboard.styles';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────


export default function Dashboard() {
  const [selectedIncident, setSelectedIncident] = useState(null);

  const { role } = useAuth();
  const isAdmin  = role === 'admin' || role === 'superadmin';

  const {
    incidents,
    fleets,
    personnel,
    loading,
    reload: loadData,
    activeIncidents,
    deployedFleets,
    availableFleets,
    onDutyPersonnel
  } = useDashboardData();

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

      <PersonnelTable onDutyPersonnel={onDutyPersonnel} styles={styles} />
    </div>
  );
}
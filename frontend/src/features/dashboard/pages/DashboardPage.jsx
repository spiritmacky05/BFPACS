/**
 * features/dashboard/pages/DashboardPage.jsx
 *
 * Feature-first Dashboard page container.
 *
 * Responsibilities:
 * - Coordinate dashboard data flow via `useDashboard`.
 * - Compose feature and shared UI sections.
 * - Keep render path easy for interns to follow.
 */

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext/AuthContext';
import ActiveIncidentsList from '@/components/dashboard/ActiveIncidentsList/ActiveIncidentsList';
import FleetStatusGrid from '@/components/dashboard/FleetStatusGrid/FleetStatusGrid';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts/AnalyticsCharts';
import IncidentMapPanel from '@/components/dashboard/IncidentMapPanel/IncidentMapPanel';
import useDashboard from '../hooks/useDashboard';
import DashboardHeader from '../components/DashboardHeader';
import DashboardStatsGrid from '../components/DashboardStatsGrid';
import DashboardPersonnelTable from '../components/DashboardPersonnelTable';

const styles = {
  page: 'space-y-6',
  loadingContainer: 'flex items-center justify-center h-64',
  loadingRow: 'flex items-center gap-3',
  loadingIcon: 'w-8 h-8 text-red-500 animate-pulse',
  loadingText: 'text-gray-400 text-lg',
  errorCard: 'rounded-xl border border-red-700/30 bg-red-900/10 p-4',
  errorTitle: 'text-sm font-semibold text-red-300',
  errorMessage: 'mt-1 text-xs text-red-200/90',
  topGrid: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
  topGridLeft: 'lg:col-span-1',
  topGridRight: 'lg:col-span-2',
};

export default function DashboardPage() {
  const { role } = useAuth();
  const [selectedIncident, setSelectedIncident] = useState(null);

  const {
    incidents,
    fleets,
    personnel,
    isLoading,
    error,
    reload,
    activeIncidents,
    deployedFleets,
    availableFleets,
    onDutyPersonnel,
  } = useDashboard();

  const isAdmin = role === 'admin' || role === 'superadmin';

  // Keep map panel useful by auto-selecting one active incident.
  useEffect(() => {
    if (!selectedIncident && activeIncidents.length > 0) {
      setSelectedIncident(activeIncidents[0]);
    }
  }, [activeIncidents, selectedIncident]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingRow}>
          <Flame className={styles.loadingIcon} />
          <span className={styles.loadingText}>Loading BFPACS...</span>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.page}>
      <DashboardHeader />

      {error ? (
        <div className={styles.errorCard}>
          <p className={styles.errorTitle}>Could not fully refresh dashboard data.</p>
          <p className={styles.errorMessage}>{error.message}</p>
        </div>
      ) : null}

      <DashboardStatsGrid
        incidents={incidents}
        fleets={fleets}
        personnel={personnel}
        activeIncidents={activeIncidents}
        deployedFleets={deployedFleets}
        availableFleets={availableFleets}
        onDutyPersonnel={onDutyPersonnel}
      />

      <div className={styles.topGrid}>
        <div className={styles.topGridLeft}>
          <ActiveIncidentsList
            incidents={activeIncidents}
            selectedIncident={selectedIncident}
            onSelect={setSelectedIncident}
          />
        </div>

        <div className={styles.topGridRight}>
          <IncidentMapPanel
            incident={selectedIncident}
            trucks={fleets}
            checkins={[]}
            personnel={personnel}
          />
        </div>
      </div>

      <FleetStatusGrid
        trucks={fleets}
        incidents={incidents}
        isAdmin={isAdmin}
        onAssigned={reload}
      />

      <AnalyticsCharts incidents={incidents} trucks={fleets} personnel={personnel} />

      <DashboardPersonnelTable onDutyPersonnel={onDutyPersonnel} />
    </section>
  );
}

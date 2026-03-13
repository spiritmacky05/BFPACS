import { AlertTriangle, LogIn, Truck, Users } from 'lucide-react';
import DashboardStatCard from './DashboardStatCard';

const styles = {
  grid: 'grid grid-cols-2 lg:grid-cols-4 gap-4',
};

export default function DashboardStatsGrid({
  incidents,
  fleets,
  personnel,
  activeIncidents,
  deployedFleets,
  availableFleets,
  onDutyPersonnel,
}) {
  return (
    <div className={styles.grid}>
      <DashboardStatCard
        label='Active Incidents'
        value={activeIncidents.length}
        icon={AlertTriangle}
        color='red'
        sub={`${incidents.length} total`}
      />

      <DashboardStatCard
        label='Deployed Units'
        value={deployedFleets.length}
        icon={Truck}
        color='yellow'
        sub={`${availableFleets.length} available`}
      />

      <DashboardStatCard
        label='On Duty Personnel'
        value={onDutyPersonnel.length}
        icon={Users}
        color='blue'
        sub={`${personnel.length} total`}
      />

      <DashboardStatCard
        label='Total Fleet'
        value={fleets.length}
        icon={LogIn}
        color='green'
        sub='Registered vehicles'
      />
    </div>
  );
}

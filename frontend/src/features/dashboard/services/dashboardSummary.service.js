/**
 * features/dashboard/services/dashboardSummary.service.js
 *
 * Pure data helpers for dashboard metrics.
 *
 * Keep this file side-effect free so logic is easy to test.
 */

const ACTIVE_INCIDENT_STATUS = 'Active';
const DEPLOYED_FLEET_STATUSES = new Set(['Dispatched', 'Deployed']);
const AVAILABLE_FLEET_STATUSES = new Set(['Serviceable', 'Available']);
const ON_DUTY_STATUS = 'On Duty';

export function buildDashboardSummary({ incidents, fleets, personnel }) {
  const activeIncidents = incidents.filter(
    (incident) => incident.incident_status === ACTIVE_INCIDENT_STATUS
  );

  const deployedFleets = fleets.filter((fleet) =>
    DEPLOYED_FLEET_STATUSES.has(fleet.status)
  );

  const availableFleets = fleets.filter((fleet) =>
    AVAILABLE_FLEET_STATUSES.has(fleet.status)
  );

  const onDutyPersonnel = personnel.filter(
    (member) => member.duty_status === ON_DUTY_STATUS
  );

  return {
    activeIncidents,
    deployedFleets,
    availableFleets,
    onDutyPersonnel,
  };
}

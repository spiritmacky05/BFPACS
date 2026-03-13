/**
 * features/incidents/services/incidentStatusWorkflow.service.js
 *
 * Service layer for multi-entity incident workflows.
 *
 * Why service layer:
 * - Pages/hooks should not know cross-entity side effects.
 * - This keeps business rules in one reusable place.
 */

import { incidentsApi } from '../api/incidents.api';
import { incidentAssetsApi } from '../api/incidentAssets.api';

/**
 * Supported status constants used by the incidents feature.
 */
export const INCIDENT_STATUS = {
  ACTIVE: 'Active',
  CONTROLLED: 'Controlled',
  FIRE_OUT: 'Fire Out',
  DONE: 'Done',
};

/**
 * Cross-entity status workflow.
 *
 * Business rule:
 * - Always update incident status first.
 * - If status becomes `Fire Out`, release dispatched fleet units back to `Serviceable`.
 */
export async function applyIncidentStatusWorkflow({
  incidentId,
  nextStatus,
  incidentsApiClient = incidentsApi,
  incidentAssetsApiClient = incidentAssetsApi,
}) {
  // 1) Update incident status in backend.
  await incidentsApiClient.updateStatus(incidentId, { incident_status: nextStatus });

  // 2) Only Fire Out triggers fleet release workflow.
  if (nextStatus !== INCIDENT_STATUS.FIRE_OUT) {
    return {
      incidentId,
      nextStatus,
      releasedFleetCount: 0,
    };
  }

  // 3) Load dispatches linked to this incident.
  const dispatches = await incidentAssetsApiClient.getDispatchesByIncident(incidentId);

  // 4) Keep only dispatches with a valid fleet ID.
  const dispatchesWithFleet = (dispatches || []).filter((dispatch) => Boolean(dispatch?.fleet_id));

  // 5) Release each fleet unit and add movement log.
  await Promise.all(
    dispatchesWithFleet.map((dispatch) =>
      Promise.all([
        incidentAssetsApiClient.updateFleetUnit(dispatch.fleet_id, { status: 'Serviceable' }),
        incidentAssetsApiClient.logFleetMovement(dispatch.fleet_id, {
          status_code: 'Fire Out',
          dispatch_id: dispatch.id,
        }),
      ])
    )
  );

  return {
    incidentId,
    nextStatus,
    releasedFleetCount: dispatchesWithFleet.length,
  };
}

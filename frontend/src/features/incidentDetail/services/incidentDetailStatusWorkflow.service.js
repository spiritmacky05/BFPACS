/**
 * features/incidentDetail/services/incidentDetailStatusWorkflow.service.js
 *
 * Service layer for incident-detail status updates.
 *
 * Why this file exists:
 * - Pages and hooks should not know cross-entity side effects.
 * - Business rules become reusable and easier to test.
 */

import { incidentDetailApi } from '../api/incidentDetail.api';
import { incidentDetailAssetsApi } from '../api/incidentDetailAssets.api';

/**
 * Shared status constants used by UI and business logic.
 */
export const INCIDENT_DETAIL_STATUS = {
  ACTIVE: 'Active',
  CONTROLLED: 'Controlled',
  FIRE_OUT: 'Fire Out',
  DONE: 'Done',
};

/**
 * Apply status update with optional side effects.
 *
 * Current business rules:
 * - Always patch incident status.
 * - If status becomes `Done`, release all dispatched fleet units to `Serviceable`.
 */
export async function applyIncidentDetailStatusWorkflow({
  incidentId,
  nextStatus,
  incidentApiClient = incidentDetailApi,
  incidentAssetsApiClient = incidentDetailAssetsApi,
}) {
  await incidentApiClient.updateStatus(incidentId, { incident_status: nextStatus });

  if (nextStatus !== INCIDENT_DETAIL_STATUS.DONE) {
    return {
      incidentId,
      nextStatus,
      releasedFleetCount: 0,
    };
  }

  const dispatches = await incidentAssetsApiClient.getDispatchesByIncident(incidentId);
  const dispatchesWithFleet = (dispatches || []).filter((dispatch) => Boolean(dispatch?.fleet_id));

  await Promise.all(
    dispatchesWithFleet.map((dispatch) =>
      incidentAssetsApiClient.updateFleetUnit(dispatch.fleet_id, { status: 'Serviceable' })
    )
  );

  return {
    incidentId,
    nextStatus,
    releasedFleetCount: dispatchesWithFleet.length,
  };
}

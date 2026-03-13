/**
 * features/dispatch/services/dispatchWorkflow.service.js
 *
 * Dispatch business workflow functions.
 *
 * Why this file exists:
 * - Dispatch actions affect multiple entities (dispatch + responder status).
 * - Keeping this out of page components makes code easier to follow.
 */

import dispatchApi from '../api/dispatch.api';
import dispatchAssetsApi from '../api/dispatchAssets.api';
import { DISPATCH_STATUS } from '../lib/dispatch.constants';
import { appendDispatchHistory } from './dispatchHistory.service';

function buildResponderLabel(responder) {
  if (!responder) return 'Responder Unit';
  if (responder.type_of_vehicle) {
    return `${responder.full_name} — ${responder.type_of_vehicle}`;
  }
  return responder.full_name;
}

/**
 * Create dispatch records for multiple responders.
 */
export async function createDispatchBatch({ incidentId, responderIds, notes, responders }) {
  await Promise.all(
    responderIds.map(async (responderId) => {
      const payload = {
        incident_id: incidentId,
        user_id: responderId,
      };

      if (notes?.trim()) {
        payload.situational_report = notes.trim();
      }

      const createdDispatch = await dispatchApi.create(payload);

      await dispatchAssetsApi.updateResponder(responderId, {
        acs_status: 'ACS Activated',
      });

      const responder = responders.find((item) => item.id === responderId);

      appendDispatchHistory({
        dispatchId: createdDispatch?.id ?? 'new',
        incidentId,
        fromStatus: null,
        toStatus: DISPATCH_STATUS.DISPATCHED,
        label: buildResponderLabel(responder),
      });
    })
  );
}

/**
 * Update one dispatch status and handle related side effects.
 */
export async function progressDispatchStatus({
  dispatch,
  incidentId,
  nextStatus,
  responders,
}) {
  await dispatchApi.updateStatus(dispatch.id, { dispatch_status: nextStatus });

  const responderRecord = dispatch?.responder
    ? dispatch.responder
    : responders.find((item) => item.id === dispatch.personnel_id);

  appendDispatchHistory({
    dispatchId: dispatch.id,
    incidentId,
    fromStatus: dispatch.dispatch_status,
    toStatus: nextStatus,
    label: buildResponderLabel(responderRecord),
  });

  if (nextStatus === DISPATCH_STATUS.COMPLETED && dispatch.personnel_id) {
    await dispatchAssetsApi.updateResponder(dispatch.personnel_id, {
      acs_status: 'Serviceable',
    });
  }
}

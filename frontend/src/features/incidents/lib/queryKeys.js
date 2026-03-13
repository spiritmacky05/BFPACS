/**
 * features/incidents/lib/queryKeys.js
 *
 * Why this file exists:
 * - Query keys should be centralized and reusable.
 * - Stable keys prevent cache bugs and accidental key typos.
 */

export const incidentsQueryKeys = {
  all: ['incidents'],
  list: (filters) => ['incidents', 'list', filters || {}],
  detail: (incidentId) => ['incidents', 'detail', incidentId],
  dispatchesByIncident: (incidentId) => ['incidents', 'dispatches', incidentId],
};

/**
 * features/dashboard/api/dashboard.api.js
 *
 * API layer for the Dashboard feature.
 *
 * Why this file exists:
 * - Keeps endpoint calls out of UI components.
 * - Makes it easy to test data loading in one place.
 */

import { incidentsApi, fleetApi, personnelApi } from '@/api/api-services';

const dashboardApi = {
  async loadSnapshot() {
    const [incidents, fleets, personnel] = await Promise.all([
      incidentsApi.list(),
      fleetApi.list(),
      personnelApi.list(),
    ]);

    return {
      incidents: incidents ?? [],
      fleets: fleets ?? [],
      personnel: personnel ?? [],
    };
  },
};

export default dashboardApi;

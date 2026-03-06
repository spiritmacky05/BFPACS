/**
 * api/index.js
 *
 * Barrel export — import all API modules from one place:
 *
 *   import { incidentsApi, fleetApi, checkinApi } from '@/api';
 */

export { default as api }                from './client/client';
export { ApiError }                      from './client/client';
export { incidentsApi }                  from './incidents/incidents';
export { fleetApi }                      from './fleet/fleet';
export { personnelApi }                  from './personnel/personnel';
export { dispatchesApi }                 from './dispatches/dispatches';
export { checkinApi }                    from './checkin/checkin';
export { hydrantsApi }                   from './hydrants/hydrants';
export { equipmentApi }                  from './equipment/equipment';
export { notificationsApi }              from './notifications/notifications';
export { stationsApi }                   from './stations/stations';

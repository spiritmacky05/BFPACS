/**
 * api/index.js
 *
 * Barrel export — import all API modules from one place:
 *
 *   import { incidentsApi, fleetApi, checkinApi } from '@/api';
 */

export { default as api }                from './client';
export { ApiError }                      from './client';
export { incidentsApi }                  from './incidents';
export { fleetApi }                      from './fleet';
export { personnelApi }                  from './personnel';
export { dispatchesApi }                 from './dispatches';
export { checkinApi }                    from './checkin';
export { hydrantsApi }                   from './hydrants';
export { equipmentApi }                  from './equipment';
export { notificationsApi }              from './notifications';

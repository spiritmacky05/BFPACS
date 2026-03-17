/**
 * api/api-services.js
 *
 * Aggregator for all API services.
 */

export { default as api }                from './client/client';
export { ApiError }                      from './client/client';
export { incidentsApi }                  from '@/features/incidents';
export { dispatchApi as dispatchesApi }  from '@/features/dispatch';
export { fleetApi }                      from '@/features/fleet/api/fleet.api';
export { personnelApi }                  from '@/features/personnel/api/personnel.api';
export { checkinApi }                    from '@/features/checkin/api/checkin.api';
export { hydrantsApi }                   from '@/features/hydrants/api/hydrants.api';
export { equipmentApi }                  from '@/features/equipment/api/equipment.api';
export { stationsApi }                   from '@/features/stations/api/stations.api';
export { superadminApi as usersApi }     from '@/features/superadmin';

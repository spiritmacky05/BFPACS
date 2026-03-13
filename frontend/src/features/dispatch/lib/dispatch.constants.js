/**
 * features/dispatch/lib/dispatch.constants.js
 *
 * Shared constants for dispatch UI + logic.
 */

export const DISPATCH_STATUS = Object.freeze({
  DISPATCHED: 'Dispatched',
  EN_ROUTE: 'En Route',
  ON_SCENE: 'On Scene',
  RETURNING: 'Returning',
  COMPLETED: 'Completed',
});

export const DISPATCH_STATUS_COLORS = {
  Dispatched: 'text-red-400 bg-red-600/10 border-red-600/30',
  'En Route': 'text-orange-400 bg-orange-600/10 border-orange-600/30',
  'On Scene': 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  Returning: 'text-blue-400 bg-blue-600/10 border-blue-600/30',
  Completed: 'text-green-400 bg-green-600/10 border-green-600/30',
};

/**
 * Current status -> next status action.
 */
export const DISPATCH_STATUS_FLOW = {
  Dispatched: {
    value: DISPATCH_STATUS.EN_ROUTE,
    label: 'En Route',
    colorClass: 'text-orange-400 border-orange-600/40 hover:bg-orange-600/10',
  },
  'En Route': {
    value: DISPATCH_STATUS.ON_SCENE,
    label: 'On Scene',
    colorClass: 'text-yellow-400 border-yellow-600/40 hover:bg-yellow-600/10',
  },
  'On Scene': {
    value: DISPATCH_STATUS.RETURNING,
    label: 'Returning',
    colorClass: 'text-blue-400 border-blue-600/40 hover:bg-blue-600/10',
  },
  Returning: {
    value: DISPATCH_STATUS.COMPLETED,
    label: 'Mark Completed',
    colorClass: 'text-green-400 border-green-600/40 hover:bg-green-600/10',
  },
};

export const EMPTY_LOCATION_FILTERS = Object.freeze({
  station: '',
  city: '',
  district: '',
  region: '',
});

/**
 * Utility to extract unique sorted values.
 */
export function uniqueSorted(values) {
  return [...new Set((values ?? []).filter(Boolean))].sort();
}

export function getDispatchStatusColor(statusLabel) {
  return (
    DISPATCH_STATUS_COLORS[statusLabel] ??
    'text-gray-400 border-gray-600/30 bg-gray-600/10'
  );
}

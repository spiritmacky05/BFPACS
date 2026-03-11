// Dispatch status constants — matches bfpacs_update flow
export const DISPATCH_STATUSES = Object.freeze({
  DISPATCHED: 'Dispatched',
  EN_ROUTE:   'En Route',
  ON_SCENE:   'On Scene',
  RETURNING:  'Returning',
  COMPLETED:  'Completed',
});

export const STATUS_COLORS = {
  'Dispatched': 'text-red-400    bg-red-600/10    border-red-600/30',
  'En Route':   'text-orange-400 bg-orange-600/10 border-orange-600/30',
  'On Scene':   'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Returning':  'text-blue-400   bg-blue-600/10   border-blue-600/30',
  'Completed':  'text-green-400  bg-green-600/10  border-green-600/30',
};

// Linear flow: current status → next button to show
export const DISPATCH_STATUS_FLOW = {
  'Dispatched': { value: 'En Route',  label: 'En Route',       color: 'text-orange-400 border-orange-600/40 hover:bg-orange-600/10' },
  'En Route':   { value: 'On Scene',  label: 'On Scene',       color: 'text-yellow-400 border-yellow-600/40 hover:bg-yellow-600/10' },
  'On Scene':   { value: 'Returning', label: 'Returning',      color: 'text-blue-400   border-blue-600/40   hover:bg-blue-600/10'   },
  'Returning':  { value: 'Completed', label: 'Mark Completed', color: 'text-green-400  border-green-600/40  hover:bg-green-600/10'  },
};

export const statusColor = (label) =>
  STATUS_COLORS[label] ?? 'text-gray-400 border-gray-600/30 bg-gray-600/10';

// Keep for backwards compat with fire-out logic
export const RADIO_CODES = Object.freeze({
  FIRE_OUT: 'Fire Out',
  ENDING:   'Completed',
});

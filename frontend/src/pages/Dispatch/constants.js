/**
 * constants.js — BFP Radio Code constants for the Dispatch feature.
 *
 * Why RADIO_CODES instead of raw string literals?
 *
 *   ✅  RADIO_CODES.EN_ROUTE     → always '10-70 En Route'
 *   ❌  '10-70 En Route'         → a single char typo silently wrong-colors
 *                                   the badge AND writes a bad value to the DB
 *
 * Object.freeze() prevents accidental mutation at runtime.
 * JSDoc annotations provide IDE autocompletion in plain JS files.
 */

/** @type {Readonly<Record<string, string>>} */
export const RADIO_CODES = Object.freeze({
  EN_ROUTE:   '10-70 En Route',
  ARRIVED:    '10-23 Arrived at Scene',
  BEGINNING:  '10-41 Beginning Tour',
  ENDING:     '10-42 Ending Tour',
  CONTROLLED: 'Controlled',
  FIRE_OUT:   'Fire Out',
});

export const BFP_STATUS_CODES = [
  { code: '10-70', label: RADIO_CODES.EN_ROUTE,    color: 'text-yellow-400 border-yellow-600/30 bg-yellow-600/10'  },
  { code: '10-23', label: RADIO_CODES.ARRIVED,     color: 'text-blue-400   border-blue-600/30   bg-blue-600/10'    },
  { code: '10-41', label: RADIO_CODES.BEGINNING,   color: 'text-green-400  border-green-600/30  bg-green-600/10'   },
  { code: '10-42', label: RADIO_CODES.ENDING,      color: 'text-gray-400   border-gray-600/30   bg-gray-600/10'    },
  { code: 'ctrl',  label: RADIO_CODES.CONTROLLED,  color: 'text-orange-400 border-orange-600/30 bg-orange-600/10'  },
  { code: 'out',   label: RADIO_CODES.FIRE_OUT,    color: 'text-red-400    border-red-600/30    bg-red-600/10'      },
];

/** Returns the Tailwind colour classes for a given status label string. */
export const statusColor = (label) =>
  BFP_STATUS_CODES.find(s => s.label === label)?.color
  ?? 'text-gray-400 border-gray-600/30 bg-gray-600/10';

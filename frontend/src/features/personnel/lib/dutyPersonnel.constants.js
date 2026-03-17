/**
 * features/personnel/lib/personnel.constants.js
 *
 * Shared constants and tiny helpers for Duty Personnel feature.
 */

export const RANK_COLOR_BY_VALUE = {
  FO1: 'text-gray-400',
  FO2: 'text-gray-300',
  FO3: 'text-gray-200',
  SFO1: 'text-yellow-400',
  SFO2: 'text-yellow-300',
  SFO3: 'text-orange-400',
  SFO4: 'text-red-400',
  FINSP: 'text-blue-400',
  FSINSP: 'text-blue-300',
  FCINSP: 'text-blue-200',
  FSUPT: 'text-purple-400',
  FSSUPT: 'text-purple-300',
  FCSUPT: 'text-purple-200',
};

export const DUTY_STATUS_COLOR_BY_VALUE = {
  'On Duty': 'text-green-400 bg-green-600/10 border-green-600/30',
  'Off Duty': 'text-gray-400 bg-gray-600/10 border-gray-600/30',
  'On Leave': 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
};

export const BFP_RANK_OPTIONS = [
  'FO1',
  'FO2',
  'FO3',
  'SFO1',
  'SFO2',
  'SFO3',
  'SFO4',
  'FINSP',
  'FSINSP',
  'FCINSP',
  'FSUPT',
  'FSSUPT',
  'FCSUPT',
];

export const BFP_SHIFT_OPTIONS = ['Shift A', 'Shift B', 'Station Commander'];

export const TRAINING_SKILL_OPTIONS = [
  'HAZMAT',
  'BRTC',
  'CBRN',
  'EMT',
  'ICS Level 1',
  'ICS Level 2',
  'ICS Level 3',
  'ICS Level 4',
  'ICS Level 5',
  'ICS CADRE',
  'USAR',
  'ICT',
  'EORA',
];

export const DUTY_STATUS_FILTER_OPTIONS = ['All', 'On Duty', 'Off Duty', 'On Leave'];

export const EMPTY_LOCATION_FILTERS = Object.freeze({
  station: '',
  city: '',
  district: '',
  region: '',
});

export const EMPTY_PERSONNEL_FORM = Object.freeze({
  full_name: '',
  rank: 'FO1',
  shift: 'Shift A',
  duty_status: 'On Duty',
  certification: '',
  station_id: '',
});

export function uniqueSorted(values) {
  return [...new Set((values ?? []).filter(Boolean))].sort();
}

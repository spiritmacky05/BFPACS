/**
 * PersonnelCard.jsx
 *
 * Renders a single duty-personnel entry in the Dispatch personnel grid.
 * Extracted from Dispatch.jsx to give this atom individual readability and testability.
 *
 * Props:
 *   personnel — a DutyPersonnel object from the API
 */

import { Award } from 'lucide-react';
import PersonnelLink from '@/components/PersonnelLink/PersonnelLink';

const DUTY_STYLES = {
  'On Duty':  'text-green-400 bg-green-600/10 border-green-600/30',
  'Off Duty': 'text-gray-400  bg-gray-600/10  border-gray-600/30',
  'On Leave': 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
};

export default function PersonnelCard({ personnel: p }) {
  const badgeStyle = DUTY_STYLES[p.duty_status] ?? DUTY_STYLES['Off Duty'];
  const isOnDuty   = p.duty_status === 'On Duty';

  return (
    <div className={`bg-[#0d0d0d] border rounded-xl p-3.5 flex flex-col gap-2 transition-all ${
      isOnDuty
        ? 'border-green-600/20 hover:border-green-600/40'
        : 'border-[#1f1f1f] opacity-60'
    }`}>

      {/* Name, rank, duty-status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-white text-sm font-semibold truncate">
            <PersonnelLink id={p.id} name={p.full_name} className="text-white font-semibold" />
            {p.is_station_commander && (
              <span className="ml-1.5 text-xs text-yellow-400 border border-yellow-600/30 bg-yellow-600/10 px-1.5 py-0.5 rounded">
                Cmdr
              </span>
            )}
          </div>
          <div className="text-gray-500 text-xs mt-0.5">{p.rank}</div>
        </div>
        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded border ${badgeStyle}`}>
          {p.duty_status}
        </span>
      </div>

      {/* Shift + optional certification */}
      <div className="flex flex-col gap-1 pt-1 border-t border-[#1f1f1f]">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-600">Shift:</span>
          <span className="text-gray-300">{p.shift ?? '—'}</span>
        </div>
        {p.certification && p.certification !== 'None' && (
          <div className="flex items-center gap-1.5 text-xs">
            <Award className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-blue-300/80 truncate">{p.certification}</span>
          </div>
        )}
      </div>

    </div>
  );
}

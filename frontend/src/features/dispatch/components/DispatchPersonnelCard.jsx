/**
 * features/dispatch/components/DispatchPersonnelCard.jsx
 *
 * Presentational card for personnel entries in Dispatch page.
 */

import { Award, Building2 } from 'lucide-react';
import { PersonnelLink } from '@/features/personnel';

const DUTY_STATUS_CLASS = {
  'On Duty': 'text-green-400 bg-green-600/10 border-green-600/30',
  'Off Duty': 'text-gray-400 bg-gray-600/10 border-gray-600/30',
  'On Leave': 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
};

const styles = {
  cardBase: 'bg-[#0d0d0d] border rounded-xl p-3.5 flex flex-col gap-2 transition-all',
  cardOnDuty: 'border-green-600/20 hover:border-green-600/40',
  cardOffDuty: 'border-[#1f1f1f] opacity-60',
  header: 'flex items-start justify-between gap-2',
  nameWrap: 'min-w-0',
  nameText: 'text-white text-sm font-semibold truncate',
  commanderBadge:
    'ml-1.5 text-xs text-yellow-400 border border-yellow-600/30 bg-yellow-600/10 px-1.5 py-0.5 rounded',
  rankText: 'text-gray-500 text-xs mt-0.5',
  statusBadge: 'flex-shrink-0 text-xs px-2 py-0.5 rounded border',
  detailsWrap: 'flex flex-col gap-1 pt-1 border-t border-[#1f1f1f]',
  detailRow: 'flex items-center gap-1.5 text-xs',
  detailMuted: 'text-gray-600',
  detailValue: 'text-gray-300',
  stationIcon: 'w-3 h-3 text-gray-500 flex-shrink-0',
  stationName: 'text-gray-400 truncate',
  stationCity: 'text-gray-600 truncate',
  certIcon: 'w-3 h-3 text-blue-400 flex-shrink-0',
  certText: 'text-blue-300/80 truncate',
};

export default function DispatchPersonnelCard({ personnel }) {
  const isOnDuty = personnel.duty_status === 'On Duty';
  const cardClass = `${styles.cardBase} ${isOnDuty ? styles.cardOnDuty : styles.cardOffDuty}`;
  const statusClass = DUTY_STATUS_CLASS[personnel.duty_status] ?? DUTY_STATUS_CLASS['Off Duty'];

  return (
    <div className={cardClass}>
      <div className={styles.header}>
        <div className={styles.nameWrap}>
          <div className={styles.nameText}>
            <PersonnelLink
              id={personnel.id}
              name={personnel.full_name}
              className='text-white font-semibold'
            />

            {personnel.is_station_commander && (
              <span className={styles.commanderBadge}>Cmdr</span>
            )}
          </div>

          <div className={styles.rankText}>{personnel.rank}</div>
        </div>

        <span className={`${styles.statusBadge} ${statusClass}`}>
          {personnel.duty_status}
        </span>
      </div>

      <div className={styles.detailsWrap}>
        <div className={styles.detailRow}>
          <span className={styles.detailMuted}>Shift:</span>
          <span className={styles.detailValue}>{personnel.shift ?? '—'}</span>
        </div>

        {personnel.station && (
          <div className={styles.detailRow}>
            <Building2 className={styles.stationIcon} />
            <span className={styles.stationName}>{personnel.station.station_name}</span>
            {personnel.station.city ? (
              <span className={styles.stationCity}>· {personnel.station.city}</span>
            ) : null}
          </div>
        )}

        {personnel.certification && personnel.certification !== 'None' && (
          <div className={styles.detailRow}>
            <Award className={styles.certIcon} />
            <span className={styles.certText}>{personnel.certification}</span>
          </div>
        )}
      </div>
    </div>
  );
}

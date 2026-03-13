/**
 * features/incidentDetail/components/IncidentDetailHeader.jsx
 *
 * Header section for incident detail page.
 *
 * Why this component exists:
 * - Keeps top navigation, badges, and action composition in one focused unit.
 */

import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import IncidentActions from './IncidentActions';

const styles = {
  wrapper: 'space-y-4',
  topRow: 'flex items-center justify-between',
  backLink: 'flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors',
  card: 'bg-[#111] border border-[#1f1f1f] rounded-xl p-6',
  cardInner: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3',
  incidentId: 'text-xs text-gray-600 mb-1 font-mono',
  title: 'text-xl font-bold text-white',
  subtitle: 'text-sm text-gray-500 mt-1',
  badgesWrap: 'flex flex-col items-start sm:items-end gap-2',
  statusBadge: 'text-xs px-3 py-1 rounded border font-semibold',
  alarmBadge: 'text-xs px-3 py-1 rounded border text-orange-400 border-orange-600/40 bg-orange-600/10',
  icon: 'w-4 h-4',
};

export default function IncidentDetailHeader({
  incident,
  isAdmin,
  statusColors,
  onEdit,
  onMarkControlled,
  onMarkFireOut,
  onCloseIncident,
  onOpenAcsPortal,
  onPrint,
}) {
  return (
    <header className={styles.wrapper}>
      <div className={styles.topRow}>
        <Link to={createPageUrl('Incidents')} className={styles.backLink}>
          <ArrowLeft className={styles.icon} />
          Back to Incidents
        </Link>

        <IncidentActions
          isAdmin={isAdmin}
          currentStatus={incident.incident_status}
          onEdit={onEdit}
          onMarkControlled={onMarkControlled}
          onMarkFireOut={onMarkFireOut}
          onCloseIncident={onCloseIncident}
          onOpenAcsPortal={onOpenAcsPortal}
          onPrint={onPrint}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.cardInner}>
          <div>
            <p className={styles.incidentId}>{incident.id?.slice(0, 8)}</p>
            <h1 className={styles.title}>{incident.location_text}</h1>
            {incident.occupancy_type && (
              <p className={styles.subtitle}>{incident.occupancy_type}</p>
            )}
          </div>

          <div className={styles.badgesWrap}>
            <span
              className={`${styles.statusBadge} ${
                statusColors[incident.incident_status] || statusColors.Active
              }`}
            >
              {incident.incident_status}
            </span>

            {incident.alarm_status && (
              <span className={styles.alarmBadge}>{incident.alarm_status}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

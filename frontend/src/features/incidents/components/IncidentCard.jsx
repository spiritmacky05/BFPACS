/**
 * features/incidents/components/IncidentCard.jsx
 *
 * Card view for one incident record.
 *
 * Why this component exists:
 * - Card rendering is detailed and can become noisy in the page file.
 * - We keep action buttons close to the card, but behavior is passed in as callbacks.
 */

import { Clock, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const statusStyles = {
  Active: 'text-red-400 bg-red-600/10 border-red-600/30',
  Controlled: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Fire Out': 'text-blue-400 bg-blue-600/10 border-blue-600/30',
  Done: 'text-gray-400 bg-gray-600/10 border-gray-600/30',
};

const alarmStyles = {
  '1st Alarm': 'text-yellow-400 border-yellow-600/40 bg-yellow-600/10',
  '2nd Alarm': 'text-orange-400 border-orange-600/40 bg-orange-600/10',
  '3rd Alarm': 'text-red-400 border-red-600/40 bg-red-600/10',
  '4th Alarm': 'text-red-400 border-red-600/40 bg-red-600/10',
  '5th Alarm': 'text-red-300 border-red-500 bg-red-600/20',
  'General Alarm': 'text-red-300 border-red-500 bg-red-600/20',
};

const styles = {
  card: 'bg-[#111] border border-[#1f1f1f] rounded-xl p-5 hover:border-red-600/30 transition-all cursor-pointer',
  topRow: 'flex items-start justify-between mb-3',
  idText: 'text-xs text-gray-500 mb-1',
  locationText: 'text-white font-semibold',
  occupancyText: 'text-xs text-gray-500 mt-0.5',
  badgesColumn: 'flex flex-col items-end gap-2',
  badgeBase: 'text-xs px-2 py-0.5 rounded border',
  editButton: 'flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40 transition-all',
  detailsList: 'space-y-1 mb-4',
  detailRow: 'flex items-center gap-2 text-gray-500 text-xs',
  actionRow: 'flex gap-2 flex-wrap',
  actionButtonBase: 'text-xs px-3 py-1 rounded border transition-all',
  controlledAction: 'border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/10',
  fireOutAction: 'border-blue-600/40 text-blue-400 hover:bg-blue-600/10',
  closeAction: 'border-gray-600/40 text-gray-400 hover:bg-gray-600/10',
  deleteAction: 'flex items-center gap-1 text-xs px-3 py-1 rounded border border-red-600/40 text-red-400 hover:bg-red-600/10 transition-all mt-2',
};

export default function IncidentCard({
  incident,
  canEdit,
  canDeleteDone,
  onOpenDetail,
  onOpenEdit,
  onRequestStatus,
  onRequestDelete,
}) {
  return (
    <article className={styles.card} onClick={() => onOpenDetail(incident.id)}>
      <div className={styles.topRow}>
        <div>
          <p className={styles.idText}>{incident.id?.slice(0, 8)?.toUpperCase()}</p>
          <h3 className={styles.locationText}>{incident.location_text}</h3>
          {incident.occupancy_type && (
            <p className={styles.occupancyText}>{incident.occupancy_type}</p>
          )}
        </div>

        <div className={styles.badgesColumn}>
          {incident.alarm_status && (
            <span
              className={`${styles.badgeBase} ${
                alarmStyles[incident.alarm_status] || alarmStyles['1st Alarm']
              }`}
            >
              {incident.alarm_status}
            </span>
          )}

          <span
            className={`${styles.badgeBase} ${
              statusStyles[incident.incident_status] || statusStyles.Active
            }`}
          >
            {incident.incident_status}
          </span>

          {canEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenEdit(incident);
              }}
              className={styles.editButton}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className={styles.detailsList}>
        {incident.date_time_reported && (
          <div className={styles.detailRow}>
            <Clock className="w-3 h-3" />
            <span>{format(new Date(incident.date_time_reported), 'MMM d, yyyy h:mm a')}</span>
          </div>
        )}
      </div>

      {canEdit && incident.incident_status === 'Active' && (
        <div className={styles.actionRow} onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => onRequestStatus(incident.id, 'Controlled')}
            className={`${styles.actionButtonBase} ${styles.controlledAction}`}
          >
            Mark Controlled
          </button>

          <button
            type="button"
            onClick={() => onRequestStatus(incident.id, 'Fire Out')}
            className={`${styles.actionButtonBase} ${styles.fireOutAction}`}
          >
            Fire Out
          </button>
        </div>
      )}

      {canEdit && incident.incident_status === 'Fire Out' && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRequestStatus(incident.id, 'Done');
          }}
          className={`${styles.actionButtonBase} ${styles.closeAction}`}
        >
          Close Incident
        </button>
      )}

      {canDeleteDone && incident.incident_status === 'Done' && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRequestDelete(incident.id);
          }}
          className={styles.deleteAction}
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      )}
    </article>
  );
}

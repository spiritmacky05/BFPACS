/**
 * features/incidents/components/IncidentsTable.jsx
 *
 * Table view for incidents.
 *
 * Why this component exists:
 * - Keeps list-mode markup independent from card-mode markup.
 * - Easier for new developers to modify one presentation mode at a time.
 */

import { format } from 'date-fns';

const statusStyles = {
  Active: 'text-red-400 bg-red-600/10 border-red-600/30',
  Controlled: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Fire Out': 'text-blue-400 bg-blue-600/10 border-blue-600/30',
  Done: 'text-gray-400 bg-gray-600/10 border-gray-600/30',
};

const styles = {
  wrapper: 'border border-[#1f1f1f] rounded-xl overflow-hidden',
  table: 'w-full',
  headerRow: 'border-b border-[#1f1f1f] bg-[#0a0a0a]',
  headerCell: 'px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase',
  bodyRow: 'border-b border-[#1f1f1f] hover:bg-[#0a0a0a] transition-all cursor-pointer',
  locationCell: 'px-4 py-3 text-sm text-white',
  alarmCell: 'px-4 py-3 text-xs text-orange-400',
  statusCell: 'px-4 py-3 text-xs',
  statusBadge: 'px-2 py-1 rounded border',
  dateCell: 'px-4 py-3 text-xs text-gray-500',
  actionsCell: 'px-4 py-3 text-xs',
  actionsRow: 'flex gap-2',
  editButton: 'px-2 py-1 rounded border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40 transition-all',
  deleteButton: 'px-2 py-1 rounded border border-red-600/40 text-red-400 hover:bg-red-600/10 transition-all',
};

const COLUMN_NAMES = ['Location', 'Alarm', 'Status', 'Reported', 'Actions'];

export default function IncidentsTable({
  incidents,
  canEdit,
  canDeleteDone,
  onOpenDetail,
  onOpenEdit,
  onRequestDelete,
}) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            {COLUMN_NAMES.map((columnName) => (
              <th key={columnName} className={styles.headerCell}>
                {columnName}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              className={styles.bodyRow}
              onClick={() => onOpenDetail(incident.id)}
            >
              <td className={styles.locationCell}>{incident.location_text}</td>
              <td className={styles.alarmCell}>{incident.alarm_status || '—'}</td>

              <td className={styles.statusCell}>
                <span
                  className={`${styles.statusBadge} ${
                    statusStyles[incident.incident_status] || statusStyles.Active
                  }`}
                >
                  {incident.incident_status}
                </span>
              </td>

              <td className={styles.dateCell}>
                {incident.date_time_reported
                  ? format(new Date(incident.date_time_reported), 'MMM d, h:mm a')
                  : '—'}
              </td>

              <td
                className={styles.actionsCell}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <div className={styles.actionsRow}>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onOpenEdit(incident)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                  )}

                  {canDeleteDone && incident.incident_status === 'Done' && (
                    <button
                      type="button"
                      onClick={() => onRequestDelete(incident.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

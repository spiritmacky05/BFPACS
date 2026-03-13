import { Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import {
  DUTY_STATUS_COLOR_BY_VALUE,
  RANK_COLOR_BY_VALUE,
} from '../lib/dutyPersonnel.constants';
import { parseCertification } from '../services/dutyPersonnelForm.service';

const styles = {
  loading: 'text-center text-gray-500 py-16',
  empty: 'text-center text-gray-600 py-16',
  tableCard: 'bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden',
  scrollWrap: 'overflow-x-auto',
  table: 'w-full text-sm',
  headerRow: 'border-b border-[#1f1f1f] bg-[#0d0d0d]',
  headerCell: 'text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-3',
  bodyRow: 'border-b border-[#1a1a1a] hover:bg-white/5 transition-all',
  rankCell: 'px-4 py-3 font-bold',
  nameCell: 'px-4 py-3 text-white font-medium',
  commanderBadge:
    'ml-2 text-xs text-yellow-400 border border-yellow-600/30 bg-yellow-600/10 px-1.5 py-0.5 rounded',
  valueCell: 'px-4 py-3 text-gray-400',
  statusCell: 'px-4 py-3',
  statusBadge: 'text-xs font-medium px-2 py-1 rounded-full border',
  certWrap: 'flex flex-wrap gap-1',
  certTag:
    'text-xs bg-red-900/30 text-red-400 border border-red-900/40 px-2 py-0.5 rounded',
  emptyTag: 'text-gray-600',
  actionsCell: 'px-4 py-3',
  actionRow: 'flex items-center gap-2',
  toggleButton:
    'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-red-600/50 hover:text-red-400 transition-all',
  editButton:
    'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-blue-600/50 hover:text-blue-400 transition-all',
  deleteButton:
    'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-red-600/50 hover:text-red-400 transition-all',
  actionIcon: 'w-3 h-3',
};

export default function DutyPersonnelList({
  isLoading,
  personnel,
  role,
  canModify,
  isAdmin,
  onToggleDuty,
  onEdit,
  onDelete,
}) {
  if (isLoading) {
    return <div className={styles.loading}>Loading personnel...</div>;
  }

  if (!personnel.length) {
    return <div className={styles.empty}>No personnel found</div>;
  }

  const tableHeaders = [
    'Rank',
    'Full Name',
    ...(role === 'superadmin' ? ['Station'] : []),
    'Shift',
    'Duty Status',
    'Training / Skills',
    canModify ? 'Actions' : '',
  ].filter(Boolean);

  return (
    <div className={styles.tableCard}>
      <div className={styles.scrollWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              {tableHeaders.map((header) => (
                <th key={header} className={styles.headerCell}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {personnel.map((member) => (
              <tr key={member.id} className={styles.bodyRow}>
                <td
                  className={`${styles.rankCell} ${
                    RANK_COLOR_BY_VALUE[member.rank] || 'text-gray-400'
                  }`}
                >
                  {member.rank}
                </td>

                <td className={styles.nameCell}>
                  {member.full_name}
                  {member.is_station_commander ? (
                    <span className={styles.commanderBadge}>Commander</span>
                  ) : null}
                </td>

                {role === 'superadmin' ? (
                  <td className={styles.valueCell}>
                    {member.station?.station_name || <span className={styles.emptyTag}>—</span>}
                  </td>
                ) : null}

                <td className={styles.valueCell}>{member.shift ?? '—'}</td>

                <td className={styles.statusCell}>
                  <span
                    className={`${styles.statusBadge} ${
                      DUTY_STATUS_COLOR_BY_VALUE[member.duty_status] ||
                      DUTY_STATUS_COLOR_BY_VALUE['Off Duty']
                    }`}
                  >
                    {member.duty_status}
                  </span>
                </td>

                <td className={styles.valueCell}>
                  {member.certification ? (
                    <div className={styles.certWrap}>
                      {parseCertification(member.certification).map((skill) => (
                        <span key={skill} className={styles.certTag}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.emptyTag}>—</span>
                  )}
                </td>

                {canModify ? (
                  <td className={styles.actionsCell}>
                    <div className={styles.actionRow}>
                      <button
                        type='button'
                        onClick={() => onToggleDuty(member)}
                        className={styles.toggleButton}
                      >
                        {member.duty_status === 'On Duty' ? (
                          <UserX className={styles.actionIcon} />
                        ) : (
                          <UserCheck className={styles.actionIcon} />
                        )}

                        {member.duty_status === 'On Duty' ? 'Off Duty' : 'On Duty'}
                      </button>

                      <button
                        type='button'
                        onClick={() => onEdit(member)}
                        className={styles.editButton}
                      >
                        <Pencil className={styles.actionIcon} />
                      </button>

                      {isAdmin ? (
                        <button
                          type='button'
                          onClick={() => onDelete(member)}
                          className={styles.deleteButton}
                        >
                          <Trash2 className={styles.actionIcon} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

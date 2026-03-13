import { Users } from 'lucide-react';

const styles = {
  wrapper: 'bg-[#111] border border-[#1f1f1f] rounded-xl p-6',
  title: 'text-white font-semibold mb-4 flex items-center gap-2',
  titleIcon: 'w-4 h-4 text-red-400',
  emptyText: 'text-gray-600 text-sm text-center py-6',
  tableWrapper: 'overflow-x-auto',
  table: 'w-full text-sm',
  theadTr: 'border-b border-[#1f1f1f]',
  th: 'text-left text-gray-500 text-xs uppercase tracking-wider pb-3 pr-4',
  tbody: 'divide-y divide-[#1a1a1a]',
  tr: 'hover:bg-white/2',
  tdName: 'py-3 pr-4 text-white font-medium',
  tdText: 'py-3 pr-4 text-gray-400',
  tdBadge: 'py-3',
  badge: 'text-xs px-2 py-0.5 rounded border text-green-400 border-green-600/30 bg-green-600/10',
};

export default function DashboardPersonnelTable({ onDutyPersonnel }) {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>
        <Users className={styles.titleIcon} /> Personnel On Duty
      </h3>

      {!onDutyPersonnel.length ? (
        <p className={styles.emptyText}>No personnel currently on duty</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.theadTr}>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Rank</th>
                <th className={styles.th}>Shift</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>

            <tbody className={styles.tbody}>
              {onDutyPersonnel.slice(0, 10).map((member) => (
                <tr key={member.id} className={styles.tr}>
                  <td className={styles.tdName}>{member.full_name}</td>
                  <td className={styles.tdText}>{member.rank}</td>
                  <td className={styles.tdText}>{member.shift ?? '—'}</td>
                  <td className={styles.tdBadge}>
                    <span className={styles.badge}>{member.duty_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

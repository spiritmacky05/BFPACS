import { Users } from 'lucide-react';

export default function PersonnelTable({ onDutyPersonnel, styles }) {
  return (
    <div className={styles.personnelLog.wrapper}>
      <h3 className={styles.personnelLog.title}>
        <Users className={styles.personnelLog.titleIcon} /> Personnel On Duty
      </h3>
      {!onDutyPersonnel.length ? (
        <p className={styles.personnelLog.emptyText}>No personnel currently on duty</p>
      ) : (
        <div className={styles.personnelLog.tableWrapper}>
          <table className={styles.personnelLog.table}>
            <thead>
              <tr className={styles.personnelLog.theadTr}>
                <th className={styles.personnelLog.th}>Name</th>
                <th className={styles.personnelLog.th}>Rank</th>
                <th className={styles.personnelLog.th}>Shift</th>
                <th className={styles.personnelLog.th}>Status</th>
              </tr>
            </thead>
            <tbody className={styles.personnelLog.tbody}>
              {onDutyPersonnel.slice(0, 10).map(p => (
                <tr key={p.id} className={styles.personnelLog.tr}>
                  <td className={styles.personnelLog.tdName}>{p.full_name}</td>
                  <td className={styles.personnelLog.tdText}>{p.rank}</td>
                  <td className={styles.personnelLog.tdText}>{p.shift ?? '—'}</td>
                  <td className={styles.personnelLog.tdBadge}>
                    <span className={styles.personnelLog.badge}>
                      {p.duty_status}
                    </span>
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

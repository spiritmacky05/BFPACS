/**
 * features/incidentDetail/components/InfoRow.jsx
 *
 * Small reusable row for label/value metadata.
 */

const styles = {
  row: 'flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-[#1f1f1f] last:border-0',
  label: 'text-gray-500 text-xs uppercase tracking-wider w-48 shrink-0',
  valueBase: 'text-sm',
  valueDefaultColor: 'text-white',
};

export default function InfoRow({ label, value, valueClass = styles.valueDefaultColor }) {
  if (!value && value !== 0) return null;

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.valueBase} ${valueClass}`}>{value}</span>
    </div>
  );
}

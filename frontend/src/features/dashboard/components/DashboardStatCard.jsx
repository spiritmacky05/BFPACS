const styles = {
  wrapper: 'bg-[#111] border border-[#1f1f1f] rounded-xl p-5 hover:border-red-600/30 transition-all',
  row: 'flex items-start justify-between',
  label: 'text-gray-500 text-xs uppercase tracking-widest mb-2',
  value: 'text-3xl font-bold text-white',
  sub: 'text-gray-500 text-xs mt-1',
  iconBox: 'w-10 h-10 rounded-lg border flex items-center justify-center',
};

const colorStyles = {
  red: 'text-red-400 bg-red-600/10 border-red-600/20',
  green: 'text-green-400 bg-green-600/10 border-green-600/20',
  yellow: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/20',
  blue: 'text-blue-400 bg-blue-600/10 border-blue-600/20',
};

export default function DashboardStatCard({ label, value, icon: Icon, color = 'red', sub }) {
  const iconColor = colorStyles[color] ?? colorStyles.red;

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <div>
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value}</p>
          {sub ? <p className={styles.sub}>{sub}</p> : null}
        </div>

        <div className={`${styles.iconBox} ${iconColor}`}>
          <Icon className='w-5 h-5' />
        </div>
      </div>
    </div>
  );
}

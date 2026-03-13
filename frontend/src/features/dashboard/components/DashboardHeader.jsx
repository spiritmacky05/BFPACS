import { Activity, Flame } from 'lucide-react';

const styles = {
  wrapper: 'bg-gradient-to-r from-red-950/50 to-[#111] border border-red-900/30 rounded-xl p-6',
  row: 'flex items-center gap-4',
  iconBox: 'w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center glow-red',
  icon: 'w-8 h-8 text-white',
  title: 'text-2xl font-bold text-white glow-text',
  subtitle: 'text-gray-400 text-sm mt-1',
  liveWrap: 'ml-auto hidden md:flex items-center gap-2',
  liveIcon: 'w-4 h-4 text-green-400 animate-pulse',
  liveText: 'text-green-400 text-sm font-medium',
};

export default function DashboardHeader() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <div className={styles.iconBox}>
          <Flame className={styles.icon} />
        </div>

        <div>
          <h2 className={styles.title}>Command Center Dashboard</h2>
          <p className={styles.subtitle}>Real-time monitoring — Bureau of Fire Protection</p>
        </div>

        <div className={styles.liveWrap}>
          <Activity className={styles.liveIcon} />
          <span className={styles.liveText}>LIVE</span>
        </div>
      </div>
    </div>
  );
}

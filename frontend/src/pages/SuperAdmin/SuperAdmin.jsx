/**
 * pages/SuperAdmin.jsx
 * Super admin panel — system stats and health check.
 */
import { useState, useEffect } from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import api from '@/api/client/client';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "space-y-6",
  
  header: {
    wrapper: "flex items-center gap-3",
    icon: "w-5 h-5 text-red-400",
    title: "text-white font-semibold text-lg"
  },
  
  card: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-6",
    title: "text-white font-medium mb-4 flex items-center gap-2",
    titleNoIcon: "text-white font-medium mb-3",
    titleIcon: "w-4 h-4 text-green-400",
    
    healthRowBase: "flex items-center gap-2 px-4 py-3 rounded-lg border",
    healthOk: "bg-green-600/10 border-green-600/30",
    healthError: "bg-red-600/10 border-red-600/30",
    healthDotBase: "w-2 h-2 rounded-full",
    healthDotOk: "bg-green-400",
    healthDotError: "bg-red-400",
    healthTextBase: "text-sm font-medium",
    healthTextOk: "text-green-400",
    healthTextError: "text-red-400",
    healthChecking: "text-gray-500 text-sm",
    
    infoFlex: "space-y-2 text-sm",
    infoRow: "flex justify-between text-gray-400",
    infoValue: "text-gray-300",
    infoMono: "text-gray-300 font-mono text-xs"
  }
};

export default function SuperAdmin() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then(setHealth)
      .catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header.wrapper}>
        <ShieldCheck className={styles.header.icon} />
        <h2 className={styles.header.title}>Super Admin Panel</h2>
      </div>

      {/* API Health */}
      <div className={styles.card.wrapper}>
        <h3 className={styles.card.title}>
          <Activity className={styles.card.titleIcon} /> API Health
        </h3>
        {health ? (
          <div className={`${styles.card.healthRowBase} ${
            health.status === 'ok' ? styles.card.healthOk : styles.card.healthError
          }`}>
            <div className={`${styles.card.healthDotBase} ${health.status === 'ok' ? styles.card.healthDotOk : styles.card.healthDotError}`} />
            <span className={`${styles.card.healthTextBase} ${health.status === 'ok' ? styles.card.healthTextOk : styles.card.healthTextError}`}>
              {health.status === 'ok' ? 'API Online — BFPACS Backend Running' : 'API Unreachable'}
            </span>
          </div>
        ) : (
          <div className={styles.card.healthChecking}>Checking...</div>
        )}
      </div>

      <div className={styles.card.wrapper}>
        <h3 className={styles.card.titleNoIcon}>Backend Info</h3>
        <div className={styles.card.infoFlex}>
          <div className={styles.card.infoRow}>
            <span>API Base URL</span>
            <span className={styles.card.infoMono}>{baseUrl}</span>
          </div>
          <div className={styles.card.infoRow}>
            <span>Framework</span>
            <span className={styles.card.infoValue}>Go / Gin</span>
          </div>
          <div className={styles.card.infoRow}>
            <span>Database</span>
            <span className={styles.card.infoValue}>PostgreSQL + PostGIS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
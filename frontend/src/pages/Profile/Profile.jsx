/**
 * pages/Profile.jsx
 * User profile and role switcher (for development).
 */
import { useAuth } from '@/context/AuthContext/AuthContext';
import { useState, useEffect } from 'react';
import { User, Shield, LogOut, Building2 } from 'lucide-react';
import { stationsApi } from '@/api/stations/stations';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "max-w-xl mx-auto space-y-6",
  
  card: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-6",
    headerRow: "flex items-center gap-4 mb-6",
    iconBox: "w-16 h-16 bg-red-600/20 border border-red-600/30 rounded-full flex items-center justify-center",
    icon: "w-8 h-8 text-red-400",
    title: "text-white font-semibold text-lg",
    subtitle: "text-gray-500 text-sm",
    
    bodyFlex: "space-y-4",
    roleRow: "flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f]",
    roleLabelFlex: "flex items-center gap-2 text-sm text-gray-400",
    roleIcon: "w-4 h-4 text-red-400",
    roleValue: "text-white text-sm font-medium capitalize",
    
    dangerBtn: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors border border-red-500/20 mt-6"
  }
};

export default function Profile() {
  const { user, role, logout } = useAuth();
  const [stationName, setStationName] = useState(null);

  useEffect(() => {
    if (user?.station_id) {
      stationsApi.getById(user.station_id)
        .then(s => setStationName(s?.station_name ?? null))
        .catch(() => {});
    }
  }, [user?.station_id]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card.wrapper}>
        <div className={styles.card.headerRow}>
          <div className={styles.card.iconBox}>
            <User className={styles.card.icon} />
          </div>
          <div>
            <div className={styles.card.title}>{user?.full_name || 'BFP User'}</div>
            <div className={styles.card.subtitle}>{user?.email || 'Bureau of Fire Protection'}</div>
          </div>
        </div>

        <div className={styles.card.bodyFlex}>
          <div className={styles.card.roleRow}>
            <div className={styles.card.roleLabelFlex}>
              <Shield className={styles.card.roleIcon} />
              Current Role
            </div>
            <span className={styles.card.roleValue}>{role}</span>
          </div>

          {user?.station_id && (
            <div className={styles.card.roleRow}>
              <div className={styles.card.roleLabelFlex}>
                <Building2 className={styles.card.roleIcon} />
                Assigned Station
              </div>
              <span className={styles.card.roleValue} style={{ textTransform: 'none' }}>
                {stationName || 'Loading...'}
              </span>
            </div>
          )}

          <button onClick={logout} className={styles.card.dangerBtn}>
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
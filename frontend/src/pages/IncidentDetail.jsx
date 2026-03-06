/**
 * pages/IncidentDetail.jsx
 * Detailed view of a single fire incident with dispatches and check-in log.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, Truck, Users } from 'lucide-react';
import { format }         from 'date-fns';
import { incidentsApi }   from '@/api/incidents';
import { dispatchesApi }  from '@/api/dispatches';
import { checkinApi }     from '@/api/checkin';
import PersonnelLink      from '@/components/PersonnelLink';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  loading: "text-center text-gray-500 py-16",
  pageContainer: "space-y-6",
  
  backBtn: "flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-all",
  backIcon: "w-4 h-4",
  
  header: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-6",
    topRow: "flex items-start justify-between mb-4",
    titleFlex: "flex items-start gap-4",
    iconBox: "w-12 h-12 bg-red-600/20 border border-red-600/30 rounded-xl flex items-center justify-center flex-shrink-0",
    icon: "w-6 h-6 text-red-400",
    title: "text-white font-bold text-xl",
    occupancy: "text-gray-500 text-sm mt-1",
    statusBadgeBase: "text-xs px-3 py-1 rounded border",
    
    infoGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4",
    infoLabel: "text-gray-500 text-xs uppercase tracking-wider mb-1",
    infoValue: "text-white text-sm",
    
    casualtyRow: "flex gap-4 mt-4 pt-4 border-t border-[#1f1f1f]",
    injured: "text-red-400 text-sm",
    rescued: "text-green-400 text-sm",
    boldCount: "font-bold"
  },
  
  panelsGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  
  panel: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-5",
    title: "text-white font-medium mb-4 flex items-center gap-2",
    titleIconRed: "w-4 h-4 text-red-400",
    titleIconGreen: "w-4 h-4 text-green-400",
    emptyText: "text-gray-600 text-sm text-center py-8",
    listSpaced: "space-y-3",
    listScrollable: "space-y-3 max-h-64 overflow-y-auto",
    
    dispatchItem: "border border-[#1f1f1f] rounded-lg p-3",
    dispatchStatus: "text-white text-sm font-medium",
    dispatchTime: "text-gray-500 text-xs mt-1",
    dispatchReport: "text-gray-400 text-xs mt-2 border-t border-[#1f1f1f] pt-2",
    
    checkinItem: "border border-[#1f1f1f] rounded-lg p-3",
    checkinName: "text-white text-sm font-medium",
    checkinRow: "flex items-center gap-2 mt-1",
    checkinBadge: "text-xs px-1.5 py-0.5 rounded border text-green-400 border-green-600/30 bg-green-600/10",
    checkinTime: "text-gray-500 text-xs"
  }
};

const STATUS_COLORS = {
  Active:     'text-red-400 bg-red-600/10 border-red-600/30',
  Controlled: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Fire Out': 'text-blue-400 bg-blue-600/10 border-blue-600/30',
  Done:       'text-gray-400 bg-gray-600/10 border-gray-600/30',
};

export default function IncidentDetail() {
  const [params]     = useSearchParams();
  const navigate     = useNavigate();
  const incidentId   = params.get('id');

  const [incident,   setIncident]   = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [checkins,   setCheckins]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!incidentId) return;
    Promise.all([
      incidentsApi.getById(incidentId),
      dispatchesApi.getByIncident(incidentId),
      checkinApi.getLogsForIncident(incidentId),
    ]).then(([inc, disp, ci]) => {
      setIncident(inc);
      setDispatches(disp ?? []);
      setCheckins(ci ?? []);
      setLoading(false);
    });
  }, [incidentId]);

  if (loading) return <div className={styles.loading}>Loading incident...</div>;
  if (!incident) return <div className={styles.loading}>Incident not found</div>;

  return (
    <div className={styles.pageContainer}>
      {/* Back button */}
      <button onClick={() => navigate(-1)}
        className={styles.backBtn}>
        <ChevronLeft className={styles.backIcon} /> Back to Incidents
      </button>

      {/* Incident Header */}
      <div className={styles.header.wrapper}>
        <div className={styles.header.topRow}>
          <div className={styles.header.titleFlex}>
            <div className={styles.header.iconBox}>
              <AlertTriangle className={styles.header.icon} />
            </div>
            <div>
              <h2 className={styles.header.title}>{incident.location_text}</h2>
              {incident.occupancy_type && (
                <div className={styles.header.occupancy}>{incident.occupancy_type}</div>
              )}
            </div>
          </div>
          <span className={`${styles.header.statusBadgeBase} ${STATUS_COLORS[incident.incident_status] ?? STATUS_COLORS.Active}`}>
            {incident.incident_status}
          </span>
        </div>

        <div className={styles.header.infoGrid}>
          {[
            { label: 'Alarm Status', value: incident.alarm_status },
            { label: 'Response Type', value: incident.response_type },
            { label: 'Ground Commander', value: incident.ground_commander },
            { label: 'Reported', value: incident.date_time_reported ? format(new Date(incident.date_time_reported), 'MMM d, h:mm a') : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className={styles.header.infoLabel}>{label}</div>
              <div className={styles.header.infoValue}>{value ?? '—'}</div>
            </div>
          ))}
        </div>

        {(incident.total_injured > 0 || incident.total_rescued > 0) && (
          <div className={styles.header.casualtyRow}>
            {incident.total_injured > 0 && (
              <div className={styles.header.injured}>Injured: <span className={styles.header.boldCount}>{incident.total_injured}</span></div>
            )}
            {incident.total_rescued > 0 && (
              <div className={styles.header.rescued}>Rescued: <span className={styles.header.boldCount}>{incident.total_rescued}</span></div>
            )}
          </div>
        )}
      </div>

      <div className={styles.panelsGrid}>
        {/* Dispatches */}
        <div className={styles.panel.wrapper}>
          <h3 className={styles.panel.title}>
            <Truck className={styles.panel.titleIconRed} /> Dispatched Units ({dispatches.length})
          </h3>
          {!dispatches.length ? (
            <div className={styles.panel.emptyText}>No units dispatched</div>
          ) : (
            <div className={styles.panel.listSpaced}>
              {dispatches.map(d => (
                <div key={d.id} className={styles.panel.dispatchItem}>
                  <div className={styles.panel.dispatchStatus}>{d.dispatch_status ?? 'En Route'}</div>
                  <div className={styles.panel.dispatchTime}>
                    {d.dispatched_at ? format(new Date(d.dispatched_at), 'h:mm a') : '—'}
                  </div>
                  {d.situational_report && (
                    <div className={styles.panel.dispatchReport}>{d.situational_report}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-in Log */}
        <div className={styles.panel.wrapper}>
          <h3 className={styles.panel.title}>
            <Users className={styles.panel.titleIconGreen} /> Check-in Log ({checkins.length})
          </h3>
          {!checkins.length ? (
            <div className={styles.panel.emptyText}>No check-ins recorded</div>
          ) : (
            <div className={styles.panel.listScrollable}>
              {checkins.map(c => (
                <div key={c.id} className={styles.panel.checkinItem}>
                  <div className={styles.panel.checkinName}>
                    <PersonnelLink
                      id={c.personnel_id}
                      name={c.personnel?.full_name ?? c.personnel_id}
                      className="text-white font-medium"
                    />
                  </div>
                  <div className={styles.panel.checkinRow}>
                    <span className={styles.panel.checkinBadge}>
                      {c.check_in_method}
                    </span>
                    <span className={styles.panel.checkinTime}>{new Date(c.check_in_time).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/**
 * features/incidentDetail/pages/IncidentDetailPage.jsx
 *
 * Container page for Incident Detail feature.
 *
 * Responsibilities:
 * - Compose presentational components.
 * - Wire hook state/actions to the UI.
 * - Keep page flow intern-friendly and incremental.
 */

import { format, isValid } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  Navigation,
  Shield,
  Users,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils/navigation';
import ConfirmationModal from '@/features/shared/components/ConfirmationModal';
import IncidentEditModal from '@/features/incidents/components/IncidentEditModal';
import StatusHistoryPanel from '../components/StatusHistoryPanel';
import PersonnelBreakdownDashboard from '../components/PersonnelBreakdownDashboard';
import FleetForIncidentDashboard from '../components/FleetForIncidentDashboard';
import EquipmentForIncidentDashboard from '../components/EquipmentForIncidentDashboard';
import CommunityReportsPanel from '../components/CommunityReportsPanel';
import ACSCheckInPortal from '../components/ACSCheckInPortal';
import useIncidentDetail from '../hooks/useIncidentDetail';
import IncidentDetailHeader from '../components/IncidentDetailHeader';
import IncidentDetailCard from '../components/IncidentDetailCard';
import InfoRow from '../components/InfoRow';
import MapView from '@/features/shared/components/MapView';

const styles = {
  page: 'max-w-3xl mx-auto space-y-6',
  loading: 'flex items-center justify-center h-64 text-gray-500',
  notFoundWrap: 'text-center text-gray-600 py-24',
  notFoundText: 'text-red-400 text-sm mt-2 inline-block hover:underline',
  sectionNavWrap: 'sticky top-0 z-10 -mx-4 lg:-mx-6 px-4 lg:px-6 bg-[#0a0a0a] border-b border-[#1f1f1f] py-2',
  sectionNavRow: 'flex gap-1 overflow-x-auto',
  sectionNavButton:
    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
  sectionNavButtonActive: 'bg-red-600/20 border border-red-600/40 text-red-400',
  sectionNavButtonInactive:
    'text-gray-500 hover:text-white border border-transparent hover:border-[#2a2a2a]',
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  locationButtons: 'flex gap-2 pt-3 flex-wrap',
  navBlueButton:
    'flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
  navPurpleButton:
    'flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
  commandEmpty: 'text-gray-700 text-xs',
  casualtiesWrap: 'flex gap-6 mt-2',
  casualtyItem: 'text-center',
  casualtyValueRed: 'text-3xl font-bold text-red-400',
  casualtyValueGreen: 'text-3xl font-bold text-green-400',
  casualtyLabel: 'text-xs text-gray-500 mt-1',
  hiddenPrintContainer: 'hidden',
  historyCard: 'bg-[#111] border border-[#1f1f1f] rounded-xl p-5 scroll-mt-16',
  historyTitle:
    'flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4',
  iconLarge: 'w-10 h-10 mx-auto mb-3 text-gray-700',
  iconSmall: 'w-3.5 h-3.5',
  sectionOffset: 'scroll-mt-16',
  rowValueOrange: 'text-orange-400',
  rowValueCoordinates: 'text-gray-400 font-mono text-xs',
  mediaWrap: 'rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-3',
  mediaImage: 'w-full max-h-80 object-cover rounded-lg border border-[#2a2a2a]',
  mediaPlaceholder: 'h-52 rounded-lg border border-dashed border-[#2f2f2f] flex items-center justify-center text-gray-500 text-sm',
};

const safeFormat = (date, formatStr) => {
  if (!date) return '—';
  const d = new Date(date);
  if (!isValid(d)) return '—';
  return format(d, formatStr);
};

const TAB_ICON_BY_ID = {
  overview: LayoutGrid,
  personnel: Users,
  fleet: Activity,
  equipment: FileText,
  history: Activity,
};

export default function IncidentDetailPage() {
  const {
    incidentId,
    incident,
    isLoading,
    isAdmin,
    myStation,
    isEditOpen,
    setIsEditOpen,
    isAcsPortalOpen,
    setIsAcsPortalOpen,
    checkInVersion,
    setCheckInVersion,
    activeTabId,
    pendingAction,
    cancelPendingAction,
    requestStatusChange,
    printIncidentReport,
    loadIncident,
    tabs,
    refs,
    scrollToSection,
    constants,
    printableContent,
  } = useIncidentDetail();

  if (isLoading) {
    return <div className={styles.loading}>Loading incident data...</div>;
  }

  if (!incident) {
    return (
      <div className={styles.notFoundWrap}>
        <AlertTriangle className={styles.iconLarge} />
        <p>Incident not found.</p>
        <Link to={createPageUrl('Incidents')} className={styles.notFoundText}>
          ← Back to Incidents
        </Link>
      </div>
    );
  }

  const destination = incident.lat && incident.lng ? `${incident.lat},${incident.lng}` : '';
  const origin =
    myStation?.lat != null && myStation?.lng != null
      ? `${myStation.lat},${myStation.lng}`
      : '';

  const googleUrl = destination
    ? origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
    : '';

  const wazeUrl = destination
    ? `https://waze.com/ul?ll=${destination}&navigate=yes`
    : '';

  return (
    <div className={styles.page}>
      <IncidentDetailHeader
        incident={incident}
        isAdmin={isAdmin}
        statusColors={constants.STATUS_COLORS}
        onEdit={() => setIsEditOpen(true)}
        onMarkControlled={() =>
          requestStatusChange(constants.INCIDENT_DETAIL_STATUS.CONTROLLED)
        }
        onMarkFireOut={() =>
          requestStatusChange(constants.INCIDENT_DETAIL_STATUS.FIRE_OUT)
        }
        onCloseIncident={() => requestStatusChange(constants.INCIDENT_DETAIL_STATUS.DONE)}
        onOpenAcsPortal={() => setIsAcsPortalOpen(true)}
        onPrint={printIncidentReport}
      />

      <div className={styles.sectionNavWrap}>
        <div className={styles.sectionNavRow}>
          {tabs.map((tab) => {
            const Icon = TAB_ICON_BY_ID[tab.id];
            const isActive = activeTabId === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id, tab.ref)}
                className={`${styles.sectionNavButton} ${
                  isActive
                    ? styles.sectionNavButtonActive
                    : styles.sectionNavButtonInactive
                }`}
              >
                {Icon ? <Icon className={styles.iconSmall} /> : null}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={refs.overviewRef} className={styles.sectionOffset}>
        <IncidentDetailCard title="Overview" Icon={LayoutGrid}>
          <InfoRow
            label="Reported At"
            value={safeFormat(incident.date_time_reported, 'MMM d, yyyy h:mm a')}
          />
          <InfoRow label="Response Type" value={incident.response_type} />
          <InfoRow
            label="Alarm Status"
            value={incident.alarm_status}
            valueClass={styles.rowValueOrange}
          />
        </IncidentDetailCard>

        <div className="mt-4">
          <IncidentDetailCard title="Incident Image" Icon={ImageIcon}>
            <div className={styles.mediaWrap}>
              {incident.image_data_url ? (
                <img
                  src={incident.image_data_url}
                  alt="Incident attachment"
                  className={styles.mediaImage}
                />
              ) : (
                <div className={styles.mediaPlaceholder}>No image attached for this incident.</div>
              )}
            </div>
          </IncidentDetailCard>
        </div>
      </div>

      <div ref={refs.personnelRef} className={styles.sectionOffset}>
        <PersonnelBreakdownDashboard key={checkInVersion} incidentId={incidentId} />
      </div>

      <div className={styles.grid}>
        <div>
          {incident.lat && incident.lng && (
            <div className="mb-4">
              <MapView 
                markers={[{
                  lat: incident.lat,
                  lng: incident.lng,
                  type: 'incident',
                  label: incident.location_text,
                  sub: `${incident.alarm_status} · ${incident.incident_status}`
                }]} 
                height="250px" 
                zoom={16} 
              />
            </div>
          )}
          <IncidentDetailCard title="Location" Icon={MapPin}>
            <InfoRow label="Address" value={incident.location_text} />
            <InfoRow label="Type of Occupancy" value={incident.occupancy_type} />
            {incident.lat && incident.lng && (
              <InfoRow
                label="Coordinates"
                value={`${incident.lat}, ${incident.lng}`}
                valueClass={styles.rowValueCoordinates}
              />
            )}

            {destination && (
              <div className={styles.locationButtons}>
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.navBlueButton}
                >
                  <Navigation className={styles.iconSmall} />
                  Google Maps
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.navPurpleButton}
                >
                  <Navigation className={styles.iconSmall} />
                  Waze
                </a>
              </div>
            )}
          </IncidentDetailCard>
        </div>

        <IncidentDetailCard title="Command" Icon={Shield}>
          <InfoRow label="Ground Commander" value={incident.ground_commander} />
          <InfoRow label="ICS Commander" value={incident.ics_commander} />

          {!incident.ground_commander && !incident.ics_commander && (
            <p className={styles.commandEmpty}>No command data recorded.</p>
          )}
        </IncidentDetailCard>

      </div>

      <IncidentDetailCard title="Casualties" Icon={Users}>
        <div className="grid grid-cols-2 gap-4">
          <div className={styles.casualtyItem}>
            <div className={styles.casualtyValueRed}>{incident.total_injured ?? 0}</div>
            <div className={styles.casualtyLabel}>Injured</div>
          </div>
          <div className={styles.casualtyItem}>
            <div className={styles.casualtyValueGreen}>{incident.total_rescued ?? 0}</div>
            <div className={styles.casualtyLabel}>Rescued</div>
          </div>
        </div>
      </IncidentDetailCard>

      <div ref={refs.fleetRef} className={styles.sectionOffset}>
        <FleetForIncidentDashboard key={checkInVersion} incidentId={incidentId} />
      </div>

      <div ref={refs.equipmentRef} className={styles.sectionOffset}>
        <EquipmentForIncidentDashboard key={checkInVersion} incidentId={incidentId} />
      </div>

      <CommunityReportsPanel incidentId={incidentId} />

      <div
        ref={refs.printContainerRef}
        className={styles.hiddenPrintContainer}
        dangerouslySetInnerHTML={{ __html: printableContent }}
      />

      <div ref={refs.historyRef} className={styles.historyCard}>
        <div className={styles.historyTitle}>
          <Activity className={styles.iconSmall} />
          Incident Activity
        </div>
        <StatusHistoryPanel incident={incident} />
      </div>

      {isAcsPortalOpen && (
        <ACSCheckInPortal
          incidentId={incidentId}
          onClose={() => setIsAcsPortalOpen(false)}
          onCheckInComplete={() => {
            setIsAcsPortalOpen(false);
            setCheckInVersion((value) => value + 1);
            loadIncident();
          }}
        />
      )}

      {pendingAction && (
        <ConfirmationModal
          title={pendingAction.title}
          message={pendingAction.message}
          confirmText={pendingAction.confirmText}
          isDangerous={pendingAction.isDangerous}
          onConfirm={pendingAction.onConfirm}
          onCancel={cancelPendingAction}
        />
      )}

      {isEditOpen && (
        <IncidentEditModal
          incident={incident}
          onClose={() => setIsEditOpen(false)}
          onSaved={() => {
            setIsEditOpen(false);
            loadIncident();
          }}
        />
      )}
    </div>
  );
}

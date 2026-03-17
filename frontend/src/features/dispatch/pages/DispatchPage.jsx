/**
 * features/dispatch/pages/DispatchPage.jsx
 *
 * Container page for Dispatch feature.
 *
 * Responsibilities:
 * - Compose dispatch feature sections.
 * - Wire hook state/actions into presentational components.
 */

import { ClipboardList, Package, UserCheck } from 'lucide-react';
import { useAuth } from '@/features/auth';
import useDispatchPage from '../hooks/useDispatchPage';
import DispatchToolbar from '../components/DispatchToolbar';
import DispatchFilterSortPanel from '../components/DispatchFilterSortPanel';
import DispatchPersonnelCard from '../components/DispatchPersonnelCard';
import DispatchList from '../components/DispatchList';
import DispatchCreateModal from '../components/DispatchCreateModal';

const EQUIPMENT_STATUS_CLASS = {
  Serviceable: 'text-green-400 bg-green-600/10 border-green-600/30',
  Borrowed: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Under Maintenance': 'text-orange-400 bg-orange-600/10 border-orange-600/30',
  Condemned: 'text-red-400 bg-red-600/10 border-red-600/30',
};

const styles = {
  page: 'space-y-6',
  loading: 'text-center text-gray-500 py-16',
  card: 'bg-[#111] border border-[#1f1f1f] rounded-xl p-5',
  sectionHeader: 'flex items-center justify-between mb-4',
  sectionTitle: 'text-white font-medium text-sm flex items-center gap-2',
  sectionIcon: 'w-4 h-4 text-red-400',
  countBadge:
    'ml-1 text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full font-normal',
  selectLabel: 'block text-gray-400 text-xs uppercase tracking-wider mb-2',
  select:
    'w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none',
  emptyText: 'text-gray-600 text-sm',
  personnelGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
  equipmentGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
  equipmentCard: 'bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3.5 flex flex-col gap-2',
  equipmentHeader: 'flex items-start justify-between gap-2',
  equipmentNameWrap: 'min-w-0',
  equipmentName: 'text-white text-sm font-semibold truncate',
  equipmentQty: 'text-gray-500 text-xs mt-0.5',
  equipmentBadge: 'flex-shrink-0 text-xs px-2 py-0.5 rounded border',
  equipmentStation: 'pt-1 border-t border-[#1f1f1f] text-xs text-gray-500 truncate',
  equipmentBorrower: 'text-xs text-yellow-400/80',
};

export default function DispatchPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const {
    isLoading,
    isDispatching,
    incidents,
    dispatches,
    selectedIncident,
    selectedIncidentId,
    setSelectedIncidentId,
    availableResponders,
    selectedResponderIds,
    toggleResponderSelection,
    dispatchNotes,
    setDispatchNotes,
    personnel,
    filteredPersonnel,
    personnelFilterOptions,
    personnelFilters,
    updatePersonnelFilter,
    personnelSortBy,
    setPersonnelSortBy,
    equipment,
    filteredEquipment,
    equipmentFilterOptions,
    equipmentFilters,
    updateEquipmentFilter,
    equipmentSortBy,
    setEquipmentSortBy,
    stationMapById,
    isCreateModalOpen,
    setIsCreateModalOpen,
    submitDispatchOrder,
    expandedDispatchRows,
    toggleDispatchRowExpansion,
    updateDispatchStatus,
    refreshDispatches,
  } = useDispatchPage();

  if (isLoading) {
    return <div className={styles.loading}>Loading dispatch...</div>;
  }

  return (
    <section className={styles.page}>
      <DispatchToolbar canCreate={isAdmin} onCreate={() => setIsCreateModalOpen(true)} />

      <div className={styles.card}>
        <label className={styles.selectLabel}>Active Incident</label>

        {!incidents.length ? (
          <p className={styles.emptyText}>No active incidents</p>
        ) : (
          <select
            value={selectedIncidentId}
            onChange={(event) => setSelectedIncidentId(event.target.value)}
            className={styles.select}
          >
            {incidents.map((incident) => (
              <option key={incident.id} value={incident.id}>
                {incident.location_text} — {incident.alarm_status}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <UserCheck className={styles.sectionIcon} />
            Duty Personnel

            <span className={styles.countBadge}>
              {
                filteredPersonnel.filter((member) => member.duty_status === 'On Duty')
                  .length
              }{' '}
              on duty
            </span>
          </h3>
        </div>

        {isAdmin ? (
          <DispatchFilterSortPanel
            stationOptions={personnelFilterOptions.stations}
            cityOptions={personnelFilterOptions.cities}
            districtOptions={personnelFilterOptions.districts}
            regionOptions={personnelFilterOptions.regions}
            filters={personnelFilters}
            onFilterChange={updatePersonnelFilter}
            sortBy={personnelSortBy}
            onSortChange={setPersonnelSortBy}
          />
        ) : null}

        {!personnel.length ? (
          <p className={styles.emptyText}>No personnel data available</p>
        ) : filteredPersonnel.length === 0 ? (
          <p className={styles.emptyText}>No personnel match the selected filters</p>
        ) : (
          <div className={styles.personnelGrid}>
            {filteredPersonnel.map((member) => (
              <DispatchPersonnelCard key={member.id} personnel={member} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Package className={styles.sectionIcon} />
            Equipment
            <span className={styles.countBadge}>
              {filteredEquipment.length} item{filteredEquipment.length !== 1 ? 's' : ''}
            </span>
          </h3>
        </div>

        {isAdmin ? (
          <DispatchFilterSortPanel
            stationOptions={equipmentFilterOptions.stations}
            cityOptions={equipmentFilterOptions.cities}
            districtOptions={equipmentFilterOptions.districts}
            regionOptions={equipmentFilterOptions.regions}
            filters={equipmentFilters}
            onFilterChange={updateEquipmentFilter}
            sortBy={equipmentSortBy}
            onSortChange={setEquipmentSortBy}
          />
        ) : null}

        {!equipment.length ? (
          <p className={styles.emptyText}>No equipment data available</p>
        ) : filteredEquipment.length === 0 ? (
          <p className={styles.emptyText}>No equipment matches the selected filters</p>
        ) : (
          <div className={styles.equipmentGrid}>
            {filteredEquipment.map((item) => {
              const station = stationMapById[item.station_id];
              const badgeClass =
                EQUIPMENT_STATUS_CLASS[item.status] ??
                'text-gray-400 bg-gray-600/10 border-gray-600/30';

              return (
                <div key={item.id} className={styles.equipmentCard}>
                  <div className={styles.equipmentHeader}>
                    <div className={styles.equipmentNameWrap}>
                      <div className={styles.equipmentName}>{item.equipment_name}</div>
                      <div className={styles.equipmentQty}>Qty: {item.quantity}</div>
                    </div>

                    <span className={`${styles.equipmentBadge} ${badgeClass}`}>
                      {item.status}
                    </span>
                  </div>

                  {station ? (
                    <div className={styles.equipmentStation}>
                      {station.station_name}
                      {station.city ? ` · ${station.city}` : ''}
                    </div>
                  ) : null}

                  {item.borrower_name ? (
                    <div className={styles.equipmentBorrower}>
                      Borrowed by: {item.borrower_name}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DispatchList
        dispatches={dispatches}
        incident={selectedIncident}
        incidentId={selectedIncidentId}
        isAdmin={isAdmin}
        expandedRows={expandedDispatchRows}
        onToggleRow={toggleDispatchRowExpansion}
        onUpdateStatus={updateDispatchStatus}
        onRefresh={refreshDispatches}
      />

      <DispatchCreateModal
        isOpen={isCreateModalOpen}
        incidents={incidents}
        selectedIncidentId={selectedIncidentId}
        onChangeIncident={setSelectedIncidentId}
        availableResponders={availableResponders}
        selectedResponderIds={selectedResponderIds}
        onToggleResponder={toggleResponderSelection}
        notes={dispatchNotes}
        onChangeNotes={setDispatchNotes}
        isSubmitting={isDispatching}
        onSubmit={submitDispatchOrder}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </section>
  );
}

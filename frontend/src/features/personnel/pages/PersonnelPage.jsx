/**
 * features/personnel/pages/PersonnelPage.jsx
 *
 * Main Personnel management page.
 */

import React from 'react';
import { useAuth } from '@/features/auth';
import PersonnelToolbar from '../components/PersonnelToolbar';
import PersonnelSearchBar from '../components/PersonnelSearchBar';
import PersonnelStatusFilter from '../components/PersonnelStatusFilter';
import PersonnelFilterSortPanel from '../components/PersonnelFilterSortPanel';
import PersonnelList from '../components/PersonnelList';
import PersonnelFormModal from '../components/PersonnelFormModal';
import PersonnelConfirmModal from '../components/PersonnelConfirmModal';
import { usePersonnel } from '../hooks/usePersonnel';

const styles = {
  page: 'w-full min-h-screen bg-black text-white p-4 md:p-6',
  container: 'max-w-7xl mx-auto space-y-4',
};

export default function PersonnelPage() {
  const { role } = useAuth();

  const isAdmin = role === 'superadmin' || role === 'admin';
  const canModify = role === 'superadmin' || role === 'admin' || role === 'user';

  const {
    isLoading,
    onDutyCount,
    offDutyCount,
    personnel,
    filteredPersonnel,
    stations,
    searchValue,
    setSearchValue,
    dutyStatusFilter,
    setDutyStatusFilter,
    locationFilters,
    updateLocationFilter,
    locationSortBy,
    setLocationSortBy,
    locationOptions,
    isFormOpen,
    editingPersonnelId,
    form,
    setForm,
    selectedSkills,
    toggleSkill,
    openCreateModal,
    openEditModal,
    closeFormModal,
    submitPersonnelForm,
    isSaving,
    pendingConfirmation,
    askDelete,
    askToggleDutyStatus,
    cancelConfirmation,
  } = usePersonnel();

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((previousForm) => ({ ...previousForm, [name]: value }));
  }

  async function handleConfirmAction() {
    if (!pendingConfirmation?.onConfirm) {
      return;
    }
    await pendingConfirmation.onConfirm();
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PersonnelToolbar
          onDutyCount={onDutyCount}
          offDutyCount={offDutyCount}
          totalCount={personnel.length}
          canModify={canModify}
          onOpenCreate={openCreateModal}
        />

        <PersonnelSearchBar value={searchValue} onChange={setSearchValue} />

        {isAdmin ? (
          <PersonnelFilterSortPanel
            stationOptions={locationOptions.stations}
            cityOptions={locationOptions.cities}
            districtOptions={locationOptions.districts}
            regionOptions={locationOptions.regions}
            filters={locationFilters}
            onFilterChange={updateLocationFilter}
            sortBy={locationSortBy}
            onSortChange={setLocationSortBy}
          />
        ) : null}

        <PersonnelStatusFilter value={dutyStatusFilter} onChange={setDutyStatusFilter} />

        <PersonnelList
          isLoading={isLoading}
          personnel={filteredPersonnel}
          role={role}
          canModify={canModify}
          isAdmin={isAdmin}
          onToggleDuty={askToggleDutyStatus}
          onEdit={openEditModal}
          onDelete={askDelete}
        />
      </div>

      {isFormOpen && (
        <PersonnelFormModal
          isEditing={Boolean(editingPersonnelId)}
          isSaving={isSaving}
          form={form}
          selectedSkills={selectedSkills}
          stations={stations}
          isAdmin={isAdmin}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onToggleSkill={toggleSkill}
          onSubmit={submitPersonnelForm}
        />
      )}

      {pendingConfirmation && (
        <PersonnelConfirmModal
          title={pendingConfirmation.title}
          message={pendingConfirmation.message}
          confirmText='Yes'
          confirmType='danger'
          onCancel={cancelConfirmation}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}

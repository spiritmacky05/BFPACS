import { useAuth } from '@/context/AuthContext/AuthContext';
import DutyPersonnelToolbar from '../components/DutyPersonnelToolbar';
import DutyPersonnelSearchBar from '../components/DutyPersonnelSearchBar';
import DutyPersonnelStatusFilter from '../components/DutyPersonnelStatusFilter';
import DutyPersonnelFilterSortPanel from '../components/DutyPersonnelFilterSortPanel';
import DutyPersonnelList from '../components/DutyPersonnelList';
import DutyPersonnelFormModal from '../components/DutyPersonnelFormModal';
import DutyPersonnelConfirmModal from '../components/DutyPersonnelConfirmModal';
import useDutyPersonnelPage from '../hooks/useDutyPersonnelPage';

const styles = {
  page: 'w-full min-h-screen bg-black text-white p-4 md:p-6',
  container: 'max-w-7xl mx-auto space-y-4',
};

export default function DutyPersonnelPage() {
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
  } = useDutyPersonnelPage();

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
        <DutyPersonnelToolbar
          onDutyCount={onDutyCount}
          offDutyCount={offDutyCount}
          totalCount={personnel.length}
          canModify={canModify}
          onOpenCreate={openCreateModal}
        />

        <DutyPersonnelSearchBar value={searchValue} onChange={setSearchValue} />

        {isAdmin ? (
          <DutyPersonnelFilterSortPanel
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

        <DutyPersonnelStatusFilter value={dutyStatusFilter} onChange={setDutyStatusFilter} />

        <DutyPersonnelList
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

      {isFormOpen ? (
        <DutyPersonnelFormModal
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
      ) : null}

      {pendingConfirmation ? (
        <DutyPersonnelConfirmModal
          title={pendingConfirmation.title}
          message={pendingConfirmation.message}
          confirmText='Yes'
          confirmType='danger'
          onCancel={cancelConfirmation}
          onConfirm={handleConfirmAction}
        />
      ) : null}
    </div>
  );
}

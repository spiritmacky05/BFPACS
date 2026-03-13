/**
 * features/incidents/pages/IncidentsPage.jsx
 *
 * Container page for incident management.
 *
 * Responsibilities:
 * - Compose feature components.
 * - Read data/actions from `useIncidentsPage`.
 * - Keep render flow very clear for beginner contributors.
 */

import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/context/AuthContext/AuthContext';
import ConfirmationModal from '@/components/common/ConfirmationModal/ConfirmationModal';
import IncidentEditModal from '@/components/incidents/IncidentEditModal/IncidentEditModal';
import useIncidentsPage from '../hooks/useIncidentsPage';
import IncidentsToolbar from '../components/IncidentsToolbar';
import IncidentsList from '../components/IncidentsList';
import IncidentCreateModal from '../components/IncidentCreateModal';

const styles = {
  page: 'space-y-6',
  errorCard: 'rounded-xl border border-red-700/30 bg-red-900/10 p-4',
  errorTitle: 'text-sm font-semibold text-red-300',
  errorMessage: 'mt-1 text-xs text-red-200/90',
};

/**
 * Helper text for confirmation dialog.
 *
 * Why this mapping exists:
 * - Keeps the JSX clean.
 * - Makes wording easy to update in one place.
 */
function getConfirmationCopy(pendingAction) {
  if (!pendingAction) {
    return {
      title: 'Confirm Action',
      message: 'Are you sure you want to continue?',
      confirmText: 'Confirm',
      isDangerous: false,
    };
  }

  if (pendingAction.type === 'delete') {
    return {
      title: 'Delete Incident',
      message: 'This will permanently remove the incident record. Continue?',
      confirmText: 'Delete Incident',
      isDangerous: true,
    };
  }

  const statusLabel = pendingAction.nextStatus;

  return {
    title: `Set Status to ${statusLabel}`,
    message: `Are you sure you want to update the incident status to ${statusLabel}?`,
    confirmText: `Set ${statusLabel}`,
    isDangerous: statusLabel === 'Done',
  };
}

export default function IncidentsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const {
    VIEW_MODE,
    incidents,
    isLoadingIncidents,
    incidentsError,
    selectedStatusFilter,
    setSelectedStatusFilter,
    viewMode,
    setViewMode,
    isCreateModalOpen,
    editingIncident,
    setEditingIncident,
    pendingAction,
    createForm,
    isCreatingIncident,
    isUpdatingStatus,
    isDeletingIncident,
    openCreateModal,
    closeCreateModal,
    updateCreateFormField,
    submitCreateForm,
    requestStatusChange,
    requestDeleteIncident,
    confirmPendingAction,
    cancelPendingAction,
  } = useIncidentsPage();

  // Role flags used by child components.
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSuperAdmin = role === 'superadmin';

  const confirmationCopy = getConfirmationCopy(pendingAction);

  const isPendingActionBusy = isUpdatingStatus || isDeletingIncident;

  function handleOpenIncidentDetail(incidentId) {
    navigate(createPageUrl(`IncidentDetail?id=${incidentId}`));
  }

  return (
    <section className={styles.page}>
      <IncidentsToolbar
        selectedStatusFilter={selectedStatusFilter}
        onSelectStatusFilter={setSelectedStatusFilter}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        canCreate={isAdmin}
        onOpenCreate={openCreateModal}
      />

      {incidentsError && (
        <div className={styles.errorCard}>
          <p className={styles.errorTitle}>Could not load incidents.</p>
          <p className={styles.errorMessage}>{incidentsError.message}</p>
        </div>
      )}

      <IncidentsList
        incidents={incidents}
        isLoading={isLoadingIncidents}
        viewMode={viewMode}
        canEdit={isAdmin}
        canDeleteDone={isSuperAdmin}
        onOpenDetail={handleOpenIncidentDetail}
        onOpenEdit={setEditingIncident}
        onRequestStatus={requestStatusChange}
        onRequestDelete={requestDeleteIncident}
      />

      <IncidentCreateModal
        isOpen={isCreateModalOpen}
        form={createForm}
        isSaving={isCreatingIncident}
        onClose={closeCreateModal}
        onChangeField={updateCreateFormField}
        onSubmit={submitCreateForm}
      />

      {pendingAction && (
        <ConfirmationModal
          title={confirmationCopy.title}
          message={confirmationCopy.message}
          confirmText={isPendingActionBusy ? 'Working...' : confirmationCopy.confirmText}
          isDangerous={confirmationCopy.isDangerous}
          onConfirm={confirmPendingAction}
          onCancel={cancelPendingAction}
        />
      )}

      {editingIncident && (
        <IncidentEditModal
          incident={editingIncident}
          onClose={() => setEditingIncident(null)}
          onSaved={() => setEditingIncident(null)}
        />
      )}

      {/*
        Optional beginner tip:
        Keep this check explicit so interns can quickly understand which mode is active.
      */}
      {viewMode === VIEW_MODE.TABLE ? null : null}
    </section>
  );
}

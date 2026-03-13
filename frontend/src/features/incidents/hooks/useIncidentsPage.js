/**
 * features/incidents/hooks/useIncidentsPage.js
 *
 * Container hook for Incidents page.
 *
 * Responsibilities:
 * - Manage page-level UI state (filter, view mode, modals).
 * - Read server data through React Query.
 * - Call service/API for mutations.
 * - Keep page component focused on rendering.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '../api/incidents.api';
import {
  applyIncidentStatusWorkflow,
  INCIDENT_STATUS,
} from '../services/incidentStatusWorkflow.service';
import { incidentsQueryKeys } from '../lib/queryKeys';

/**
 * Local view modes for this page.
 */
const VIEW_MODE = {
  CARD: 'card',
  TABLE: 'table',
};

/**
 * Shared default form for "create incident" modal.
 */
const EMPTY_INCIDENT_FORM = {
  location_text: '',
  alarm_status: '1st Alarm',
  response_type: 'Fire Incident',
  occupancy_type: '',
  involved_type: '',
  lat: '',
  lng: '',
  date_time_reported: '',
};

/**
 * A small helper that decides whether an incident belongs to a filter.
 */
function isIncidentVisibleForFilter(incident, selectedStatusFilter) {
  if (selectedStatusFilter === 'All') {
    return incident?.incident_status !== INCIDENT_STATUS.DONE;
  }

  return incident?.incident_status === selectedStatusFilter;
}

export function useIncidentsPage() {
  const queryClient = useQueryClient();

  // -----------------------------
  // UI state (page-only state)
  // -----------------------------
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState(VIEW_MODE.CARD);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_INCIDENT_FORM);

  // -----------------------------
  // Server state (React Query)
  // -----------------------------
  const incidentsQuery = useQuery({
    queryKey: incidentsQueryKeys.list({ selectedStatusFilter }),
    queryFn: incidentsApi.list,
  });

  // -----------------------------
  // Derived state
  // -----------------------------
  const visibleIncidents = useMemo(() => {
    const allIncidents = incidentsQuery.data || [];

    return allIncidents.filter((incident) =>
      isIncidentVisibleForFilter(incident, selectedStatusFilter)
    );
  }, [incidentsQuery.data, selectedStatusFilter]);

  // -----------------------------
  // Mutations
  // -----------------------------
  const createIncidentMutation = useMutation({
    mutationFn: async (payload) => incidentsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: incidentsQueryKeys.all });
      setCreateForm(EMPTY_INCIDENT_FORM);
      setIsCreateModalOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ incidentId, nextStatus }) =>
      applyIncidentStatusWorkflow({ incidentId, nextStatus }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: incidentsQueryKeys.all });
      setPendingAction(null);
    },
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: async (incidentId) => incidentsApi.delete(incidentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: incidentsQueryKeys.all });
      setPendingAction(null);
    },
  });

  // -----------------------------
  // UI handlers
  // -----------------------------
  function openCreateModal() {
    setCreateForm(EMPTY_INCIDENT_FORM);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
  }

  function updateCreateFormField(fieldName, fieldValue) {
    setCreateForm((currentForm) => ({
      ...currentForm,
      [fieldName]: fieldValue,
    }));
  }

  async function submitCreateForm() {
    const payload = {
      ...createForm,
      lat: createForm.lat ? parseFloat(createForm.lat) : undefined,
      lng: createForm.lng ? parseFloat(createForm.lng) : undefined,
      date_time_reported: createForm.date_time_reported
        ? new Date(createForm.date_time_reported).toISOString()
        : undefined,
    };

    await createIncidentMutation.mutateAsync(payload);
  }

  function requestStatusChange(incidentId, nextStatus) {
    setPendingAction({
      type: 'status',
      incidentId,
      nextStatus,
    });
  }

  function requestDeleteIncident(incidentId) {
    setPendingAction({
      type: 'delete',
      incidentId,
    });
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      await deleteIncidentMutation.mutateAsync(pendingAction.incidentId);
      return;
    }

    await updateStatusMutation.mutateAsync({
      incidentId: pendingAction.incidentId,
      nextStatus: pendingAction.nextStatus,
    });
  }

  function cancelPendingAction() {
    setPendingAction(null);
  }

  return {
    // constants
    INCIDENT_STATUS,
    VIEW_MODE,

    // query state
    incidents: visibleIncidents,
    isLoadingIncidents: incidentsQuery.isLoading,
    incidentsError: incidentsQuery.error,

    // UI state
    selectedStatusFilter,
    setSelectedStatusFilter,
    viewMode,
    setViewMode,
    isCreateModalOpen,
    editingIncident,
    setEditingIncident,
    pendingAction,
    createForm,

    // loading flags
    isCreatingIncident: createIncidentMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeletingIncident: deleteIncidentMutation.isPending,

    // UI handlers
    openCreateModal,
    closeCreateModal,
    updateCreateFormField,
    submitCreateForm,
    requestStatusChange,
    requestDeleteIncident,
    confirmPendingAction,
    cancelPendingAction,
  };
}

export default useIncidentsPage;

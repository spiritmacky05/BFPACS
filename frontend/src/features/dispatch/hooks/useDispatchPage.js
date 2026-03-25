/**
 * features/dispatch/hooks/useDispatchPage.js
 *
 * Page-level orchestration hook for Dispatch feature.
 *
 * Responsibilities:
 * - Load server data needed by dispatch page.
 * - Manage UI state (modal, selections, filters).
 * - Expose prepared lists and action handlers.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import dispatchApi from '../api/dispatch.api';
import dispatchAssetsApi from '../api/dispatchAssets.api';
import {
  EMPTY_LOCATION_FILTERS,
  uniqueSorted,
} from '../lib/dispatch.constants';
import {
  createDispatchBatch,
  progressDispatchStatus,
} from '../services/dispatchWorkflow.service';

function applyLocationFilters(items, getStation, filters, sortBy) {
  const filtered = items.filter((item) => {
    const station = getStation(item);

    if (filters.station && station?.station_name !== filters.station) return false;
    if (filters.city && station?.city !== filters.city) return false;
    if (filters.district && station?.district !== filters.district) return false;
    if (filters.region && station?.region !== filters.region) return false;

    return true;
  });

  if (!sortBy) {
    return filtered;
  }

  const stationField = sortBy === 'station' ? 'station_name' : sortBy;

  return [...filtered].sort((left, right) => {
    const leftValue = getStation(left)?.[stationField] ?? '';
    const rightValue = getStation(right)?.[stationField] ?? '';
    return leftValue.localeCompare(rightValue);
  });
}

export function useDispatchPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);

  const [incidents, setIncidents] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [responders, setResponders] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [stations, setStations] = useState([]);

  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [selectedResponderIds, setSelectedResponderIds] = useState([]);
  const [dispatchNotes, setDispatchNotes] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedDispatchRows, setExpandedDispatchRows] = useState({});

  const [personnelFilters, setPersonnelFilters] = useState(EMPTY_LOCATION_FILTERS);
  const [personnelSortBy, setPersonnelSortBy] = useState('');

  const [equipmentFilters, setEquipmentFilters] = useState(EMPTY_LOCATION_FILTERS);
  const [equipmentSortBy, setEquipmentSortBy] = useState('');

  const selectedIncident = incidents.find(
    (incident) => incident.id === selectedIncidentId
  );

  const stationMapById = useMemo(() => {
    const map = {};
    stations.forEach((station) => {
      map[station.id] = station;
    });
    return map;
  }, [stations]);

  const availableResponders = useMemo(
    () => responders.filter((r) => r.sub_user_role === 'responder' && r.agency_role === 'BFP'),
    [responders]
  );

  const filteredPersonnel = useMemo(
    () =>
      applyLocationFilters(
        personnel,
        (member) => member.station,
        personnelFilters,
        personnelSortBy
      ),
    [personnel, personnelFilters, personnelSortBy]
  );

  const filteredEquipment = useMemo(
    () =>
      applyLocationFilters(
        equipment,
        (item) => stationMapById[item.station_id],
        equipmentFilters,
        equipmentSortBy
      ),
    [equipment, equipmentFilters, equipmentSortBy, stationMapById]
  );

  const personnelFilterOptions = useMemo(
    () => ({
      stations: uniqueSorted(personnel.map((member) => member.station?.station_name)),
      cities: uniqueSorted(personnel.map((member) => member.station?.city)),
      districts: uniqueSorted(personnel.map((member) => member.station?.district)),
      regions: uniqueSorted(personnel.map((member) => member.station?.region)),
    }),
    [personnel]
  );

  const equipmentFilterOptions = useMemo(
    () => ({
      stations: uniqueSorted(equipment.map((item) => stationMapById[item.station_id]?.station_name)),
      cities: uniqueSorted(equipment.map((item) => stationMapById[item.station_id]?.city)),
      districts: uniqueSorted(equipment.map((item) => stationMapById[item.station_id]?.district)),
      regions: uniqueSorted(equipment.map((item) => stationMapById[item.station_id]?.region)),
    }),
    [equipment, stationMapById]
  );

  const loadDispatchesForIncident = useCallback(async (incidentId) => {
    if (!incidentId) {
      setDispatches([]);
      return;
    }

    const dispatchData = await dispatchApi.listByIncident(incidentId);
    setDispatches(dispatchData ?? []);
  }, []);

  const loadPageSnapshot = useCallback(async () => {
    setIsLoading(true);

    try {
      const [activeIncidents, respondersData, personnelData, equipmentData, stationsData] =
        await Promise.all([
          dispatchApi.listActiveIncidents(),
          dispatchAssetsApi.listResponders(),
          dispatchAssetsApi.listPersonnel(),
          dispatchAssetsApi.listEquipment(),
          dispatchAssetsApi.listStations(),
        ]);

      setIncidents(activeIncidents ?? []);
      setResponders(respondersData ?? []);
      setPersonnel(personnelData ?? []);
      setEquipment(equipmentData ?? []);
      setStations(stationsData ?? []);

      const incidentId = selectedIncidentId || activeIncidents?.[0]?.id || '';
      setSelectedIncidentId(incidentId);
      await loadDispatchesForIncident(incidentId);
    } finally {
      setIsLoading(false);
    }
  }, [loadDispatchesForIncident, selectedIncidentId]);

  useEffect(() => {
    loadPageSnapshot();
  }, [loadPageSnapshot]);

  useEffect(() => {
    loadDispatchesForIncident(selectedIncidentId);
  }, [selectedIncidentId, loadDispatchesForIncident]);

  function toggleResponderSelection(responderId) {
    setSelectedResponderIds((previousIds) =>
      previousIds.includes(responderId)
        ? previousIds.filter((id) => id !== responderId)
        : [...previousIds, responderId]
    );
  }

  function updateLocationFilter(setter) {
    return (field, value) => {
      if (field === 'all') {
        setter(EMPTY_LOCATION_FILTERS);
        return;
      }

      setter((previousValue) => ({
        ...previousValue,
        [field]: value,
      }));
    };
  }

  async function submitDispatchOrder() {
    if (!selectedIncidentId || selectedResponderIds.length === 0) {
      return;
    }

    setIsDispatching(true);

    try {
      await createDispatchBatch({
        incidentId: selectedIncidentId,
        responderIds: selectedResponderIds,
        notes: dispatchNotes,
        responders,
      });

      setSelectedResponderIds([]);
      setDispatchNotes('');
      setIsCreateModalOpen(false);

      await Promise.all([
        loadDispatchesForIncident(selectedIncidentId),
        dispatchAssetsApi.listResponders().then((responderData) =>
          setResponders(responderData ?? [])
        ),
      ]);
    } finally {
      setIsDispatching(false);
    }
  }

  async function updateDispatchStatus(dispatchRecord, nextStatus) {
    await progressDispatchStatus({
      dispatch: dispatchRecord,
      incidentId: selectedIncidentId,
      nextStatus,
      responders,
    });

    await Promise.all([
      loadDispatchesForIncident(selectedIncidentId),
      dispatchAssetsApi.listResponders().then((responderData) =>
        setResponders(responderData ?? [])
      ),
    ]);
  }

  function toggleDispatchRowExpansion(dispatchId) {
    setExpandedDispatchRows((previousValue) => ({
      ...previousValue,
      [dispatchId]: !previousValue[dispatchId],
    }));
  }

  return {
    isLoading,
    isDispatching,

    incidents,
    dispatches,
    personnel,
    equipment,
    stations,
    selectedIncident,
    selectedIncidentId,
    setSelectedIncidentId,

    availableResponders,
    selectedResponderIds,
    toggleResponderSelection,
    dispatchNotes,
    setDispatchNotes,

    filteredPersonnel,
    filteredEquipment,
    stationMapById,

    personnelFilterOptions,
    personnelFilters,
    setPersonnelFilters,
    personnelSortBy,
    setPersonnelSortBy,

    equipmentFilterOptions,
    equipmentFilters,
    setEquipmentFilters,
    equipmentSortBy,
    setEquipmentSortBy,

    updatePersonnelFilter: updateLocationFilter(setPersonnelFilters),
    updateEquipmentFilter: updateLocationFilter(setEquipmentFilters),

    isCreateModalOpen,
    setIsCreateModalOpen,
    submitDispatchOrder,

    expandedDispatchRows,
    toggleDispatchRowExpansion,
    updateDispatchStatus,

    refreshDispatches: () => loadDispatchesForIncident(selectedIncidentId),
  };
}

export default useDispatchPage;

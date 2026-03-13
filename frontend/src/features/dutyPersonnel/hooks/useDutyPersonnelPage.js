/**
 * features/dutyPersonnel/hooks/useDutyPersonnelPage.js
 *
 * Page orchestration hook for Duty Personnel feature.
 */

import { useEffect, useMemo, useState } from 'react';
import dutyPersonnelApi from '../api/dutyPersonnel.api';
import {
  EMPTY_LOCATION_FILTERS,
  EMPTY_PERSONNEL_FORM,
  uniqueSorted,
} from '../lib/dutyPersonnel.constants';
import {
  buildEditFormFromPersonnel,
  buildSavePayload,
  getNextDutyStatus,
  parseCertification,
  toggleSkillWithLimit,
} from '../services/dutyPersonnelForm.service';

export function useDutyPersonnelPage() {
  const [personnel, setPersonnel] = useState([]);
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPersonnelId, setEditingPersonnelId] = useState(null);
  const [form, setForm] = useState(EMPTY_PERSONNEL_FORM);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [searchValue, setSearchValue] = useState('');
  const [dutyStatusFilter, setDutyStatusFilter] = useState('All');
  const [locationFilters, setLocationFilters] = useState(EMPTY_LOCATION_FILTERS);
  const [locationSortBy, setLocationSortBy] = useState('');

  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const onDutyCount = personnel.filter((member) => member.duty_status === 'On Duty').length;
  const offDutyCount = personnel.filter((member) => member.duty_status !== 'On Duty').length;

  async function loadPageData() {
    setIsLoading(true);

    try {
      const [personnelData, stationData] = await Promise.all([
        dutyPersonnelApi.list(),
        dutyPersonnelApi.listStations(),
      ]);

      setPersonnel(personnelData ?? []);
      setStations(stationData ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  function openCreateModal() {
    setEditingPersonnelId(null);
    setForm(EMPTY_PERSONNEL_FORM);
    setSelectedSkills([]);
    setIsFormOpen(true);
  }

  function openEditModal(personnelRecord) {
    setEditingPersonnelId(personnelRecord.id);
    setForm(buildEditFormFromPersonnel(personnelRecord));
    setSelectedSkills(parseCertification(personnelRecord.certification));
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingPersonnelId(null);
    setForm(EMPTY_PERSONNEL_FORM);
    setSelectedSkills([]);
  }

  async function submitPersonnelForm() {
    setIsSaving(true);

    try {
      const payload = buildSavePayload({ form, skills: selectedSkills });

      if (editingPersonnelId) {
        await dutyPersonnelApi.update(editingPersonnelId, payload);
      } else {
        await dutyPersonnelApi.create(payload);
      }

      closeFormModal();
      await loadPageData();
    } finally {
      setIsSaving(false);
    }
  }

  function toggleSkill(skill) {
    setSelectedSkills((previousSkills) =>
      toggleSkillWithLimit(previousSkills, skill)
    );
  }

  function askDelete(personnelRecord) {
    setPendingConfirmation({
      title: 'Delete Personnel',
      message: `Are you sure you want to delete ${personnelRecord.full_name}?`,
      onConfirm: async () => {
        await dutyPersonnelApi.remove(personnelRecord.id);
        setPendingConfirmation(null);
        await loadPageData();
      },
    });
  }

  function askToggleDutyStatus(personnelRecord) {
    const nextDutyStatus = getNextDutyStatus(personnelRecord.duty_status);

    setPendingConfirmation({
      title: 'Change Duty Status',
      message: `Set ${personnelRecord.full_name} to "${nextDutyStatus}"?`,
      onConfirm: async () => {
        await dutyPersonnelApi.updateDutyStatus(personnelRecord.id, nextDutyStatus);
        setPendingConfirmation(null);
        await loadPageData();
      },
    });
  }

  function cancelConfirmation() {
    setPendingConfirmation(null);
  }

  function updateLocationFilter(field, value) {
    if (field === 'all') {
      setLocationFilters(EMPTY_LOCATION_FILTERS);
      setLocationSortBy('');
      return;
    }

    setLocationFilters((previousValue) => ({
      ...previousValue,
      [field]: value,
    }));
  }

  const locationOptions = useMemo(
    () => ({
      stations: uniqueSorted(personnel.map((member) => member.station?.station_name)),
      cities: uniqueSorted(personnel.map((member) => member.station?.city)),
      districts: uniqueSorted(personnel.map((member) => member.station?.district)),
      regions: uniqueSorted(personnel.map((member) => member.station?.region)),
    }),
    [personnel]
  );

  const filteredPersonnel = useMemo(() => {
    return personnel
      .filter(
        (member) =>
          dutyStatusFilter === 'All' || member.duty_status === dutyStatusFilter
      )
      .filter((member) => {
        if (!searchValue) {
          return true;
        }

        const query = searchValue.toLowerCase();

        return (
          member.full_name?.toLowerCase().includes(query) ||
          member.rank?.toLowerCase().includes(query) ||
          member.shift?.toLowerCase().includes(query)
        );
      })
      .filter((member) => {
        if (
          locationFilters.station &&
          member.station?.station_name !== locationFilters.station
        ) {
          return false;
        }

        if (locationFilters.city && member.station?.city !== locationFilters.city) {
          return false;
        }

        if (
          locationFilters.district &&
          member.station?.district !== locationFilters.district
        ) {
          return false;
        }

        if (
          locationFilters.region &&
          member.station?.region !== locationFilters.region
        ) {
          return false;
        }

        return true;
      })
      .sort((leftMember, rightMember) => {
        if (!locationSortBy) {
          return 0;
        }

        const stationField =
          locationSortBy === 'station' ? 'station_name' : locationSortBy;

        const leftValue = leftMember.station?.[stationField] ?? '';
        const rightValue = rightMember.station?.[stationField] ?? '';

        return leftValue.localeCompare(rightValue);
      });
  }, [personnel, dutyStatusFilter, searchValue, locationFilters, locationSortBy]);

  return {
    personnel,
    stations,
    isLoading,
    isSaving,

    onDutyCount,
    offDutyCount,

    filteredPersonnel,
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

    pendingConfirmation,
    askDelete,
    askToggleDutyStatus,
    cancelConfirmation,
  };
}

export default useDutyPersonnelPage;

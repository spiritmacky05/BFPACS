/**
 * features/hydrants/hooks/useHydrants.js
 *
 * Extracted logic for fetching hydrant data, map filtering, and status updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { hydrantsApi } from '../api/hydrants.api';
import { useAuth } from '@/features/auth';
import { useMyStation } from '@/features/stations';

const EMPTY_FORM = {
  address_text: '',
  status: 'Serviceable',
  hydrant_type: 'Dry Barrel',
  psi: '',
  last_inspection_date: '',
  lat: '',
  lng: '',
};

export const useHydrants = () => {
  const [hydrants, setHydrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchLat, setSearchLat] = useState('');
  const [searchLng, setSearchLng] = useState('');
  const [radius, setRadius] = useState(500);
  const [nearby, setNearby] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selectedHydrant, setSelectedHydrant] = useState(null);

  const { role } = useAuth();
  const canEdit = role === 'superadmin' || role === 'admin' || role === 'user';
  const isAdmin = role === 'superadmin' || role === 'admin';
  const myStation = useMyStation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hydrantsApi.list();
      setHydrants(data ?? []);
    } catch (error) {
      console.error('Failed to load hydrants:', error);
      setHydrants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
        psi: form.psi ? parseInt(form.psi, 10) : undefined,
      };
      if (editTarget) {
        await hydrantsApi.update(editTarget.id, payload);
      } else {
        await hydrantsApi.create(payload);
      }
      setShowForm(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      console.error('Failed to save hydrant:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (h) => {
    setEditTarget(h);
    setForm({
      address_text: h.address || h.address_text || '',
      status: h.status || 'Serviceable',
      hydrant_type: h.hydrant_type || 'Dry Barrel',
      psi: h.psi ?? '',
      last_inspection_date: h.last_inspection_date ?? '',
      lat: h.lat ?? '',
      lng: h.lng ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = (h) => {
    setConfirm({
      title: 'Delete Hydrant',
      message: `Delete hydrant at "${h.address || h.address_text || 'Unknown'}"?`,
      onYes: async () => {
        try {
          await hydrantsApi.delete(h.id);
          await load();
          setConfirm(null);
        } catch (error) {
          console.error('Failed to delete hydrant:', error);
        }
      },
    });
  };

  const handleNearbySearch = async () => {
    try {
      const data = await hydrantsApi.nearby(parseFloat(searchLat), parseFloat(searchLng), radius);
      setNearby(data ?? []);
    } catch (error) {
      console.error('Nearby search failed:', error);
      setNearby([]);
    }
  };

  const allData = nearby ?? hydrants;
  const displayList = filterStatus === 'All' ? allData : allData.filter(h => h.status === filterStatus);

  const operational = hydrants.filter(h => h.status === 'Serviceable' || h.status === 'Operational').length;
  const issues = hydrants.length - operational;

  const resetForm = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  return {
    hydrants,
    loading,
    showForm,
    setShowForm,
    editTarget,
    setEditTarget,
    form,
    setForm,
    saving,
    filterStatus,
    setFilterStatus,
    searchLat,
    setSearchLat,
    searchLng,
    setSearchLng,
    radius,
    setRadius,
    nearby,
    setNearby,
    confirm,
    setConfirm,
    selectedHydrant,
    setSelectedHydrant,
    canEdit,
    isAdmin,
    myStation,
    load,
    handleSave,
    openEdit,
    handleDelete,
    handleNearbySearch,
    displayList,
    operational,
    issues,
    resetForm,
    EMPTY_FORM,
  };
};

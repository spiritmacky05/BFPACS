/**
 * features/stations/hooks/useStations.js
 *
 * Logic for managing the fire stations list, CRUD state, and map integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { stationsApi } from '../api/stations.api';

const EMPTY_FORM = {
  station_name: '',
  city: '',
  district: '',
  region: '',
  address_text: '',
  contact_number: '',
  team_leader_contact: '',
  lat: '',
  lng: '',
};

export const useStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stationsApi.list();
      setStations(data ?? []);
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditItem(s);
    setForm({
      station_name: s.station_name ?? '',
      city: s.city ?? '',
      district: s.district ?? '',
      region: s.region ?? '',
      address_text: s.address_text ?? '',
      contact_number: s.contact_number ?? '',
      team_leader_contact: s.team_leader_contact ?? '',
      lat: s.lat != null ? String(s.lat) : '',
      lng: s.lng != null ? String(s.lng) : '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.station_name || !form.city || !form.district || !form.region) {
      setFormError('Station Name, City, District, and Region are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        lat: form.lat !== '' ? parseFloat(form.lat) : null,
        lng: form.lng !== '' ? parseFloat(form.lng) : null,
      };
      ['contact_number', 'team_leader_contact', 'address_text'].forEach((k) => {
        if (!payload[k]) payload[k] = null;
      });

      if (editItem) {
        await stationsApi.update(editItem.id, payload);
      } else {
        await stationsApi.create(payload);
      }

      setShowForm(false);
      setEditItem(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(err.message ?? 'Failed to save station');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      await stationsApi.delete(deleteItem.id);
      setDeleteItem(null);
      load();
    } catch (err) {
      console.error('Failed to delete station:', err);
    } finally {
      setSaving(false);
    }
  };

  return {
    stations,
    loading,
    showForm,
    setShowForm,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    form,
    setForm,
    saving,
    formError,
    setFormError,
    selectedStation,
    setSelectedStation,
    load,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  };
};

export default useStations;

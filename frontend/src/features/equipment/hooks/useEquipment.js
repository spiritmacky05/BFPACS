/**
 * features/equipment/hooks/useEquipment.js
 *
 * Extracted logic for equipment listing, search/filter, and status updates.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { equipmentApi } from '../api/equipment.api';
import { superadminApi } from '@/features/superadmin';
import { stationsApi } from '@/features/stations';
import { useAuth } from '@/features/auth';

const EMPTY_FORM = { equipment_name: '', quantity: 1, condition: 'Good' };

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))].sort();
}

export const useEquipment = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [borrowItem, setBorrowItem] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState('');
  const [stationFilters, setStationFilters] = useState({ 
    station: '', 
    city: '', 
    district: '', 
    region: '' 
  });
  const [stationSort, setStationSort] = useState('');

  const { role, user } = useAuth();
  const isAdmin = role === 'superadmin' || role === 'admin' || role === 'user';
  const isAdminRole = role === 'superadmin' || role === 'admin';

  const stationMap = useMemo(() => {
    const m = {};
    stations.forEach(s => { m[s.id] = s; });
    return m;
  }, [stations]);

  const stationOptions = useMemo(() => uniq(stations.map(s => s.station_name)), [stations]);
  const cityOptions = useMemo(() => uniq(stations.map(s => s.city)), [stations]);
  const districtOptions = useMemo(() => uniq(stations.map(s => s.district)), [stations]);
  const regionOptions = useMemo(() => uniq(stations.map(s => s.region)), [stations]);

  const load = useCallback(async () => {
    try {
      const equipData = await equipmentApi.list(!isAdminRole ? (user?.station_id ?? undefined) : undefined);
      setItems(equipData ?? []);
    } catch (err) {
      console.error('Error loading equipment data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdminRole, user?.station_id]);

  const loadUsers = useCallback(async () => {
    if (!isAdminRole) return;
    try {
      const data = await superadminApi.listUsers();
      setUsers((data ?? []).filter(u => u.approved));
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, [isAdminRole]);

  const loadStations = useCallback(async () => {
    try {
      const data = await stationsApi.list();
      setStations(data ?? []);
    } catch (err) {
      console.error('Error loading stations:', err);
    }
  }, []);

  useEffect(() => {
    load();
    loadUsers();
    loadStations();
  }, [load, loadUsers, loadStations]);

  const handleStationFilter = (field, value) => {
    if (field === 'all') {
      setStationFilters({ station: '', city: '', district: '', region: '' });
      setStationSort('');
    } else {
      setStationFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const filtered = useMemo(() => {
    return items
      .filter(item => {
        if (!search) return true;
        const q = search.toLowerCase();
        const name = (item.equipment_name || item.item_name || '').toLowerCase();
        const borrower = (item.borrower_name || '').toLowerCase();
        return name.includes(q) || borrower.includes(q);
      })
      .filter(item => {
        const s = stationMap[item.station_id];
        if (stationFilters.station && s?.station_name !== stationFilters.station) return false;
        if (stationFilters.city && s?.city !== stationFilters.city) return false;
        if (stationFilters.district && s?.district !== stationFilters.district) return false;
        if (stationFilters.region && s?.region !== stationFilters.region) return false;
        return true;
      })
      .sort((a, b) => {
        if (!stationSort) return 0;
        const sa = stationMap[a.station_id];
        const sb = stationMap[b.station_id];
        const key = stationSort === 'station' ? 'station_name' : stationSort;
        return (sa?.[key] ?? '').localeCompare(sb?.[key] ?? '');
      });
  }, [items, search, stationFilters, stationSort, stationMap]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await equipmentApi.create(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleBorrow = async () => {
    if (!borrowerName || !borrowItem) return;
    try {
      await equipmentApi.borrow(borrowItem.id, { borrower_name: borrowerName });
      setBorrowItem(null);
      setBorrowerName('');
      await load();
    } catch (err) {
      console.error('Error borrowing equipment:', err);
    }
  };

  const handleReturn = async (id) => {
    try {
      await equipmentApi.return(id);
      await load();
    } catch (err) {
      console.error('Error returning equipment:', err);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    const payload = { ...editItem };
    if (!payload.borrower_name) payload.borrower_name = null;
    try {
      await equipmentApi.update(editItem.id, payload);
      setEditItem(null);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await equipmentApi.delete(deleteItem.id);
      setDeleteItem(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return {
    items,
    loading,
    showForm,
    setShowForm,
    form,
    setForm,
    saving,
    borrowItem,
    setBorrowItem,
    borrowerName,
    setBorrowerName,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    users,
    stations,
    search,
    setSearch,
    stationFilters,
    stationSort,
    setStationSort,
    isAdmin,
    isAdminRole,
    user,
    stationMap,
    stationOptions,
    cityOptions,
    districtOptions,
    regionOptions,
    filtered,
    handleStationFilter,
    handleCreate,
    handleBorrow,
    handleReturn,
    handleUpdate,
    handleDelete,
    load
  };
};

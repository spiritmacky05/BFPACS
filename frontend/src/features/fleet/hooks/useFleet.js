/**
 * features/fleet/hooks/useFleet.js
 *
 * Extracted logic for Fleet listing, filtering, and modal state.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { superadminApi } from '@/features/superadmin';
import { useAuth } from '@/features/auth';
import { ACS_STATUSES } from '@/features/shared/components/acsStatus';

export const useFleet = () => {
  const { user: currentUser, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [responders, setResponders] = useState([]);
  const [respondersLoading, setRespondersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingUnit, setEditingUnit] = useState(null);

  const loadResponders = useCallback(async () => {
    setRespondersLoading(true);
    try {
      if (isAdmin) {
        const allUsers = await superadminApi.listUsers();
        // Requirement: Show all responder units (BFP, Volunteers, etc.)
        const fleet = (allUsers || []).filter(u => u.sub_role === "responder");
        setResponders(fleet);
      } else {
        setResponders(currentUser && currentUser.sub_role === "responder" ? [currentUser] : []);
      }
    } catch { 
      setResponders([]); 
    } finally {
      setRespondersLoading(false);
    }
  }, [isAdmin, currentUser]);

  useEffect(() => { 
    loadResponders(); 
  }, [loadResponders]);

  const isOwnUnit = useCallback((unit) => unit?.email === currentUser?.email, [currentUser]);
  const canEdit = useCallback((unit) => isAdmin || isOwnUnit(unit), [isAdmin, isOwnUnit]);

  const handleStatusChange = async (id, acs_status) => {
    await superadminApi.updateUser(id, { acs_status });
    loadResponders();
  };

  const filtered = useMemo(() => {
    return responders.filter(u => {
      const matchSearch = !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.type_of_vehicle?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || u.acs_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [responders, search, statusFilter]);

  const counts = useMemo(() => {
    const c = {};
    ACS_STATUSES.forEach(s => {
      c[s] = responders.filter(u => u.acs_status === s).length;
    });
    c["Serviceable"] = responders.filter(u => !u.acs_status || u.acs_status === "Serviceable").length;
    return c;
  }, [responders, ACS_STATUSES]);

  return {
    responders,
    respondersLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    editingUnit,
    setEditingUnit,
    loadResponders,
    canEdit,
    isOwnUnit,
    handleStatusChange,
    filtered,
    counts,
  };
};

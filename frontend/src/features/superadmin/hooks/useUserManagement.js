/**
 * features/superadmin/hooks/useUserManagement.js
 *
 * Logic for managing users, approvals, and system health checks.
 */

import { useState, useCallback, useEffect } from 'react';
import { superadminApi } from '../api/superadmin.api';

export const useUserManagement = (role) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState(null);

  const loadUsers = useCallback(async () => {
    if (role !== 'superadmin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await superadminApi.listUsers();
      setUsers(data || []);
    } catch (err) {
      console.warn('Could not load users:', err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const loadHealth = useCallback(async () => {
    if (health) return;
    try {
      const data = await superadminApi.getSystemHealth();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'unreachable' });
    }
  }, [health]);

  const quickApprove = async (userId, approved) => {
    try {
      await superadminApi.quickApproveUser(userId, approved);
      await loadUsers();
    } catch (err) {
      console.error('Failed to update approval:', err);
      throw err;
    }
  };

  const saveUserEdit = async (userId, payload) => {
    setSaving(true);
    try {
      await superadminApi.updateUser(userId, payload);
      await loadUsers();
    } catch (err) {
      console.error('Failed to save user:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    saving,
    health,
    loadUsers,
    loadHealth,
    quickApprove,
    saveUserEdit,
  };
};

export default useUserManagement;

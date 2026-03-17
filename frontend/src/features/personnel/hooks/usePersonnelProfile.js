/**
 * features/personnel/hooks/usePersonnelProfile.js
 *
 * Logic for fetching biographical data, deployments, and assets for a single personnel member.
 */

import { useState, useEffect, useCallback } from 'react';
import { personnelApi } from '../api/personnel.api';
import { equipmentApi } from '@/features/equipment/api/equipment.api';
import { incidentsApi, dispatchesApi } from '@/api/api-services';
import { checkinApi }   from '@/features/checkin/api/checkin.api';

export const usePersonnelProfile = (id) => {
  const [person, setPerson] = useState(null);
  const [assets, setAssets] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deploy modal state
  const [showDeploy, setShowDeploy] = useState(false);
  const [selectedInc, setSelectedInc] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [deploySuccess, setDeploySuccess] = useState(null);

  const loadAll = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const [p, eq, allInc] = await Promise.all([
        personnelApi.getById(id),
        equipmentApi.list(),
        incidentsApi.list(),
      ]);

      setPerson(p ?? null);
      setAllIncidents(allInc ?? []);

      const name = p?.full_name?.toLowerCase() ?? '';
      const borrowed = (eq ?? []).filter(e =>
        e.borrower_name && e.borrower_name.toLowerCase() === name
      );
      setAssets(borrowed);

      // Deployment detection
      const active = (allInc ?? []).filter(i => i.incident_status === 'Active');
      const found = [];

      for (const inc of active) {
        if (
          inc.ground_commander && p?.full_name &&
          inc.ground_commander.toLowerCase().trim() === p.full_name.toLowerCase().trim()
        ) {
          found.push({ incident: inc, role: 'Ground Commander' });
        }
      }

      if (p?.id && active.length) {
        const logResults = await Promise.all(
          active.map(inc =>
            checkinApi.getLogsForIncident(inc.id).then(logs => ({ inc, logs }))
          )
        );
        for (const { inc, logs } of logResults) {
          const alreadyAdded = found.some(f => f.incident.id === inc.id);
          const isCheckedIn = (logs ?? []).some(
            l => l.personnel_id === p.id && !l.check_out_time
          );
          if (isCheckedIn && !alreadyAdded) {
            found.push({ incident: inc, role: 'Checked In' });
          }
        }
      }

      setDeployments(found);
    } catch (err) {
      console.error('Error loading personnel profile:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openDeployModal = () => {
    setSelectedInc('');
    setDeployError('');
    setDeploySuccess(null);
    setShowDeploy(true);
  };

  const handleDeploy = async () => {
    if (!selectedInc || !person) return;
    setDeploying(true);
    setDeployError('');
    try {
      await checkinApi.manual({
        personnel_id: person.id,
        incident_id: selectedInc,
      });
      const inc = allIncidents.find(i => i.id === selectedInc);
      setDeploySuccess({ incident: inc, personnel: person });
      // Refresh deployments in background
      loadAll();
    } catch (err) {
      const msg = err?.message || 'Deployment failed. Please try again.';
      setDeployError(msg);
    } finally {
      setDeploying(false);
    }
  };

  return {
    person,
    assets,
    deployments,
    allIncidents,
    loading,
    showDeploy,
    setShowDeploy,
    selectedInc,
    setSelectedInc,
    deploying,
    deployError,
    setDeployError,
    deploySuccess,
    setDeploySuccess,
    openDeployModal,
    handleDeploy,
    refresh: loadAll,
  };
};

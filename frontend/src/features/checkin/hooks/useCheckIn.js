/**
 * features/checkin/hooks/useCheckIn.js
 *
 * Custom hook for Check-In logic.
 */

import { useState, useEffect, useRef } from 'react';
import { checkinApi } from '../api/checkin.api';
import { incidentsApi } from '@/api/api-services';
import { superadminApi } from '@/features/superadmin';
import { ApiError } from '@/api/client/client';

export default function useCheckIn() {
  const [incidents, setSelectedIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState('');
  const [logs, setLogs] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // NFC / PIN scanner state
  const [mode, setMode] = useState('nfc');
  const [nfcTag, setNfcTag] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const nfcRef = useRef(null);

  // Manual check-in modal state
  const [showManual, setShowManual] = useState(false);
  const [manualResponderId, setManualResponderId] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. Initial Load: active incidents + responders
  useEffect(() => {
    incidentsApi.list().then(data => {
      const active = (data ?? []).filter(i => i.incident_status === 'Active');
      setSelectedIncidents(active);
      if (active.length > 0) setSelectedIncident(active[0].id);
    });
    superadminApi.listUsers().then(data => {
      const fleet = (data ?? []).filter(u => u.role === 'user' || u.user_type === 'responder');
      setResponders(fleet);
    });
  }, []);

  // 2. Auto-focus NFC field
  useEffect(() => {
    if (mode === 'nfc') nfcRef.current?.focus();
  }, [mode]);

  // 3. Load logs for selected incident
  const loadLogs = async () => {
    if (!selectedIncident) return;
    setLoadingLogs(true);
    try {
      const data = await checkinApi.getLogsForIncident(selectedIncident);
      setLogs(data ?? []);
    } catch (err) {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedIncident]);

  // Handler: NFC Scan
  const handleNFCScan = async (e) => {
    if (e) e.preventDefault();
    if (!nfcTag || !selectedIncident) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await checkinApi.nfc({ nfc_tag_id: nfcTag, incident_id: selectedIncident });
      setScanResult({ success: true, personnel: res.personnel, message: res.message });
      setNfcTag('');
      loadLogs();
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 409
        ? 'Personnel already checked in to this incident'
        : err.message;
      setScanResult({ success: false, message: msg });
    } finally {
      setScanning(false);
      nfcRef.current?.focus();
    }
  };

  // Handler: PIN check-in
  const handlePIN = async (e) => {
    if (e) e.preventDefault();
    if (!pinCode || !selectedIncident) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await checkinApi.pin({ pin_code: pinCode, incident_id: selectedIncident });
      setScanResult({ success: true, personnel: res.personnel, message: res.message });
      setPinCode('');
      loadLogs();
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 409
        ? 'Personnel already checked in to this incident'
        : err.message;
      setScanResult({ success: false, message: msg });
    } finally {
      setScanning(false);
    }
  };

  // Handler: Manual check-in
  const handleManual = async () => {
    if (!manualResponderId || !selectedIncident) return;
    setSaving(true);
    try {
      await checkinApi.manual({ user_id: manualResponderId, incident_id: selectedIncident });
      setShowManual(false);
      setManualResponderId('');
      loadLogs();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setSaving(false);
    }
  };

  // Handler: Checkout
  const handleCheckout = async (logId) => {
    await checkinApi.checkout(logId).catch(() => null);
    loadLogs();
  };

  // Derived stats
  const today = new Date().toDateString();
  const todayLogs = logs.filter(l => l.check_in_time && new Date(l.check_in_time).toDateString() === today);
  const checkedInCount = todayLogs.filter(l => !l.check_out_time).length;
  const checkedOutCount = todayLogs.filter(l => l.check_out_time).length;

  const getResponderName = (id) => responders.find(u => u.id === id)?.full_name || '—';

  return {
    incidents,
    selectedIncident,
    setSelectedIncident,
    logs,
    responders,
    loadingLogs,
    mode,
    setMode,
    nfcTag,
    setNfcTag,
    pinCode,
    setPinCode,
    scanResult,
    scanning,
    nfcRef,
    showManual,
    setShowManual,
    manualResponderId,
    setManualResponderId,
    saving,
    handleNFCScan,
    handlePIN,
    handleManual,
    handleCheckout,
    todayLogs,
    checkedInCount,
    checkedOutCount,
    getResponderName,
  };
}

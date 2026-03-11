/**
 * pages/CheckIn.jsx
 *
 * Full Check-In portal — ported from bfpacs_update.
 * Sections:
 *   1. CheckInDashboard (today's stats by type + on-duty counts)
 *   2. NFC scanner / PIN entry (incident-scoped)
 *   3. Today's stats row for selected incident
 *   4. Manual check-in modal
 *   5. Check-in log table with checkout button
 */

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  LogIn, Plus, X, CreditCard, CheckCircle, Clock, AlertTriangle,
  Wifi, Hash, Shield, XCircle, UserCheck,
} from 'lucide-react';
import { checkinApi }   from '@/api/checkin/checkin';
import { incidentsApi } from '@/api/incidents/incidents';
import { usersApi }     from '@/api/users/users';
import { useAuth }      from '@/context/AuthContext/AuthContext';
import { ApiError }     from '@/api/client/client';
import CheckInDashboard from '../../components/checkin/CheckInDashboard/CheckInDashboard';

const TYPE_COLORS = {
  NFC:    'text-green-400 bg-green-600/10 border-green-600/30',
  PIN:    'text-blue-400 bg-blue-600/10 border-blue-600/30',
  Manual: 'text-purple-400 bg-purple-600/10 border-purple-600/30',
};

const INPUT_CLS = 'w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none placeholder-gray-700';

export default function CheckIn() {
  const [incidents,        setIncidents]        = useState([]);
  const [selectedIncident, setSelectedIncident] = useState('');
  const [logs,             setLogs]             = useState([]);
  const [responders,       setResponders]       = useState([]);
  const [loadingLogs,      setLoadingLogs]      = useState(false);

  // NFC / PIN scanner
  const [mode,    setMode]    = useState('nfc');
  const [nfcTag,  setNfcTag]  = useState('');
  const [pinCode, setPinCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning,   setScanning]   = useState(false);
  const nfcRef = useRef(null);

  // Manual check-in modal
  const [showManual,      setShowManual]      = useState(false);
  const [manualResponderId, setManualResponderId] = useState('');
  const [saving,          setSaving]          = useState(false);

  const { role } = useAuth();
  const isAdmin  = role === 'admin' || role === 'superadmin';

  // ── Load active incidents + personnel ──────────────────────────────────────
  useEffect(() => {
    incidentsApi.list().then(data => {
      const active = (data ?? []).filter(i => i.incident_status === 'Active');
      setIncidents(active);
      if (active.length > 0) setSelectedIncident(active[0].id);
    });
    usersApi.list().then(data => {
      const fleet = (data ?? []).filter(u => u.role === 'user' || u.user_type === 'responder');
      setResponders(fleet);
    });
  }, []);

  // Auto-focus NFC field when mode switches
  useEffect(() => {
    if (mode === 'nfc') nfcRef.current?.focus();
  }, [mode]);

  // ── Load logs for selected incident ───────────────────────────────────────
  const loadLogs = async () => {
    if (!selectedIncident) return;
    setLoadingLogs(true);
    const data = await checkinApi.getLogsForIncident(selectedIncident).catch(() => []);
    setLogs(data ?? []);
    setLoadingLogs(false);
  };

  useEffect(() => { loadLogs(); }, [selectedIncident]);

  // ── NFC scan ───────────────────────────────────────────────────────────────
  const handleNFCScan = async (e) => {
    e.preventDefault();
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

  // ── PIN check-in ───────────────────────────────────────────────────────────
  const handlePIN = async (e) => {
    e.preventDefault();
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

  // ── Manual check-in ────────────────────────────────────────────────────────
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

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = async (logId) => {
    await checkinApi.checkout(logId).catch(() => null);
    loadLogs();
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const today       = new Date().toDateString();
  const todayLogs   = logs.filter(l => l.check_in_time && new Date(l.check_in_time).toDateString() === today);
  const checkedIn   = todayLogs.filter(l => !l.check_out_time).length;
  const checkedOut  = todayLogs.filter(l => l.check_out_time).length;

  const getResponderName = id => responders.find(u => u.id === id)?.full_name || '—';

  if (!isAdmin) {
    return (
      <div className="text-center py-16 border border-red-600/30 bg-red-600/10 rounded-xl">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">Only admins can access the check-in system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Dashboard ───────────────────────────────────────────────────── */}
      <CheckInDashboard />

      {/* ── NFC Scanner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-red-950/30 to-[#111] border border-red-900/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-600/20 border border-red-600/40 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">NFC / PIN Check-In</h3>
            <p className="text-gray-500 text-xs">Select incident then scan badge or enter PIN</p>
          </div>
        </div>

        {/* Incident selector */}
        <div className="mb-4">
          <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Active Incident</label>
          {incidents.length === 0 ? (
            <div className="text-gray-600 text-sm py-2">No active incidents</div>
          ) : (
            <select value={selectedIncident}
              onChange={e => setSelectedIncident(e.target.value)}
              className={INPUT_CLS}>
              {incidents.map(i => (
                <option key={i.id} value={i.id}>{i.location_text} — {i.alarm_status}</option>
              ))}
            </select>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-1">
          {[
            { id: 'nfc', label: 'NFC Scan', Icon: Wifi },
            { id: 'pin', label: 'PIN Code', Icon: Hash },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setMode(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* NFC form */}
        {mode === 'nfc' && (
          <form onSubmit={handleNFCScan} className="flex gap-3">
            <input ref={nfcRef} value={nfcTag}
              onChange={e => setNfcTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNFCScan(e)}
              placeholder="Tap NFC card or enter Badge ID..."
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm font-mono focus:border-red-600 outline-none placeholder-gray-600" />
            <button type="submit" disabled={scanning || !nfcTag || !selectedIncident}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50">
              <CheckCircle className="w-4 h-4" /> Check In
            </button>
          </form>
        )}

        {/* PIN form */}
        {mode === 'pin' && (
          <form onSubmit={handlePIN} className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Enter 4–6 digit personnel PIN</span>
            </div>
            <div className="flex gap-3">
              <input type="password" maxLength={6} value={pinCode}
                onChange={e => setPinCode(e.target.value)}
                placeholder="Enter PIN..."
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-center tracking-widest text-xl font-bold focus:border-red-600 outline-none placeholder-gray-600 placeholder:text-base placeholder:tracking-normal placeholder:font-normal" />
              <button type="submit" disabled={scanning || !pinCode || !selectedIncident}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Check In
              </button>
            </div>
          </form>
        )}

        {/* Scan result */}
        {scanResult && (
          <div className={`mt-4 border rounded-xl p-4 flex items-start gap-3 ${
            scanResult.success
              ? 'bg-green-600/10 border-green-600/30'
              : 'bg-red-600/10 border-red-600/30'
          }`}>
            {scanResult.success
              ? <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              : <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />}
            <div>
              <div className={`font-medium text-sm ${scanResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {scanResult.success ? 'Check-in Successful' : 'Check-in Failed'}
              </div>
              {scanResult.personnel && (
                <div className="text-white text-sm font-semibold mt-0.5">
                  {scanResult.personnel.full_name} — {scanResult.personnel.rank}
                </div>
              )}
              <div className="text-gray-400 text-xs mt-0.5">{scanResult.message}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{todayLogs.length}</div>
          <div className="text-gray-500 text-xs mt-1">Today's Entries</div>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{checkedIn}</div>
          <div className="text-gray-500 text-xs mt-1">Still On-Scene</div>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{checkedOut}</div>
          <div className="text-gray-500 text-xs mt-1">Checked Out</div>
        </div>
      </div>

      {/* ── Manual check-in button ────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button onClick={() => setShowManual(true)}
          className="flex items-center gap-2 border border-red-600/40 text-red-400 hover:bg-red-600/10 px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Manual Check-in
        </button>
      </div>

      {/* ── Log table ─────────────────────────────────────────────────────── */}
      {loadingLogs ? (
        <div className="text-center text-gray-500 py-12 text-sm">Loading check-in log...</div>
      ) : !logs.length ? (
        <div className="text-center text-gray-600 py-12 text-sm">No check-in records for this incident</div>
      ) : (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center gap-2">
            <LogIn className="w-4 h-4 text-red-400" />
            <span className="text-white font-semibold">Check-In Log</span>
            <span className="ml-auto text-gray-600 text-xs">{logs.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                  {['Personnel', 'Method', 'Check-In', 'Check-Out', 'Action'].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151515]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-white font-medium text-xs">{getResponderName(log.personnel_id)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${TYPE_COLORS[log.entry_type] ?? TYPE_COLORS.Manual}`}>
                        {log.entry_type || 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.check_in_time ? format(new Date(log.check_in_time), 'MMM d, h:mm a') : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {log.check_out_time
                        ? format(new Date(log.check_out_time), 'MMM d, h:mm a')
                        : <span className="text-green-500">On-scene</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {!log.check_out_time && (
                        <button onClick={() => handleCheckout(log.id)}
                          className="text-gray-400 hover:text-white border border-[#2a2a2a] hover:border-gray-400 px-2 py-1 rounded transition-all">
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Manual check-in modal ─────────────────────────────────────────── */}
      {showManual && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-red-400" /> Manual Check-In
              </h2>
              <button onClick={() => setShowManual(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Responder Unit</label>
                <select value={manualResponderId}
                  onChange={e => setManualResponderId(e.target.value)}
                  className={INPUT_CLS}>
                  <option value="">Select responder unit...</option>
                  {responders.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}{u.type_of_vehicle ? ` — ${u.type_of_vehicle}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Incident</label>
                <div className="text-sm text-gray-300 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5">
                  {incidents.find(i => i.id === selectedIncident)?.location_text || '—'}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
              <button onClick={() => setShowManual(false)}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">
                Cancel
              </button>
              <button onClick={handleManual} disabled={saving || !manualResponderId}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Checking in...' : 'Confirm Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

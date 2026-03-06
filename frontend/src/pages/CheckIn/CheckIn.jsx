/**
 * pages/CheckIn.jsx
 *
 * NFC and PIN check-in interface — simulates hardware scanner input.
 * Wired to checkinApi (POST /checkin/nfc and POST /checkin/pin).
 */

import { useState, useEffect, useRef } from 'react';
import { UserCheck, Wifi, Shield, CheckCircle, XCircle, Hash } from 'lucide-react';
import { checkinApi }   from '@/api/checkin/checkin';
import { incidentsApi } from '@/api/incidents/incidents';
import { ApiError }     from '@/api/client/client';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "max-w-xl mx-auto space-y-6",
  
  header: {
    wrapper: "bg-gradient-to-r from-red-950/50 to-[#111] border border-red-900/30 rounded-xl p-6",
    flexRow: "flex items-center gap-4",
    iconBox: "w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center",
    icon: "w-6 h-6 text-white",
    title: "text-white font-bold text-xl",
    subtitle: "text-gray-400 text-sm"
  },
  
  card: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-5",
    formWrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-6 space-y-4",
    label: "block text-gray-400 text-xs uppercase tracking-wider mb-2",
    emptyText: "text-gray-600 text-sm text-center py-4",
  },
  
  tabs: {
    wrapper: "flex gap-2 bg-[#111] border border-[#1f1f1f] rounded-xl p-1",
    buttonBase: "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
    buttonActive: "bg-red-600 text-white",
    buttonInactive: "text-gray-400 hover:text-white",
    icon: "w-4 h-4"
  },
  
  form: {
    select: "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none",
    inputNfc: "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-3 text-sm font-mono focus:border-red-600 outline-none",
    inputPin: "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-3 text-sm text-center tracking-widest text-xl font-bold focus:border-red-600 outline-none",
    submitBtn: "w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium text-sm disabled:opacity-50 transition-all",
    hintRow: "flex items-center gap-3 text-gray-400 text-sm",
    hintIconNfc: "w-5 h-5 text-green-400 animate-pulse",
    hintIconPin: "w-5 h-5 text-blue-400"
  },
  
  result: {
    wrapperBase: "border rounded-xl p-5 flex items-start gap-4",
    wrapperSuccess: "bg-green-600/10 border-green-600/30",
    wrapperError: "bg-red-600/10 border-red-600/30",
    iconBase: "w-6 h-6 flex-shrink-0 mt-0.5",
    iconSuccess: "text-green-400",
    iconError: "text-red-400",
    titleBase: "font-medium text-sm",
    titleSuccess: "text-green-400",
    titleError: "text-red-400",
    name: "text-white text-sm font-semibold mt-1",
    message: "text-gray-400 text-xs mt-1"
  }
};

export default function CheckIn() {
  const [incidents,       setIncidents]       = useState([]);
  const [selectedIncident,setSelectedIncident]= useState('');
  const [mode,            setMode]            = useState('nfc'); // 'nfc' | 'pin'
  const [nfcTagId,        setNfcTagId]        = useState('');
  const [pinCode,         setPinCode]         = useState('');
  const [result,          setResult]          = useState(null); // { success, personnel, message }
  const [loading,         setLoading]         = useState(false);
  const nfcRef = useRef(null);

  useEffect(() => {
    incidentsApi.list().then(data => {
      const active = (data ?? []).filter(i => i.incident_status === 'Active');
      setIncidents(active);
      if (active.length > 0) setSelectedIncident(active[0].id);
    });
  }, []);

  // Auto-focus NFC field when mode is nfc
  useEffect(() => {
    if (mode === 'nfc') nfcRef.current?.focus();
  }, [mode]);

  const handleNFCCheckIn = async (e) => {
    e.preventDefault();
    if (!nfcTagId || !selectedIncident) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await checkinApi.nfc({ nfc_tag_id: nfcTagId, incident_id: selectedIncident });
      setResult({ success: true, personnel: res.personnel, message: res.message });
      setNfcTagId('');
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 409
        ? 'Personnel already checked in to this incident'
        : err.message;
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
      nfcRef.current?.focus();
    }
  };

  const handlePINCheckIn = async (e) => {
    e.preventDefault();
    if (!pinCode || !selectedIncident) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await checkinApi.pin({ pin_code: pinCode, incident_id: selectedIncident });
      setResult({ success: true, personnel: res.personnel, message: res.message });
      setPinCode('');
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 409
        ? 'Personnel already checked in to this incident'
        : err.message;
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header.wrapper}>
        <div className={styles.header.flexRow}>
          <div className={styles.header.iconBox}>
            <UserCheck className={styles.header.icon} />
          </div>
          <div>
            <h2 className={styles.header.title}>Incident Check-In</h2>
            <p className={styles.header.subtitle}>Scan NFC tag or enter PIN to log arrival</p>
          </div>
        </div>
      </div>

      {/* Incident Selector */}
      <div className={styles.card.wrapper}>
        <label className={styles.card.label}>
          Active Incident *
        </label>
        {incidents.length === 0 ? (
          <div className={styles.card.emptyText}>No active incidents</div>
        ) : (
          <select value={selectedIncident}
            onChange={e => setSelectedIncident(e.target.value)}
            className={styles.form.select}>
            {incidents.map(i => (
              <option key={i.id} value={i.id}>{i.location_text} — {i.alarm_status}</option>
            ))}
          </select>
        )}
      </div>

      {/* Mode Toggle */}
      <div className={styles.tabs.wrapper}>
        {[
          { id: 'nfc', label: 'NFC Scan', icon: Wifi },
          { id: 'pin', label: 'PIN Code', icon: Hash },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMode(id)}
            className={`${styles.tabs.buttonBase} ${
              mode === id ? styles.tabs.buttonActive : styles.tabs.buttonInactive
            }`}>
            <Icon className={styles.tabs.icon} /> {label}
          </button>
        ))}
      </div>

      {/* NFC Form */}
      {mode === 'nfc' && (
        <form onSubmit={handleNFCCheckIn} className={styles.card.formWrapper}>
          <div className={styles.form.hintRow}>
            <Wifi className={styles.form.hintIconNfc} />
            <span>Hold NFC card near reader or type tag ID below</span>
          </div>
          <input
            ref={nfcRef}
            value={nfcTagId}
            onChange={e => setNfcTagId(e.target.value)}
            placeholder="NFC Tag ID (auto-filled by scanner)..."
            className={styles.form.inputNfc}
          />
          <button type="submit" disabled={loading || !nfcTagId || !selectedIncident}
            className={styles.form.submitBtn}>
            {loading ? 'Processing...' : 'Check In via NFC'}
          </button>
        </form>
      )}

      {/* PIN Form */}
      {mode === 'pin' && (
        <form onSubmit={handlePINCheckIn} className={styles.card.formWrapper}>
          <div className={styles.form.hintRow}>
            <Shield className={styles.form.hintIconPin} />
            <span>Enter 4–6 digit personnel PIN</span>
          </div>
          <input
            type="password"
            maxLength={6}
            value={pinCode}
            onChange={e => setPinCode(e.target.value)}
            placeholder="Enter PIN..."
            className={styles.form.inputPin}
          />
          <button type="submit" disabled={loading || !pinCode || !selectedIncident}
            className={styles.form.submitBtn}>
            {loading ? 'Verifying...' : 'Check In via PIN'}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <div className={`${styles.result.wrapperBase} ${
          result.success ? styles.result.wrapperSuccess : styles.result.wrapperError
        }`}>
          {result.success
            ? <CheckCircle className={`${styles.result.iconBase} ${styles.result.iconSuccess}`} />
            : <XCircle className={`${styles.result.iconBase} ${styles.result.iconError}`} />}
          <div>
            <div className={`${styles.result.titleBase} ${result.success ? styles.result.titleSuccess : styles.result.titleError}`}>
              {result.success ? 'Check-in Successful' : 'Check-in Failed'}
            </div>
            {result.personnel && (
              <div className={styles.result.name}>
                {result.personnel.full_name} — {result.personnel.rank}
              </div>
            )}
            <div className={styles.result.message}>{result.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
/**
 * pages/SuperAdmin.jsx
 * Super admin panel — system stats, health check, and station management.
 */
import { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Building2, Plus, X, MapPin } from 'lucide-react';
import api from '@/api/client/client';
import { stationsApi } from '@/api/stations/stations';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "space-y-6",
  
  header: {
    wrapper: "flex items-center gap-3",
    icon: "w-5 h-5 text-red-400",
    title: "text-white font-semibold text-lg"
  },
  
  card: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-6",
    title: "text-white font-medium mb-4 flex items-center gap-2",
    titleNoIcon: "text-white font-medium mb-3",
    titleIcon: "w-4 h-4 text-green-400",
    
    healthRowBase: "flex items-center gap-2 px-4 py-3 rounded-lg border",
    healthOk: "bg-green-600/10 border-green-600/30",
    healthError: "bg-red-600/10 border-red-600/30",
    healthDotBase: "w-2 h-2 rounded-full",
    healthDotOk: "bg-green-400",
    healthDotError: "bg-red-400",
    healthTextBase: "text-sm font-medium",
    healthTextOk: "text-green-400",
    healthTextError: "text-red-400",
    healthChecking: "text-gray-500 text-sm",
    
    infoFlex: "space-y-2 text-sm",
    infoRow: "flex justify-between text-gray-400",
    infoValue: "text-gray-300",
    infoMono: "text-gray-300 font-mono text-xs"
  }
};

const EMPTY_STATION_FORM = {
  station_name: '',
  contact_number: '',
  team_leader_contact: '',
  address_text: '',
  city: '',
  district: '',
  region: '',
};

export default function SuperAdmin() {
  const [health,       setHealth]       = useState(null);
  const [stations,     setStations]     = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(EMPTY_STATION_FORM);
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState('');

  useEffect(() => {
    api.get('/health')
      .then(setHealth)
      .catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  const loadStations = async () => {
    setStationsLoading(true);
    try {
      const data = await stationsApi.list();
      setStations(data ?? []);
    } catch {
      setStations([]);
    } finally {
      setStationsLoading(false);
    }
  };

  useEffect(() => { loadStations(); }, []);

  const handleCreateStation = async () => {
    setFormError('');
    if (!form.station_name || !form.city || !form.district || !form.region) {
      setFormError('Station Name, City, District, and Region are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      // Send null for empty optional strings
      ['contact_number', 'team_leader_contact', 'address_text'].forEach(k => {
        if (!payload[k]) payload[k] = null;
      });
      await stationsApi.create(payload);
      setShowForm(false);
      setForm(EMPTY_STATION_FORM);
      loadStations();
    } catch (err) {
      setFormError(err.message ?? 'Failed to create station');
    } finally {
      setSaving(false);
    }
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header.wrapper}>
        <ShieldCheck className={styles.header.icon} />
        <h2 className={styles.header.title}>Super Admin Panel</h2>
      </div>

      {/* API Health */}
      <div className={styles.card.wrapper}>
        <h3 className={styles.card.title}>
          <Activity className={styles.card.titleIcon} /> API Health
        </h3>
        {health ? (
          <div className={`${styles.card.healthRowBase} ${
            health.status === 'ok' ? styles.card.healthOk : styles.card.healthError
          }`}>
            <div className={`${styles.card.healthDotBase} ${health.status === 'ok' ? styles.card.healthDotOk : styles.card.healthDotError}`} />
            <span className={`${styles.card.healthTextBase} ${health.status === 'ok' ? styles.card.healthTextOk : styles.card.healthTextError}`}>
              {health.status === 'ok' ? 'API Online — BFPACS Backend Running' : 'API Unreachable'}
            </span>
          </div>
        ) : (
          <div className={styles.card.healthChecking}>Checking...</div>
        )}
      </div>

      {/* Station Management */}
      <div className={styles.card.wrapper}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-400" /> Fire Stations
            <span className="text-gray-600 text-xs font-normal ml-1">({stations.length})</span>
          </h3>
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Station
          </button>
        </div>

        {stationsLoading ? (
          <div className="text-gray-500 text-sm py-4 text-center">Loading stations...</div>
        ) : !stations.length ? (
          <div className="text-gray-600 text-sm py-4 text-center">No stations yet. Create one to get started.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stations.map(s => (
              <div key={s.id} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 hover:border-red-600/30 transition-all">
                <div className="text-white font-medium text-sm mb-1">{s.station_name}</div>
                {s.address_text && (
                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                    <MapPin className="w-3 h-3" /> {s.address_text}
                  </div>
                )}
                <div className="text-gray-600 text-xs">{[s.city, s.district, s.region].filter(Boolean).join(', ')}</div>
                {s.contact_number && <div className="text-gray-500 text-xs mt-1">{s.contact_number}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Station Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-red-400" /> Add Fire Station</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Station Name *', field: 'station_name', placeholder: 'BFP Station 1' },
                { label: 'City *',         field: 'city',         placeholder: 'Quezon City' },
                { label: 'District *',     field: 'district',     placeholder: 'District 1' },
                { label: 'Region *',       field: 'region',       placeholder: 'NCR' },
                { label: 'Address',        field: 'address_text', placeholder: '123 Main St' },
                { label: 'Contact Number', field: 'contact_number', placeholder: '+63 2 1234 5678' },
                { label: 'Team Leader Contact', field: 'team_leader_contact', placeholder: '+63 9XX XXX XXXX' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none"
                  />
                </div>
              ))}
              {formError && (
                <div className="text-red-400 text-xs bg-red-600/10 border border-red-600/20 rounded-lg px-3 py-2">{formError}</div>
              )}
            </div>
            <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={handleCreateStation} disabled={saving}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Station'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.card.wrapper}>
        <h3 className={styles.card.titleNoIcon}>Backend Info</h3>
        <div className={styles.card.infoFlex}>
          <div className={styles.card.infoRow}>
            <span>API Base URL</span>
            <span className={styles.card.infoMono}>{baseUrl}</span>
          </div>
          <div className={styles.card.infoRow}>
            <span>Framework</span>
            <span className={styles.card.infoValue}>Go / Gin</span>
          </div>
          <div className={styles.card.infoRow}>
            <span>Database</span>
            <span className={styles.card.infoValue}>PostgreSQL + PostGIS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
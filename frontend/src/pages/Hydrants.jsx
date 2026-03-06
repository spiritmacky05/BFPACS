/**
 * pages/Hydrants.jsx
 * Fire hydrant registry with PostGIS nearby search.
 */

import { useState, useEffect } from 'react';
import { Droplets, Plus, X, Search, MapPin, Gauge, Flame } from 'lucide-react';
import { hydrantsApi } from '@/api/hydrants';
import { useAuth }     from '@/context/AuthContext';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "space-y-6",
  
  header: {
    wrapper: "flex items-center justify-between",
    title: "text-white font-semibold text-lg flex items-center gap-2",
    icon: "w-5 h-5 text-blue-400",
    addBtn: "flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all",
    addIcon: "w-4 h-4"
  },
  
  searchPanel: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-5",
    title: "text-white font-medium mb-3 text-sm flex items-center gap-2",
    titleIcon: "w-4 h-4 text-blue-400",
    formRow: "flex gap-3 flex-wrap",
    inputFlex: "flex-1 min-w-32 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none",
    inputFixed: "w-32 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none",
    searchBtn: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all",
    clearBtn: "px-3 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm",
    resultText: "mt-2 text-gray-500 text-xs"
  },
  
  list: {
    loading: "text-center text-gray-500 py-16",
    empty: "text-center text-gray-600 py-16",
    grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    card: "bg-[#111] border border-[#1f1f1f] rounded-xl p-4 hover:border-blue-600/30 transition-all",
    cardHeader: "flex items-start justify-between mb-2",
    title: "text-white font-semibold text-sm",
    address: "text-gray-500 text-xs mt-0.5",
    statusBadgeBase: "text-xs px-2 py-0.5 rounded border",
    gpsRow: "flex items-center gap-1 text-gray-600 text-xs mt-2",
    gpsIcon: "w-3 h-3",
    distanceText: "text-blue-400 text-xs mt-1",
    metaRow: "flex items-center gap-3 mt-2 pt-2 border-t border-[#1a1a1a]",
    metaItem: "flex items-center gap-1 text-xs text-gray-500",
    metaIcon: "w-3 h-3 text-blue-400 flex-shrink-0",
    metaValue: "text-gray-300",
  },
  
  modal: {
    overlay: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4",
    container: "bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md",
    header: "flex items-center justify-between p-6 border-b border-[#1f1f1f]",
    title: "text-white font-semibold",
    closeBtn: "text-gray-500 hover:text-white",
    closeIcon: "w-5 h-5",
    body: "p-6 space-y-4",
    label: "block text-gray-400 text-xs uppercase tracking-wider mb-1",
    input: "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none",
    gridRow: "grid grid-cols-2 gap-3",
    footer: "p-6 border-t border-[#1f1f1f] flex gap-3 justify-end",
    cancelBtn: "px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm",
    submitBtn: "px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
  }
};

// ─── Constants ────────────────────────────────────────────────────────────────

const HYDRANT_STATUSES = ['Serviceable', 'Under Maintenance', 'Out of Service'];
const HYDRANT_TYPES    = ['Dry Barrel', 'Wet Barrel', 'Stand Pipes'];

const STATUS_COLORS = {
  'Serviceable':      'text-green-400 border-green-600/30 bg-green-600/10',
  'Under Maintenance':'text-yellow-400 border-yellow-600/30 bg-yellow-600/10',
  'Out of Service':   'text-red-400 border-red-600/30 bg-red-600/10',
  // legacy fallbacks
  'Active':           'text-green-400 border-green-600/30 bg-green-600/10',
  'Inactive':         'text-red-400 border-red-600/30 bg-red-600/10',
};

const EMPTY_FORM = {
  hydrant_code: '',
  address_text: '',
  status: 'Serviceable',
  hydrant_type: 'Dry Barrel',
  psi: '',
  lat: '',
  lng: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Hydrants() {
  const [hydrants,  setHydrants]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [searchLat, setSearchLat] = useState('');
  const [searchLng, setSearchLng] = useState('');
  const [radius,    setRadius]    = useState(500);
  const [nearby,    setNearby]    = useState(null);

  const { role } = useAuth();
  // All authenticated roles can add/edit hydrants
  const isAdmin = role === 'superadmin' || role === 'admin' || role === 'user';

  const load = async () => {
    const data = await hydrantsApi.list();
    setHydrants(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    await hydrantsApi.create({
      ...form,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      psi: form.psi ? parseInt(form.psi, 10) : undefined,
    });
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleNearbySearch = async () => {
    const data = await hydrantsApi.nearby(parseFloat(searchLat), parseFloat(searchLng), radius);
    setNearby(data ?? []);
  };

  const displayList = nearby ?? hydrants;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header.wrapper}>
        <h2 className={styles.header.title}>
          <Droplets className={styles.header.icon} /> Fire Hydrants
        </h2>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className={styles.header.addBtn}>
            <Plus className={styles.header.addIcon} /> Add Hydrant
          </button>
        )}
      </div>

      {/* Nearby Search */}
      <div className={styles.searchPanel.wrapper}>
        <h3 className={styles.searchPanel.title}>
          <Search className={styles.searchPanel.titleIcon} /> Find Nearby Hydrants (PostGIS)
        </h3>
        <div className={styles.searchPanel.formRow}>
          <input value={searchLat} onChange={e => setSearchLat(e.target.value)}
            placeholder="Latitude" type="number" step="any"
            className={styles.searchPanel.inputFlex} />
          <input value={searchLng} onChange={e => setSearchLng(e.target.value)}
            placeholder="Longitude" type="number" step="any"
            className={styles.searchPanel.inputFlex} />
          <input value={radius} onChange={e => setRadius(Number(e.target.value))}
            placeholder="Radius (m)" type="number"
            className={styles.searchPanel.inputFixed} />
          <button onClick={handleNearbySearch} disabled={!searchLat || !searchLng}
            className={styles.searchPanel.searchBtn}>
            Search
          </button>
          {nearby !== null && (
            <button onClick={() => setNearby(null)}
              className={styles.searchPanel.clearBtn}>Clear</button>
          )}
        </div>
        {nearby !== null && (
          <div className={styles.searchPanel.resultText}>
            Found {nearby.length} hydrant{nearby.length !== 1 ? 's' : ''} within {radius}m
          </div>
        )}
      </div>

      {/* Hydrant List */}
      {loading ? (
        <div className={styles.list.loading}>Loading hydrants...</div>
      ) : !displayList.length ? (
        <div className={styles.list.empty}>No hydrants found</div>
      ) : (
        <div className={styles.list.grid}>
          {displayList.map(h => (
            <div key={h.id} className={styles.list.card}>
              <div className={styles.list.cardHeader}>
                <div>
                  <div className={styles.list.title}>{h.address || '—'}</div>
                  {h.hydrant_type && (
                    <div className={styles.list.address}>{h.hydrant_type}</div>
                  )}
                </div>
                <span className={`${styles.list.statusBadgeBase} ${STATUS_COLORS[h.status] ?? STATUS_COLORS['Serviceable']}`}>
                  {h.status}
                </span>
              </div>

              {/* PSI + Type meta row */}
              <div className={styles.list.metaRow}>
                {h.psi != null && (
                  <div className={styles.list.metaItem}>
                    <Gauge className={styles.list.metaIcon} />
                    <span className={styles.list.metaValue}>{h.psi} PSI</span>
                  </div>
                )}
                {h.hydrant_type && (
                  <div className={styles.list.metaItem}>
                    <Flame className={styles.list.metaIcon} />
                    <span className={styles.list.metaValue}>{h.hydrant_type}</span>
                  </div>
                )}
              </div>

              {h.lat != null && (
                <div className={styles.list.gpsRow}>
                  <MapPin className={styles.list.gpsIcon} />
                  <span>{h.lat?.toFixed(4)}, {h.lng?.toFixed(4)}</span>
                </div>
              )}
              {h.distance_meters != null && (
                <div className={styles.list.distanceText}>{Math.round(h.distance_meters)}m away</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className={styles.modal.overlay}>
          <div className={styles.modal.container}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>Register Hydrant</h2>
              <button onClick={() => setShowForm(false)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.body}>

              {/* Hydrant Code & Address */}
              <div className={styles.modal.gridRow}>
                <div>
                  <label className={styles.modal.label}>Hydrant Code *</label>
                  <input value={form.hydrant_code}
                    onChange={e => setForm(f => ({ ...f, hydrant_code: e.target.value }))}
                    placeholder="HYD-001"
                    className={styles.modal.input} />
                </div>
                <div>
                  <label className={styles.modal.label}>Address *</label>
                  <input value={form.address_text}
                    onChange={e => setForm(f => ({ ...f, address_text: e.target.value }))}
                    placeholder="123 Rizal Ave"
                    className={styles.modal.input} />
                </div>
              </div>

              {/* Status + Type row */}
              <div className={styles.modal.gridRow}>
                <div>
                  <label className={styles.modal.label}>Status</label>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className={styles.modal.input}>
                    {HYDRANT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={styles.modal.label}>Type</label>
                  <select value={form.hydrant_type}
                    onChange={e => setForm(f => ({ ...f, hydrant_type: e.target.value }))}
                    className={styles.modal.input}>
                    {HYDRANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* PSI */}
              <div>
                <label className={styles.modal.label}>PSI (Pressure)</label>
                <input type="number" min="0" value={form.psi}
                  onChange={e => setForm(f => ({ ...f, psi: e.target.value }))}
                  placeholder="e.g. 65"
                  className={styles.modal.input} />
              </div>

              {/* Lat / Lng */}
              <div className={styles.modal.gridRow}>
                {['lat', 'lng'].map(field => (
                  <div key={field}>
                    <label className={styles.modal.label}>
                      {field === 'lat' ? 'Latitude *' : 'Longitude *'}
                    </label>
                    <input type="number" step="any" value={form[field]}
                      onChange={e => setForm(fm => ({ ...fm, [field]: e.target.value }))}
                      placeholder={field === 'lat' ? '14.5995' : '120.9842'}
                      className={styles.modal.input} />
                  </div>
                ))}
              </div>

            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setShowForm(false)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleCreate}
                disabled={saving || !form.address_text || !form.hydrant_code || !form.lat || !form.lng}
                className={styles.modal.submitBtn}>
                {saving ? 'Registering...' : 'Register Hydrant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
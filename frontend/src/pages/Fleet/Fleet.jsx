/**
 * pages/Fleet.jsx
 *
 * Fleet vehicle management — list, GPS update, movement log viewer.
 */

import { useState, useEffect } from 'react';
import { Truck, MapPin, RefreshCw, Plus, X } from 'lucide-react';
import { fleetApi } from '@/api/fleet/fleet';
import { useAuth }  from '@/context/AuthContext/AuthContext';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "space-y-6",
  
  header: {
    wrapper: "flex items-center justify-between",
    title: "text-white font-semibold text-lg flex items-center gap-2",
    icon: "w-5 h-5 text-red-400",
    subtitle: "text-gray-500 text-xs mt-1",
    actionsFlex: "flex gap-2",
    refreshBtn: "p-2 rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white transition-all",
    refreshIcon: "w-4 h-4",
    addBtn: "flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all",
    addBtnIcon: "w-4 h-4"
  },
  
  grid: {
    mainGrid: "grid grid-cols-1 lg:grid-cols-3 gap-6",
    colSpan2: "lg:col-span-2"
  },
  
  fleetList: {
    loading: "text-center text-gray-500 py-16",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-4",
    cardBase: "bg-[#111] border rounded-xl p-4 cursor-pointer transition-all hover:border-red-600/30",
    cardSelected: "border-red-600/50",
    cardUnselected: "border-[#1f1f1f]",
    headerRow: "flex items-start justify-between mb-3",
    engineCode: "text-white font-semibold",
    plateNumber: "text-gray-500 text-xs",
    statusBadgeBase: "text-xs px-2 py-0.5 rounded border",
    typeText: "text-gray-400 text-xs",
    gpsRow: "flex items-center gap-1 mt-2 text-gray-600 text-xs",
    gpsIcon: "w-3 h-3"
  },
  
  logPanel: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-4",
    title: "text-white font-medium mb-4 text-sm",
    loading: "text-gray-500 text-xs text-center py-8",
    empty: "text-gray-600 text-xs text-center py-8",
    listWrapper: "space-y-3 overflow-y-auto max-h-96",
    logItem: "border-l-2 border-red-600/40 pl-3",
    logStatus: "text-white text-xs font-medium",
    logTime: "text-gray-600 text-xs",
    logGps: "text-gray-600 text-xs"
  },
  
  modal: {
    overlay: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4",
    container: "bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md",
    header: "flex items-center justify-between p-6 border-b border-[#1f1f1f]",
    title: "text-white font-semibold flex items-center gap-2",
    titleIcon: "w-4 h-4 text-red-400",
    closeBtn: "text-gray-500 hover:text-white",
    closeIcon: "w-5 h-5",
    body: "p-6 space-y-4",
    label: "block text-gray-400 text-xs uppercase tracking-wider mb-1",
    input: "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none",
    footer: "p-6 border-t border-[#1f1f1f] flex gap-3 justify-end",
    cancelBtn: "px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm",
    submitBtn: "px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
  }
};

// These match the actual DB values in the fleets table
const FLEET_STATUS_COLORS = {
  Serviceable: 'text-green-400 bg-green-600/10 border-green-600/30',
  Dispatched:  'text-red-400 bg-red-600/10 border-red-600/30',
  Maintenance: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  Inactive:    'text-gray-400 bg-gray-600/10 border-gray-600/30',
};

const VEHICLE_TYPES = ['Fire Truck', 'Tanker', 'Ladder Truck', 'Rescue Truck', 'Command Vehicle', 'Utility Vehicle'];

// Must match the check_ft_capacity DB constraint exactly
const FT_CAPACITIES = ['250 GAL', '500 GAL', '1000 GAL', '1500 GAL', '3000 GAL', '3500 GAL', '4000 GAL', 'Others'];

const EMPTY_FORM = { engine_code: '', plate_number: '', vehicle_type: 'Fire Truck', ft_capacity: '500 GAL' };

export default function Fleet() {
  const [fleets,         setFleets]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);
  const [selectedFleet,  setSelectedFleet]  = useState(null);
  const [movementLogs,   setMovementLogs]   = useState([]);
  const [logsLoading,    setLogsLoading]    = useState(false);
  const [showLogForm,    setShowLogForm]    = useState(false);
  const [logForm,        setLogForm]        = useState({ status_code: '', lat: '', lng: '' });
  const [loggingMove,    setLoggingMove]    = useState(false);

  const { role }  = useAuth();
  // Fleet: superadmin = full access, admin = view only, user = hidden (nav)
  const isAdmin   = role === 'superadmin';

  const load = async () => {
    const data = await fleetApi.list();
    setFleets(data ?? []);
    setLoading(false);
  };

  const loadLogs = async (fleetId) => {
    setLogsLoading(true);
    const logs = await fleetApi.getMovementLogs(fleetId);
    setMovementLogs(logs ?? []);
    setLogsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    // ft_capacity is required by DB check constraint — always include it
    await fleetApi.create({
      engine_code:   form.engine_code,
      plate_number:  form.plate_number,
      vehicle_type:  form.vehicle_type,
      ft_capacity:   form.ft_capacity,
    });
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleSelectFleet = (fleet) => {
    setSelectedFleet(fleet);
    loadLogs(fleet.id);
  };

  const handleLogMovement = async () => {
    if (!selectedFleet) return;
    setLoggingMove(true);
    await fleetApi.logMovement(selectedFleet.id, {
      status_code: logForm.status_code,
      lat: logForm.lat ? parseFloat(logForm.lat) : undefined,
      lng: logForm.lng ? parseFloat(logForm.lng) : undefined,
    });
    setLoggingMove(false);
    setShowLogForm(false);
    setLogForm({ status_code: '', lat: '', lng: '' });
    loadLogs(selectedFleet.id);
    load(); // refresh fleet status
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header.wrapper}>
        <div>
          <h2 className={styles.header.title}>
            <Truck className={styles.header.icon} /> Fleet
          </h2>
          <p className={styles.header.subtitle}>{fleets.length} vehicles registered</p>
        </div>
        <div className={styles.header.actionsFlex}>
          <button onClick={load} className={styles.header.refreshBtn}>
            <RefreshCw className={styles.header.refreshIcon} />
          </button>
          {isAdmin && (
            <button onClick={() => setShowForm(true)}
              className={styles.header.addBtn}>
              <Plus className={styles.header.addBtnIcon} /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      <div className={styles.grid.mainGrid}>
        {/* Fleet List */}
        <div className={styles.grid.colSpan2}>
          {loading ? (
            <div className={styles.fleetList.loading}>Loading fleet...</div>
          ) : (
            <div className={styles.fleetList.grid}>
              {fleets.map(f => (
                <div key={f.id}
                  onClick={() => handleSelectFleet(f)}
                  className={`${styles.fleetList.cardBase} ${
                    selectedFleet?.id === f.id ? styles.fleetList.cardSelected : styles.fleetList.cardUnselected
                  }`}>
                  <div className={styles.fleetList.headerRow}>
                    <div>
                      <div className={styles.fleetList.engineCode}>{f.engine_code}</div>
                      <div className={styles.fleetList.plateNumber}>{f.plate_number}</div>
                    </div>
                    <span className={`${styles.fleetList.statusBadgeBase} ${FLEET_STATUS_COLORS[f.status] ?? FLEET_STATUS_COLORS.Inactive}`}>
                      {f.status}
                    </span>
                  </div>
                  <div className={styles.fleetList.typeText}>{f.vehicle_type}</div>
                  {(f.lat != null && f.lng != null) && (
                    <div className={styles.fleetList.gpsRow}>
                      <MapPin className={styles.fleetList.gpsIcon} />
                      <span>{f.lat.toFixed(4)}, {f.lng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Movement Log Panel */}
        <div className={styles.logPanel.wrapper}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium text-sm">
              {selectedFleet ? `${selectedFleet.engine_code} — Movement Log` : 'Select a vehicle to view log'}
            </h3>
            {selectedFleet && (
              <button 
                onClick={() => setShowLogForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Log Status
              </button>
            )}
          </div>
          {logsLoading ? (
            <div className={styles.logPanel.loading}>Loading...</div>
          ) : !movementLogs.length ? (
            <div className={styles.logPanel.empty}>No movement records</div>
          ) : (
            <div className={styles.logPanel.listWrapper}>
              {movementLogs.map(log => (
                <div key={log.id} className={styles.logPanel.logItem}>
                  <div className={styles.logPanel.logStatus}>{log.status_code}</div>
                  <div className={styles.logPanel.logTime}>
                    {new Date(log.recorded_at).toLocaleString()}
                  </div>
                  {log.lat != null && (
                    <div className={styles.logPanel.logGps}>{log.lat.toFixed(4)}, {log.lng.toFixed(4)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className={styles.modal.overlay}>
          <div className={styles.modal.container}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>
                <Truck className={styles.modal.titleIcon} /> Register Vehicle
              </h2>
              <button onClick={() => setShowForm(false)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.body}>
              {[
                { label: 'Engine Code *', field: 'engine_code', placeholder: 'E-101' },
                { label: 'Plate Number *', field: 'plate_number', placeholder: 'ABC-1234' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className={styles.modal.label}>{label}</label>
                  <input value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className={styles.modal.input} />
                </div>
              ))}
              <div>
                <label className={styles.modal.label}>Vehicle Type</label>
                <select value={form.vehicle_type}
                  onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
                  className={styles.modal.input}>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.modal.label}>Tank Capacity *</label>
                <select value={form.ft_capacity}
                  onChange={e => setForm(f => ({ ...f, ft_capacity: e.target.value }))}
                  className={styles.modal.input}>
                  {FT_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setShowForm(false)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.engine_code || !form.plate_number}
                className={styles.modal.submitBtn}>
                {saving ? 'Registering...' : 'Register Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Movement Modal */}
      {showLogForm && (
        <div className={styles.modal.overlay}>
          <div className={styles.modal.container}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>
                <RefreshCw className={styles.modal.titleIcon} /> Log Movement Status
              </h2>
              <button onClick={() => setShowLogForm(false)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.body}>
              <div>
                <label className={styles.modal.label}>Status Code / Action *</label>
                <select value={logForm.status_code}
                  onChange={e => setLogForm(f => ({ ...f, status_code: e.target.value }))}
                  className={styles.modal.input}>
                  <option value="" disabled>Select Status Code</option>
                  <option value="10-14 (En route)">10-14 (En route)</option>
                  <option value="10-23 (Arrived at scene)">10-23 (Arrived at scene)</option>
                  <option value="10-24 (Operation finished/Clear)">10-24 (Operation finished/Clear)</option>
                  <option value="10-25 (Return to base)">10-25 (Return to base)</option>
                  <option value="Maintenance (Out of Service)">Maintenance (Out of Service)</option>
                  <option value="Serviceable (Available)">Serviceable (Available)</option>
                </select>
              </div>
              <div>
                <label className={styles.modal.label}>Latitude (Optional)</label>
                <input type="number" step="any" value={logForm.lat}
                  onChange={e => setLogForm(f => ({ ...f, lat: e.target.value }))}
                  placeholder="e.g. 14.5995"
                  className={styles.modal.input} />
              </div>
              <div>
                <label className={styles.modal.label}>Longitude (Optional)</label>
                <input type="number" step="any" value={logForm.lng}
                  onChange={e => setLogForm(f => ({ ...f, lng: e.target.value }))}
                  placeholder="e.g. 120.9842"
                  className={styles.modal.input} />
              </div>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setShowLogForm(false)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleLogMovement} disabled={loggingMove || !logForm.status_code}
                className={styles.modal.submitBtn}>
                {loggingMove ? 'Logging...' : 'Save Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
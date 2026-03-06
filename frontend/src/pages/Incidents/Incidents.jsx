/**
 * pages/Incidents.jsx
 *
 * Fire incident list — card/list view, filter by status, create/edit/close.
 * Replaces all base44.entities.Incident calls with incidentsApi.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Clock, X, Pencil, Grid, List } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { incidentsApi }     from '@/api/incidents/incidents';
import { useAuth }          from '@/context/AuthContext/AuthContext';
import IncidentEditModal    from '../../components/incidents/IncidentEditModal/IncidentEditModal';
import ConfirmationModal    from '../../components/common/ConfirmationModal/ConfirmationModal';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "space-y-6",
  
  controls: {
    wrapper: "flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between",
    filterFlex: "flex gap-2 flex-wrap",
    filterBtnBase: "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
    filterBtnActive: "bg-red-600 border-red-600 text-white",
    filterBtnInactive: "border-[#1f1f1f] text-gray-400 hover:border-red-600/40 hover:text-white",
    
    actionsFlex: "flex gap-2 items-center",
    viewToggleGroup: "flex gap-1 border border-[#1f1f1f] rounded-lg p-1 bg-[#0a0a0a]",
    viewBtnBase: "p-1.5 rounded transition-all",
    viewBtnActive: "bg-red-600/20 text-red-400",
    viewBtnInactive: "text-gray-500 hover:text-gray-400",
    viewIcon: "w-4 h-4",
    
    addBtn: "flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all",
    addIcon: "w-4 h-4"
  },
  
  list: {
    loading: "text-center text-gray-500 py-16",
    empty: "text-center text-gray-600 py-16",
    
    cardGrid: "grid grid-cols-1 lg:grid-cols-2 gap-4",
    cardWrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-5 hover:border-red-600/30 transition-all cursor-pointer",
    cardHeader: "flex items-start justify-between mb-3",
    cardTitle: "text-white font-semibold",
    cardSubtitle: "text-xs text-gray-500 mt-0.5",
    cardBadgesFlex: "flex flex-col items-end gap-2",
    badgeBase: "text-xs px-2 py-0.5 rounded border",
    editBtn: "flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40 transition-all",
    editIcon: "w-3 h-3",
    
    cardDetails: "space-y-1 mb-4",
    detailGroup: "flex items-center gap-2 text-gray-500 text-xs",
    detailIcon: "w-3 h-3",
    detailText: "text-xs text-gray-500",
    detailHighlight: "text-gray-300",
    casualtyFlex: "flex gap-3 text-xs mt-1",
    injuredText: "text-red-400",
    rescuedText: "text-green-400",
    
    actionBtnsFlex: "flex gap-2 flex-wrap",
    actionBtnControlled: "text-xs px-3 py-1 rounded border border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/10 transition-all",
    actionBtnFireOut: "text-xs px-3 py-1 rounded border border-blue-600/40 text-blue-400 hover:bg-blue-600/10 transition-all",
    actionBtnClose: "text-xs px-3 py-1 rounded border border-gray-600/40 text-gray-400 hover:bg-gray-600/10 transition-all",
    
    tableWrapper: "border border-[#1f1f1f] rounded-xl overflow-hidden",
    table: "w-full",
    theadTr: "border-b border-[#1f1f1f] bg-[#0a0a0a]",
    th: "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase",
    tbodyTr: "border-b border-[#1f1f1f] hover:bg-[#0a0a0a] transition-all cursor-pointer",
    tdWhite: "px-4 py-3 text-sm text-white",
    tdOrange: "px-4 py-3 text-xs text-orange-400",
    tdBadge: "px-4 py-3 text-xs",
    tdGray: "px-4 py-3 text-xs text-gray-500",
    tdAction: "px-4 py-3 text-xs",
    inlineBadgeBase: "px-2 py-1 rounded border",
    tableEditBtn: "px-2 py-1 rounded border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40 transition-all"
  },
  
  modal: {
    overlay: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4",
    container: "bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto",
    header: "flex items-center justify-between p-6 border-b border-[#1f1f1f]",
    title: "text-white font-semibold flex items-center gap-2",
    titleIcon: "w-4 h-4 text-red-400",
    closeBtn: "text-gray-500 hover:text-white",
    closeIcon: "w-5 h-5",
    body: "p-6 space-y-4",
    label: "block text-gray-400 text-xs uppercase tracking-wider mb-1",
    labelReq: "text-red-500",
    labelOpt: "text-gray-600 text-xs normal-case",
    input: "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none",
    gridRow: "grid grid-cols-2 gap-3",
    footer: "p-6 border-t border-[#1f1f1f] flex gap-3 justify-end",
    cancelBtn: "px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm",
    submitBtn: "px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
  }
};

const ALARM_COLORS = {
  '1st Alarm':    'text-yellow-400 border-yellow-600/40 bg-yellow-600/10',
  '2nd Alarm':    'text-orange-400 border-orange-600/40 bg-orange-600/10',
  '3rd Alarm':    'text-red-400 border-red-600/40 bg-red-600/10',
  'General Alarm':'text-red-300 border-red-500 bg-red-600/20',
};

const STATUS_COLORS = {
  Active:     'text-red-400 bg-red-600/10 border-red-600/30',
  Controlled: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Fire Out': 'text-blue-400 bg-blue-600/10 border-blue-600/30',
  Done:       'text-gray-400 bg-gray-600/10 border-gray-600/30',
};

const OCCUPANCY_TYPES = [
  'Residential Board and Care', 'Mixed Occupancy', 'Mercantile', 'Industrial',
  'Healthcare', 'Educational', 'Detention and Correctional', 'Day Care',
  'Business', 'Assembly', 'Single and Two Family Dwelling',
  'Lodging and Rooming Houses', 'Hotel', 'Dormitory', 'Condominium',
  'Apartment Building', 'Commercial', 'Residential',
];

const EMPTY_FORM = {
  location_text:   '',
  alarm_status:    '1st Alarm',
  response_type:   'Fire Incident',
  occupancy_type:  '',
  involved_type:   '',
  lat:             '',
  lng:             '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Incidents() {
  const [incidents,      setIncidents]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);
  const [filter,         setFilter]         = useState('All');
  const [editingIncident,setEditingIncident]= useState(null);
  const [confirmAction,  setConfirmAction]  = useState(null);
  const [viewMode,       setViewMode]       = useState('card');
  const navigate = useNavigate();

  const { role }       = useAuth();
  const isAdmin        = role === 'admin' || role === 'superadmin';

  // ── Data ────────────────────────────────────────────────────────────────────
  const load = async () => {
    const data = await incidentsApi.list();
    setIncidents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setSaving(true);
    await incidentsApi.create({
      ...form,
      lat: form.lat ? parseFloat(form.lat) : undefined,
      lng: form.lng ? parseFloat(form.lng) : undefined,
    });
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const updateStatus = async (id, incidentStatus) => {
    await incidentsApi.updateStatus(id, { incident_status: incidentStatus });
    load();
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered =
    filter === 'All'
      ? incidents.filter(i => i.incident_status !== 'Done')
      : incidents.filter(i => i.incident_status === filter);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>
      {/* Controls */}
      <div className={styles.controls.wrapper}>
        <div className={styles.controls.filterFlex}>
          {['All', 'Active', 'Controlled', 'Fire Out', 'Done'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`${styles.controls.filterBtnBase} ${
                filter === f ? styles.controls.filterBtnActive : styles.controls.filterBtnInactive
              }`}>
              {f === 'Done' ? '📦 Archived' : f}
            </button>
          ))}
        </div>
        <div className={styles.controls.actionsFlex}>
          <div className={styles.controls.viewToggleGroup}>
            <button onClick={() => setViewMode('card')}
              className={`${styles.controls.viewBtnBase} ${viewMode === 'card' ? styles.controls.viewBtnActive : styles.controls.viewBtnInactive}`}>
              <Grid className={styles.controls.viewIcon} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`${styles.controls.viewBtnBase} ${viewMode === 'list' ? styles.controls.viewBtnActive : styles.controls.viewBtnInactive}`}>
              <List className={styles.controls.viewIcon} />
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(true)}
              className={styles.controls.addBtn}>
              <Plus className={styles.controls.addIcon} /> Report Incident
            </button>
          )}
        </div>
      </div>

      {/* Incident Cards / List */}
      {loading ? (
        <div className={styles.list.loading}>Loading incidents...</div>
      ) : !filtered.length ? (
        <div className={styles.list.empty}>No incidents found</div>
      ) : viewMode === 'card' ? (
        <div className={styles.list.cardGrid}>
          {filtered.map(inc => (
            <div key={inc.id}
              className={styles.list.cardWrapper}
              onClick={() => navigate(createPageUrl(`IncidentDetail?id=${inc.id}`))}>

              <div className={styles.list.cardHeader}>
                <div>
                  <h3 className={styles.list.cardTitle}>{inc.location_text}</h3>
                  {inc.occupancy_type && (
                    <div className={styles.list.cardSubtitle}>{inc.occupancy_type}</div>
                  )}
                </div>
                <div className={styles.list.cardBadgesFlex}>
                  {inc.alarm_status && (
                    <span className={`${styles.list.badgeBase} ${ALARM_COLORS[inc.alarm_status] ?? ''}`}>
                      {inc.alarm_status}
                    </span>
                  )}
                  <span className={`${styles.list.badgeBase} ${STATUS_COLORS[inc.incident_status] ?? STATUS_COLORS.Active}`}>
                    {inc.incident_status}
                  </span>
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); setEditingIncident(inc); }}
                      className={styles.list.editBtn}>
                      <Pencil className={styles.list.editIcon} /> Edit
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.list.cardDetails}>
                {inc.date_time_reported && (
                  <div className={styles.list.detailGroup}>
                    <Clock className={styles.list.detailIcon} />
                    <span>{format(new Date(inc.date_time_reported), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {inc.ground_commander && (
                  <div className={styles.list.detailText}>Ground Cmdr: <span className={styles.list.detailHighlight}>{inc.ground_commander}</span></div>
                )}
                {(inc.total_injured > 0 || inc.total_rescued > 0) && (
                  <div className={styles.list.casualtyFlex}>
                    {inc.total_injured > 0 && <span className={styles.list.injuredText}>Injured: {inc.total_injured}</span>}
                    {inc.total_rescued > 0 && <span className={styles.list.rescuedText}>Rescued: {inc.total_rescued}</span>}
                  </div>
                )}
              </div>

              {/* Status action buttons */}
              {isAdmin && inc.incident_status === 'Active' && (
                <div className={styles.list.actionBtnsFlex} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setConfirmAction({ type: 'controlled', id: inc.id })}
                    className={styles.list.actionBtnControlled}>
                    Mark Controlled
                  </button>
                  <button onClick={() => setConfirmAction({ type: 'fireOut', id: inc.id })}
                    className={styles.list.actionBtnFireOut}>
                    Fire Out
                  </button>
                </div>
              )}
              {isAdmin && inc.incident_status === 'Fire Out' && (
                <button onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'done', id: inc.id }); }}
                  className={styles.list.actionBtnClose}>
                  Close Incident
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.list.tableWrapper}>
          <table className={styles.list.table}>
            <thead>
              <tr className={styles.list.theadTr}>
                {['Location', 'Alarm', 'Status', 'Reported', 'Actions'].map(h => (
                  <th key={h} className={styles.list.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc => (
                <tr key={inc.id}
                  className={styles.list.tbodyTr}
                  onClick={() => navigate(createPageUrl(`IncidentDetail?id=${inc.id}`))}>
                  <td className={styles.list.tdWhite}>{inc.location_text}</td>
                  <td className={styles.list.tdOrange}>{inc.alarm_status ?? '—'}</td>
                  <td className={styles.list.tdBadge}>
                    <span className={`${styles.list.inlineBadgeBase} ${STATUS_COLORS[inc.incident_status] ?? STATUS_COLORS.Active}`}>
                      {inc.incident_status}
                    </span>
                  </td>
                  <td className={styles.list.tdGray}>
                    {inc.date_time_reported ? format(new Date(inc.date_time_reported), 'MMM d, h:mm a') : '—'}
                  </td>
                  <td className={styles.list.tdAction} onClick={e => e.stopPropagation()}>
                    {isAdmin && (
                      <button onClick={() => setEditingIncident(inc)}
                        className={styles.list.tableEditBtn}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'controlled' ? 'Mark as Controlled' :
            confirmAction.type === 'fireOut'    ? 'Fire Out' : 'Close Incident'
          }
          message={
            confirmAction.type === 'controlled' ? 'Mark this incident as controlled?' :
            confirmAction.type === 'fireOut'    ? 'Confirm fire is out?' :
            'Close this incident? This cannot be easily undone.'
          }
          confirmText={
            confirmAction.type === 'controlled' ? 'Mark Controlled' :
            confirmAction.type === 'fireOut'    ? 'Fire Out' : 'Close Incident'
          }
          isDangerous={confirmAction.type === 'done'}
          onConfirm={() => {
            const statusMap = { controlled: 'Controlled', fireOut: 'Fire Out', done: 'Done' };
            updateStatus(confirmAction.id, statusMap[confirmAction.type]);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Edit Modal */}
      {editingIncident && (
        <IncidentEditModal
          incident={editingIncident}
          onClose={() => setEditingIncident(null)}
          onSaved={load}
        />
      )}

      {/* Create Modal */}
      {showForm && (
        <div className={styles.modal.overlay}>
          <div className={styles.modal.container}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>
                <AlertTriangle className={styles.modal.titleIcon} /> Report Incident
              </h2>
              <button onClick={() => setShowForm(false)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.body}>
              <div>
                <label className={styles.modal.label}>
                  Location Address <span className={styles.modal.labelReq}>*</span>
                </label>
                <input value={form.location_text}
                  onChange={e => setForm(f => ({ ...f, location_text: e.target.value }))}
                  placeholder="Type exact location address..."
                  className={styles.modal.input} />
              </div>
              <div>
                <label className={styles.modal.label}>Alarm Status</label>
                <select value={form.alarm_status}
                  onChange={e => setForm(f => ({ ...f, alarm_status: e.target.value }))}
                  className={styles.modal.input}>
                  {['1st Alarm', '2nd Alarm', '3rd Alarm', 'General Alarm'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.modal.label}>
                  Type of Occupancy <span className={styles.modal.labelOpt}>(optional)</span>
                </label>
                <select value={form.occupancy_type}
                  onChange={e => setForm(f => ({ ...f, occupancy_type: e.target.value }))}
                  className={styles.modal.input}>
                  <option value="">— Select Occupancy Type —</option>
                  {OCCUPANCY_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className={styles.modal.gridRow}>
                <div>
                  <label className={styles.modal.label}>Latitude (optional)</label>
                  <input type="number" step="any" value={form.lat}
                    onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                    placeholder="14.5995"
                    className={styles.modal.input} />
                </div>
                <div>
                  <label className={styles.modal.label}>Longitude (optional)</label>
                  <input type="number" step="any" value={form.lng}
                    onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                    placeholder="120.9842"
                    className={styles.modal.input} />
                </div>
              </div>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setShowForm(false)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.location_text}
                className={styles.modal.submitBtn}>
                {saving ? 'Reporting...' : 'Report Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
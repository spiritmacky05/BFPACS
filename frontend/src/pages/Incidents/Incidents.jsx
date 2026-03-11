/**
 * pages/Incidents.jsx
 *
 * Fire incident list — card/list view, filter by status, create/edit/close/delete.
 * Ported from bfpacs_update Incidents page, adapted for custom API.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Clock, X, Pencil, Trash2, Grid, List } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { incidentsApi }     from '@/api/incidents/incidents';
import { dispatchesApi }    from '@/api/dispatches/dispatches';
import { fleetApi }         from '@/api/fleet/fleet';
import { useAuth }          from '@/context/AuthContext/AuthContext';
import IncidentEditModal    from '../../components/incidents/IncidentEditModal/IncidentEditModal';
import ConfirmationModal    from '../../components/common/ConfirmationModal/ConfirmationModal';

const ALARM_COLORS = {
  '1st Alarm':    'text-yellow-400 border-yellow-600/40 bg-yellow-600/10',
  '2nd Alarm':    'text-orange-400 border-orange-600/40 bg-orange-600/10',
  '3rd Alarm':    'text-red-400 border-red-600/40 bg-red-600/10',
  '4th Alarm':    'text-red-400 border-red-600/40 bg-red-600/10',
  '5th Alarm':    'text-red-300 border-red-500 bg-red-600/20',
  'General Alarm':'text-red-300 border-red-500 bg-red-600/20',
};

const STATUS_COLORS = {
  Active:      'text-red-400 bg-red-600/10 border-red-600/30',
  Controlled:  'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Fire Out':  'text-blue-400 bg-blue-600/10 border-blue-600/30',
  Done:        'text-gray-400 bg-gray-600/10 border-gray-600/30',
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

const INPUT_CLS = "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none";

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
  const isSuperAdmin   = role === 'superadmin';

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

    // When fire is out, release every fleet unit dispatched to this incident
    if (incidentStatus === 'Fire Out') {
      const dispatches = await dispatchesApi.getByIncident(id);
      await Promise.all(
        (dispatches ?? []).map(d =>
          Promise.all([
            fleetApi.update(d.fleet_id, { status: 'Serviceable' }),
            fleetApi.logMovement(d.fleet_id, { status_code: 'Fire Out' }),
          ])
        )
      );
    }

    load();
  };

  const deleteIncident = async (id) => {
    try {
      await incidentsApi.delete(id);
      load();
    } catch (err) {
      console.error('Failed to delete incident:', err);
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered =
    filter === 'All'
      ? incidents.filter(i => i.incident_status !== 'Done')
      : incidents.filter(i => i.incident_status === filter);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['All', 'Active', 'Controlled', 'Fire Out', 'Done'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === f
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-[#1f1f1f] text-gray-400 hover:border-red-600/40 hover:text-white'
              }`}>
              {f === 'Done' ? '📦 Archived' : f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 border border-[#1f1f1f] rounded-lg p-1 bg-[#0a0a0a]">
            <button onClick={() => setViewMode('card')}
              className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-red-600/20 text-red-400' : 'text-gray-500 hover:text-gray-400'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-red-600/20 text-red-400' : 'text-gray-500 hover:text-gray-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Report Incident
            </button>
          )}
        </div>
      </div>

      {/* Incident Cards / List */}
      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading incidents...</div>
      ) : !filtered.length ? (
        <div className="text-center text-gray-600 py-16">No incidents found</div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(inc => (
            <div key={inc.id}
              className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 hover:border-red-600/30 transition-all cursor-pointer"
              onClick={() => navigate(createPageUrl(`IncidentDetail?id=${inc.id}`))}>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{inc.id?.slice(0, 8)?.toUpperCase()}</div>
                  <h3 className="text-white font-semibold">{inc.location_text}</h3>
                  {inc.occupancy_type && (
                    <div className="text-xs text-gray-500 mt-0.5">{inc.occupancy_type}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {inc.alarm_status && (
                    <span className={`text-xs px-2 py-0.5 rounded border ${ALARM_COLORS[inc.alarm_status] ?? 'text-orange-400 border-orange-600/40 bg-orange-600/10'}`}>
                      {inc.alarm_status}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[inc.incident_status] ?? STATUS_COLORS.Active}`}>
                    {inc.incident_status}
                  </span>
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); setEditingIncident(inc); }}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40 transition-all">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1 mb-4">
                {inc.date_time_reported && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(inc.date_time_reported), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {inc.ground_commander && (
                  <div className="text-xs text-gray-500">Ground Cmdr: <span className="text-gray-300">{inc.ground_commander}</span></div>
                )}
                {inc.ics_commander && (
                  <div className="text-xs text-gray-500">ICS Cmdr: <span className="text-gray-300">{inc.ics_commander}</span></div>
                )}
                {(inc.total_injured > 0 || inc.total_rescued > 0) && (
                  <div className="flex gap-3 text-xs mt-1">
                    {inc.total_injured > 0 && <span className="text-red-400">Injured: {inc.total_injured}</span>}
                    {inc.total_rescued > 0 && <span className="text-green-400">Rescued: {inc.total_rescued}</span>}
                  </div>
                )}
              </div>

              {/* Status action buttons */}
              {isAdmin && inc.incident_status === 'Active' && (
                <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setConfirmAction({ type: 'controlled', id: inc.id })}
                    className="text-xs px-3 py-1 rounded border border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/10 transition-all">
                    Mark Controlled
                  </button>
                  <button onClick={() => setConfirmAction({ type: 'fireOut', id: inc.id })}
                    className="text-xs px-3 py-1 rounded border border-blue-600/40 text-blue-400 hover:bg-blue-600/10 transition-all">
                    Fire Out
                  </button>
                </div>
              )}
              {isAdmin && inc.incident_status === 'Fire Out' && (
                <button onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'done', id: inc.id }); }}
                  className="text-xs px-3 py-1 rounded border border-gray-600/40 text-gray-400 hover:bg-gray-600/10 transition-all">
                  Close Incident
                </button>
              )}
              {isSuperAdmin && inc.incident_status === 'Done' && (
                <button onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'delete', id: inc.id }); }}
                  className="flex items-center gap-1 text-xs px-3 py-1 rounded border border-red-600/40 text-red-400 hover:bg-red-600/10 transition-all mt-2">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-[#1f1f1f] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f] bg-[#0a0a0a]">
                {['Location', 'Alarm', 'Status', 'Reported', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc => (
                <tr key={inc.id}
                  className="border-b border-[#1f1f1f] hover:bg-[#0a0a0a] transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl(`IncidentDetail?id=${inc.id}`))}>
                  <td className="px-4 py-3 text-sm text-white">{inc.location_text}</td>
                  <td className="px-4 py-3 text-xs text-orange-400">{inc.alarm_status ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-1 rounded border ${STATUS_COLORS[inc.incident_status] ?? STATUS_COLORS.Active}`}>
                      {inc.incident_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {inc.date_time_reported ? format(new Date(inc.date_time_reported), 'MMM d, h:mm a') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <button onClick={() => setEditingIncident(inc)}
                          className="px-2 py-1 rounded border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40 transition-all">
                          Edit
                        </button>
                      )}
                      {isSuperAdmin && inc.incident_status === 'Done' && (
                        <button onClick={() => setConfirmAction({ type: 'delete', id: inc.id })}
                          className="px-2 py-1 rounded border border-red-600/40 text-red-400 hover:bg-red-600/10 transition-all">
                          Delete
                        </button>
                      )}
                    </div>
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
            confirmAction.type === 'fireOut'    ? 'Fire Out' :
            confirmAction.type === 'done'       ? 'Close Incident' : 'Delete Incident'
          }
          message={
            confirmAction.type === 'controlled' ? 'Are you sure you want to mark this incident as controlled?' :
            confirmAction.type === 'fireOut'    ? 'Are you sure the fire is out? This will update the incident status.' :
            confirmAction.type === 'done'       ? 'Are you sure you want to close this incident? This action cannot be easily undone.' :
            'Are you sure you want to permanently delete this incident? This cannot be undone.'
          }
          confirmText={
            confirmAction.type === 'controlled' ? 'Mark Controlled' :
            confirmAction.type === 'fireOut'    ? 'Fire Out' :
            confirmAction.type === 'done'       ? 'Close Incident' : 'Delete Incident'
          }
          isDangerous={confirmAction.type === 'done' || confirmAction.type === 'delete'}
          onConfirm={() => {
            if (confirmAction.type === 'delete') {
              deleteIncident(confirmAction.id);
            } else {
              const statusMap = { controlled: 'Controlled', fireOut: 'Fire Out', done: 'Done' };
              updateStatus(confirmAction.id, statusMap[confirmAction.type]);
            }
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Report Incident
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Location Address <span className="text-red-500">*</span>
                </label>
                <input value={form.location_text}
                  onChange={e => setForm(f => ({ ...f, location_text: e.target.value }))}
                  placeholder="Type exact location address..."
                  className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Alarm Status</label>
                <select value={form.alarm_status}
                  onChange={e => setForm(f => ({ ...f, alarm_status: e.target.value }))}
                  className={INPUT_CLS}>
                  {['1st Alarm', '2nd Alarm', '3rd Alarm', '4th Alarm', '5th Alarm', 'General Alarm'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Type of Occupancy <span className="text-gray-600 text-xs normal-case">(optional)</span>
                </label>
                <select value={form.occupancy_type}
                  onChange={e => setForm(f => ({ ...f, occupancy_type: e.target.value }))}
                  className={INPUT_CLS}>
                  <option value="">— Select Occupancy Type —</option>
                  {OCCUPANCY_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Latitude (optional)</label>
                  <input type="number" step="any" value={form.lat}
                    onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                    placeholder="14.5995"
                    className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Longitude (optional)</label>
                  <input type="number" step="any" value={form.lng}
                    onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                    placeholder="120.9842"
                    className={INPUT_CLS} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.location_text}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Reporting...' : 'Report Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
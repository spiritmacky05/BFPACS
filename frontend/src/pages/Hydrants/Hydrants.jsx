/**
 * pages/Hydrants.jsx
 *
 * Fire hydrant registry with PostGIS nearby search, edit/delete,
 * status filters, and inline status change.
 * Migrated from bfpacs_update patterns onto existing REST API.
 */

import { useState, useEffect } from 'react';
import { Droplets, Plus, X, Search, MapPin, Gauge, Pencil, Trash2, Map as MapIcon, Navigation } from 'lucide-react';
import { hydrantsApi } from '@/api/hydrants/hydrants';
import { useAuth }     from '@/context/AuthContext/AuthContext';
import MapView from '@/components/common/MapView/MapView';
import { useMyStation } from '@/hooks/useMyStation/useMyStation';

const HYDRANT_STATUSES = ['Serviceable', 'Under Maintenance', 'Out of Service'];
const HYDRANT_TYPES    = ['Dry Barrel', 'Wet Barrel', 'Stand Pipes'];

const STATUS_COLORS = {
  'Serviceable':       'text-green-400 border-green-600/30 bg-green-600/10',
  'Under Maintenance': 'text-yellow-400 border-yellow-600/30 bg-yellow-600/10',
  'Out of Service':    'text-red-400 border-red-600/30 bg-red-600/10',
  'Operational':       'text-green-400 border-green-600/30 bg-green-600/10',
  'Damaged':           'text-red-400 border-red-600/30 bg-red-600/10',
  'Non-Operational':   'text-gray-400 border-gray-600/30 bg-gray-600/10',
};

const EMPTY_FORM = {
  address_text: '',
  status: 'Serviceable',
  hydrant_type: 'Dry Barrel',
  psi: '',
  last_inspection_date: '',
  lat: '',
  lng: '',
};

export default function Hydrants() {
  const [hydrants,     setHydrants]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchLat,    setSearchLat]    = useState('');
  const [searchLng,    setSearchLng]    = useState('');
  const [radius,       setRadius]       = useState(500);
  const [nearby,       setNearby]       = useState(null);
  const [confirm,      setConfirm]      = useState(null);
  const [showMap,      setShowMap]      = useState(true);

  const { role } = useAuth();
  const canEdit = role === 'superadmin' || role === 'admin' || role === 'user';
  const isAdmin = role === 'superadmin' || role === 'admin';
  const myStation = useMyStation();

  const load = async () => {
    const data = await hydrantsApi.list();
    setHydrants(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      lat: form.lat ? parseFloat(form.lat) : undefined,
      lng: form.lng ? parseFloat(form.lng) : undefined,
      psi: form.psi ? parseInt(form.psi, 10) : undefined,
    };
    if (editTarget) {
      await hydrantsApi.update(editTarget.id, payload);
    } else {
      await hydrantsApi.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    load();
  };

  const openEdit = (h) => {
    setEditTarget(h);
    setForm({
      address_text: h.address || h.address_text || '',
      status: h.status || 'Serviceable',
      hydrant_type: h.hydrant_type || 'Dry Barrel',
      psi: h.psi ?? '',
      last_inspection_date: h.last_inspection_date ?? '',
      lat: h.lat ?? '',
      lng: h.lng ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = (h) => {
    setConfirm({
      title: 'Delete Hydrant',
      message: `Delete hydrant at "${h.address || h.address_text || 'Unknown'}"?`,
      onYes: async () => {
        await hydrantsApi.delete(h.id);
        load();
        setConfirm(null);
      },
    });
  };

  const updateStatus = async (id, status) => {
    await hydrantsApi.update(id, { status });
    load();
  };

  const handleNearbySearch = async () => {
    const data = await hydrantsApi.nearby(parseFloat(searchLat), parseFloat(searchLng), radius);
    setNearby(data ?? []);
  };

  const allData     = nearby ?? hydrants;
  const displayList = filterStatus === 'All' ? allData : allData.filter(h => h.status === filterStatus);

  const operational = hydrants.filter(h => h.status === 'Serviceable' || h.status === 'Operational').length;
  const issues      = hydrants.length - operational;

  return (
    <div className="space-y-6">
      {/* Stats + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl px-5 py-3 text-center">
            <div className="text-2xl font-bold text-white">{hydrants.length}</div>
            <div className="text-xs text-red-400 uppercase tracking-widest">Total</div>
          </div>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl px-5 py-3 text-center">
            <div className="text-2xl font-bold text-white">{operational}</div>
            <div className="text-xs text-green-400 uppercase tracking-widest">Serviceable</div>
          </div>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl px-5 py-3 text-center">
            <div className="text-2xl font-bold text-white">{issues}</div>
            <div className="text-xs text-yellow-400 uppercase tracking-widest">Issues</div>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditTarget(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add Hydrant
          </button>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...HYDRANT_STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filterStatus === s
                ? "bg-red-600/20 border-red-600/50 text-red-400"
                : "bg-[#111] border-[#1f1f1f] text-gray-500 hover:border-gray-500 hover:text-gray-300"
            }`}>{s}</button>
        ))}
      </div>

      {/* Nearby Search */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="text-white font-medium mb-3 text-sm flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" /> Find Nearby Hydrants (PostGIS)
        </h3>
        <div className="flex gap-3 flex-wrap">
          <input value={searchLat} onChange={e => setSearchLat(e.target.value)}
            placeholder="Latitude" type="number" step="any"
            className="flex-1 min-w-32 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
          <input value={searchLng} onChange={e => setSearchLng(e.target.value)}
            placeholder="Longitude" type="number" step="any"
            className="flex-1 min-w-32 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
          <input value={radius} onChange={e => setRadius(Number(e.target.value))}
            placeholder="Radius (m)" type="number"
            className="w-32 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
          <button onClick={handleNearbySearch} disabled={!searchLat || !searchLng}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all">
            Search
          </button>
          {nearby !== null && (
            <button onClick={() => setNearby(null)}
              className="px-3 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">Clear</button>
          )}
        </div>
        {nearby !== null && (
          <div className="mt-2 text-gray-500 text-xs">
            Found {nearby.length} hydrant{nearby.length !== 1 ? 's' : ''} within {radius}m
          </div>
        )}
      </div>

      {/* Map Toggle + Map View */}
      <div className="space-y-3">
        <button
          onClick={() => setShowMap(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            showMap
              ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
              : 'bg-[#111] border-[#1f1f1f] text-gray-500 hover:border-gray-500 hover:text-gray-300'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>

        {showMap && (() => {
          const mapMarkers = displayList
            .filter(h => h.lat != null && h.lng != null)
            .map(h => ({
              type: 'hydrant',
              lat: h.lat,
              lng: h.lng,
              label: h.address || h.address_text || 'Hydrant',
              sub: `${h.hydrant_type || 'Hydrant'} • ${h.status}${h.psi ? ` • ${h.psi} PSI` : ''}`,
              status: h.status,
              distance: h.distance_meters,
            }));

          // Add station marker
          if (myStation?.lat != null && myStation?.lng != null) {
            mapMarkers.push({
              type: 'station',
              lat: myStation.lat,
              lng: myStation.lng,
              label: myStation.station_name || 'Your Station',
              sub: myStation.address_text || myStation.city || '',
            });
          }

          return mapMarkers.length > 0 ? (
            <MapView markers={mapMarkers} height="380px" />
          ) : (
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl h-48 flex items-center justify-center">
              <div className="text-center text-gray-600 text-sm">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No hydrants with coordinates to display
              </div>
            </div>
          );
        })()}
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading hydrants...</div>
      ) : !displayList.length ? (
        <div className="text-center text-gray-600 py-16">
          <Droplets className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hydrants found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayList.map(h => (
            <div key={h.id} className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 hover:border-blue-600/30 transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-900/30 border border-blue-900/40 rounded-lg flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white font-medium text-sm">{h.hydrant_type || '—'}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[h.status] ?? STATUS_COLORS['Serviceable']}`}>
                  {h.status}
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <span>{h.address || h.address_text || 'No address'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {h.psi != null && (
                  <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-2">
                    <div className="text-gray-600">Pressure</div>
                    <div className="text-blue-400 font-medium">{h.psi} PSI</div>
                  </div>
                )}
                {h.last_inspection_date && (
                  <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-2">
                    <div className="text-gray-600">Last Inspection</div>
                    <div className="text-gray-300 font-medium">{h.last_inspection_date}</div>
                  </div>
                )}
                {h.lat != null && h.lng != null && (
                  <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-2 col-span-2">
                    <div className="text-gray-600">Coordinates</div>
                    <div className="text-gray-300 font-mono text-xs">{h.lat}, {h.lng}</div>
                  </div>
                )}
              </div>

              {h.distance_meters != null && (
                <div className="text-blue-400 text-xs">{Math.round(h.distance_meters)}m away</div>
              )}

              {/* Navigate buttons */}
              {h.lat != null && h.lng != null && (
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    const origin = myStation?.lat != null && myStation?.lng != null
                      ? `${myStation.lat},${myStation.lng}` : '';
                    const dest = `${h.lat},${h.lng}`;
                    const googleUrl = origin
                      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`
                      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
                    const wazeUrl = `https://waze.com/ul?ll=${dest}&navigate=yes`;
                    return (
                      <>
                        <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 transition-all">
                          <Navigation className="w-3 h-3" /> Google Maps
                        </a>
                        <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-600/30 text-purple-400 hover:bg-purple-600/30 transition-all">
                          <Navigation className="w-3 h-3" /> Waze
                        </a>
                      </>
                    );
                  })()}
                </div>
              )}

              {canEdit && (
                <div className="space-y-2">
                  <select value={h.status} onChange={e => updateStatus(h.id, e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-red-600/50">
                    {HYDRANT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(h)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-blue-600/50 hover:text-blue-400 transition-all">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(h)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-red-600/50 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                {editTarget ? 'Edit Hydrant' : 'Add Hydrant'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditTarget(null); setForm(EMPTY_FORM); }} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Location Address *</label>
                <input value={form.address_text} onChange={e => setForm({ ...form, address_text: e.target.value })}
                  placeholder="e.g. Rizal St., Barangay 1, City"
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-red-600/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Type</label>
                  <select value={form.hydrant_type} onChange={e => setForm({ ...form, hydrant_type: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-600/50">
                    {HYDRANT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-600/50">
                    {HYDRANT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Water Pressure (PSI)</label>
                  <input type="number" min={0} value={form.psi} onChange={e => setForm({ ...form, psi: e.target.value })}
                    placeholder="e.g. 60"
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-red-600/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Last Inspection</label>
                  <input type="date" value={form.last_inspection_date} onChange={e => setForm({ ...form, last_inspection_date: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-600/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Latitude</label>
                  <input type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })}
                    placeholder="e.g. 14.5995"
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-red-600/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Longitude</label>
                  <input type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })}
                    placeholder="e.g. 120.9842"
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-red-600/50" />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving || !form.address_text}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-all">
                {saving ? 'Saving...' : editTarget ? 'Update Hydrant' : 'Save Hydrant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-white font-semibold text-center">{confirm.title}</h3>
            <p className="text-gray-400 text-sm text-center">{confirm.message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirm(null)}
                className="px-6 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm font-medium transition-all">No</button>
              <button onClick={confirm.onYes}
                className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
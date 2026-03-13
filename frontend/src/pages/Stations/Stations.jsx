/**
 * pages/Stations/Stations.jsx
 * Fire station management — superadmin only.
 * Full CRUD: list, create, edit, delete.
 */

import { useState, useEffect } from 'react';
import { Building2, Plus, X, Edit2, Trash2, MapPin, Phone, RefreshCw, Navigation, ArrowLeft, Globe } from 'lucide-react';
import { stationsApi } from '@/api/stations/stations';
import { useAuth } from '@/context/AuthContext/AuthContext';
import { Navigate } from 'react-router-dom';
import MapView from '@/components/common/MapView/MapView';

const EMPTY_FORM = {
  station_name: '',
  city: '',
  district: '',
  region: '',
  address_text: '',
  contact_number: '',
  team_leader_contact: '',
  lat: '',
  lng: '',
};

const Field = ({ label, field, form, setForm, placeholder, required }) => (
  <div>
    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">
      {label}{required && ' *'}
    </label>
    <input
      value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      placeholder={placeholder}
      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none"
    />
  </div>
);

export default function Stations() {
  const { role } = useAuth();
  const isSuperAdmin = role?.toLowerCase() === 'superadmin';

  const [stations,        setStations]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showForm,        setShowForm]        = useState(false);
  const [editItem,        setEditItem]        = useState(null); // station being edited
  const [deleteItem,      setDeleteItem]      = useState(null);
  const [form,            setForm]            = useState(EMPTY_FORM);
  const [saving,          setSaving]          = useState(false);
  const [formError,       setFormError]       = useState('');
  const [selectedStation, setSelectedStation] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await stationsApi.list();
      setStations(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditItem(s);
    setForm({
      station_name:         s.station_name         ?? '',
      city:                 s.city                 ?? '',
      district:             s.district             ?? '',
      region:               s.region               ?? '',
      address_text:         s.address_text         ?? '',
      contact_number:       s.contact_number       ?? '',
      team_leader_contact:  s.team_leader_contact  ?? '',
      lat:                  s.lat                  ?? '',
      lng:                  s.lng                  ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.station_name || !form.city || !form.district || !form.region) {
      setFormError('Station Name, City, District, and Region are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      ['contact_number', 'team_leader_contact', 'address_text'].forEach(k => {
        if (!payload[k]) payload[k] = null;
      });
      payload.lat = payload.lat !== '' ? parseFloat(payload.lat) : null;
      payload.lng = payload.lng !== '' ? parseFloat(payload.lng) : null;
      if (editItem) {
        await stationsApi.update(editItem.id, payload);
      } else {
        await stationsApi.create(payload);
      }
      setShowForm(false);
      setEditItem(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(err.message ?? 'Failed to save station');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await stationsApi.delete(deleteItem.id);
      setDeleteItem(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: 'Station Name', field: 'station_name',        placeholder: 'BFP Station 1',          required: true },
    { label: 'City',         field: 'city',                placeholder: 'Quezon City',             required: true },
    { label: 'District',     field: 'district',            placeholder: 'District 1',              required: true },
    { label: 'Region',       field: 'region',              placeholder: 'NCR',                     required: true },
    { label: 'Address',      field: 'address_text',        placeholder: '123 Main St',             required: false },
    { label: 'Contact No.',  field: 'contact_number',      placeholder: '+63 2 1234 5678',         required: false },
    { label: 'Team Leader Contact', field: 'team_leader_contact', placeholder: '+63 9XX XXX XXXX', required: false },
    { label: 'Latitude',  field: 'lat',  placeholder: 'e.g. 14.5995',  required: false },
    { label: 'Longitude', field: 'lng',  placeholder: 'e.g. 120.9842', required: false },
  ];

  // Guard: superadmin only
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-400" /> Fire Stations
          </h2>
          <p className="text-gray-500 text-xs mt-1">{stations.length} station{stations.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add Station
          </button>
        </div>
      </div>

      {/* Station Detail View */}
      {selectedStation ? (() => {
        const s = selectedStation;
        const mapMarkers = [];
        if (s.lat != null && s.lng != null) {
          mapMarkers.push({
            type: 'station',
            lat: s.lat,
            lng: s.lng,
            label: s.station_name,
            sub: [s.address_text, s.city, s.district].filter(Boolean).join(', '),
          });
        }
        return (
          <div className="space-y-4">
            <button onClick={() => setSelectedStation(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Stations
            </button>

            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-orange-400" /> {s.station_name}
                  </h3>
                  {s.address_text && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" /> {s.address_text}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(s)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-600/40 text-gray-400 hover:bg-gray-600/20 transition-all">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setDeleteItem(s)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-600/40 text-red-400 hover:bg-red-600/10 transition-all">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'City',          value: s.city },
                  { label: 'District',       value: s.district },
                  { label: 'Region',         value: s.region },
                  { label: 'Contact No.',    value: s.contact_number, icon: Phone },
                  { label: 'Team Leader',    value: s.team_leader_contact },
                  { label: 'Coordinates',    value: s.lat != null && s.lng != null ? `${s.lat}, ${s.lng}` : null, icon: Globe },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3">
                    <div className="text-gray-600 text-xs uppercase tracking-wider">{r.label}</div>
                    <div className="text-white text-sm mt-1 flex items-center gap-1.5">
                      {r.icon && <r.icon className="w-3.5 h-3.5 text-gray-500" />}
                      {r.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigate buttons */}
              {s.lat != null && s.lng != null && (
                <div className="flex gap-3 flex-wrap">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=driving`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    <Navigation className="w-4 h-4" /> Navigate (Google Maps)
                  </a>
                  <a href={`https://waze.com/ul?ll=${s.lat},${s.lng}&navigate=yes`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    <Navigation className="w-4 h-4" /> Navigate (Waze)
                  </a>
                </div>
              )}
            </div>

            {/* Map */}
            {mapMarkers.length > 0 ? (
              <MapView markers={mapMarkers} height="380px" zoom={15} />
            ) : (
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl h-48 flex items-center justify-center">
                <div className="text-center text-gray-600 text-sm">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No coordinates set for this station
                </div>
              </div>
            )}
          </div>
        );
      })() : (
        <>
          {/* Table */}
          {loading ? (
            <div className="text-center text-gray-500 py-16">Loading stations...</div>
          ) : !stations.length ? (
            <div className="text-center text-gray-600 py-16">No stations yet. Create one to get started.</div>
          ) : (
            <div className="border border-[#1f1f1f] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f1f1f] bg-[#0a0a0a]">
                    {['Station Name', 'Location', 'Contact', 'Team Leader Contact', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stations.map(s => (
                    <tr key={s.id}
                      onClick={() => setSelectedStation(s)}
                      className="border-b border-[#1f1f1f] hover:bg-[#0a0a0a] cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm">{s.station_name}</div>
                        {s.address_text && (
                          <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                            <MapPin className="w-3 h-3" />{s.address_text}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {[s.city, s.district, s.region].filter(Boolean).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {s.contact_number ? (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.contact_number}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {s.team_leader_contact ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-600/40 text-gray-400 hover:bg-gray-600/20 transition-all">
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteItem(s); }}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-600/40 text-red-400 hover:bg-red-600/10 transition-all">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-400" />
                {editItem ? 'Edit Station' : 'Add Fire Station'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {fields.map(f => (
                <Field key={f.field} {...f} form={form} setForm={setForm} />
              ))}
              {formError && (
                <div className="text-red-400 text-xs bg-red-600/10 border border-red-600/20 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create Station'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold">Delete Station</h2>
              <button onClick={() => setDeleteItem(null)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-400 text-sm">
                Are you sure you want to delete <strong className="text-white">{deleteItem.station_name}</strong>?
              </p>
              <p className="text-gray-500 text-xs mt-2">
                This will unlink all users, personnel, equipment, and hydrants assigned to this station.
              </p>
            </div>
            <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
              <button onClick={() => setDeleteItem(null)}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

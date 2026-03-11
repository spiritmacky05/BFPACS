/**
 * pages/DutyPersonnel.jsx
 *
 * Duty personnel management — summary stats, table with rank colors,
 * duty status toggle, training skills, edit/delete, confirmation modal.
 * Migrated from bfpacs_update patterns onto existing REST API.
 */

import { useState, useEffect, useMemo } from 'react';
import { UserCheck, UserX, Plus, X, Search, Pencil, Trash2, Shield } from 'lucide-react';
import { personnelApi } from '@/api/personnel/personnel';
import { useAuth }      from '@/context/AuthContext/AuthContext';
import FilterSortPanel  from '@/pages/Dispatch/FilterSortPanel';

function uniq(items, fn) {
  return [...new Set(items.map(fn).filter(Boolean))].sort();
}

const rankColors = {
  FO1: "text-gray-400", FO2: "text-gray-300", FO3: "text-gray-200",
  SFO1: "text-yellow-400", SFO2: "text-yellow-300", SFO3: "text-orange-400", SFO4: "text-red-400",
  FINSP: "text-blue-400", FSINSP: "text-blue-300", FCINSP: "text-blue-200",
  FSUPT: "text-purple-400", FSSUPT: "text-purple-300", FCSUPT: "text-purple-200",
};

const DUTY_COLORS = {
  'On Duty':  'text-green-400 bg-green-600/10 border-green-600/30',
  'Off Duty': 'text-gray-400 bg-gray-600/10 border-gray-600/30',
  'On Leave': 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
};

const BFP_RANKS = [
  'FO1','FO2','FO3',
  'SFO1','SFO2','SFO3','SFO4',
  'FINSP','FSINSP','FCINSP',
  'FSUPT','FSSUPT','FCSUPT',
];

const BFP_SHIFTS = ['Shift A', 'Shift B', 'Station Commander'];

const TRAINING_SKILLS = [
  'HAZMAT','BRTC','CBRN','EMT',
  'ICS Level 1','ICS Level 2','ICS Level 3','ICS Level 4','ICS Level 5',
  'ICS CADRE','USAR','ICT','EORA',
];

const EMPTY_FORM = {
  full_name: '', rank: 'FO1', shift: 'Shift A',
  duty_status: 'On Duty', certification: '',
};

const parseCert = (cert) => cert ? cert.split(',').map(s => s.trim()).filter(Boolean) : [];
const joinCert = (arr) => arr.join(', ');

export default function DutyPersonnel() {
  const [personnel, setPersonnel] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [skills,    setSkills]    = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('All');
  const [search,    setSearch]    = useState('');
  const [confirm,   setConfirm]   = useState(null);
  const [stationFilters, setStationFilters] = useState({ station: '', city: '', district: '', region: '' });
  const [stationSort,    setStationSort]    = useState('');

  const { role } = useAuth();
  const isAdmin = role === 'superadmin' || role === 'admin';
  const canModify = role === 'superadmin' || role === 'admin' || role === 'user';

  const load = async () => {
    const data = await personnelApi.list();
    setPersonnel(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleSkill = (skill) => {
    setSkills(prev => {
      if (prev.includes(skill)) return prev.filter(s => s !== skill);
      if (prev.length >= 5) return prev;
      return [...prev, skill];
    });
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setSkills([]);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      full_name: p.full_name,
      rank: p.rank,
      shift: p.shift ?? 'Shift A',
      duty_status: p.duty_status,
      certification: p.certification ?? '',
    });
    setSkills(parseCert(p.certification));
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, certification: joinCert(skills) };
    if (editId) {
      await personnelApi.update(editId, payload);
    } else {
      await personnelApi.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setSkills([]);
    setEditId(null);
    load();
  };

  const handleDelete = (p) => {
    setConfirm({
      title: 'Delete Personnel',
      message: `Are you sure you want to delete ${p.full_name}?`,
      onYes: async () => {
        await personnelApi.delete(p.id);
        load();
        setConfirm(null);
      },
    });
  };

  const requestStatusChange = (id, name, newStatus) => {
    setConfirm({
      title: 'Change Duty Status',
      message: `Set ${name} to "${newStatus}"?`,
      onYes: async () => {
        await personnelApi.updateDutyStatus(id, newStatus);
        load();
        setConfirm(null);
      },
    });
  };

  const toggleDuty = (p) => {
    const next = p.duty_status === 'On Duty' ? 'Off Duty' : 'On Duty';
    requestStatusChange(p.id, p.full_name, next);
  };

  const onDuty  = personnel.filter(p => p.duty_status === 'On Duty').length;
  const offDuty = personnel.filter(p => p.duty_status !== 'On Duty').length;

  // Station filter options derived from loaded personnel
  const stationOptions  = useMemo(() => uniq(personnel, p => p.station?.station_name), [personnel]);
  const cityOptions     = useMemo(() => uniq(personnel, p => p.station?.city),         [personnel]);
  const districtOptions = useMemo(() => uniq(personnel, p => p.station?.district),     [personnel]);
  const regionOptions   = useMemo(() => uniq(personnel, p => p.station?.region),       [personnel]);

  const handleStationFilter = (field, value) => {
    if (field === 'all') {
      setStationFilters({ station: '', city: '', district: '', region: '' });
      setStationSort('');
    } else {
      setStationFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const filtered = personnel
    .filter(p => filter === 'All' || p.duty_status === filter)
    .filter(p =>
      !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.rank?.toLowerCase().includes(search.toLowerCase()) ||
      p.shift?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(p => {
      if (stationFilters.station  && p.station?.station_name !== stationFilters.station)  return false;
      if (stationFilters.city     && p.station?.city         !== stationFilters.city)     return false;
      if (stationFilters.district && p.station?.district     !== stationFilters.district) return false;
      if (stationFilters.region   && p.station?.region       !== stationFilters.region)   return false;
      return true;
    })
    .sort((a, b) => {
      if (!stationSort) return 0;
      const key = stationSort === 'station' ? 'station_name' : stationSort;
      return (a.station?.[key] ?? '').localeCompare(b.station?.[key] ?? '');
    });

  return (
    <div className="space-y-6">
      {/* Summary Cards + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl px-5 py-3 text-center">
            <div className="text-2xl font-bold text-white">{onDuty}</div>
            <div className="text-xs text-green-400 uppercase tracking-widest">On Duty</div>
          </div>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl px-5 py-3 text-center">
            <div className="text-2xl font-bold text-white">{offDuty}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Off Duty</div>
          </div>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl px-5 py-3 text-center">
            <div className="text-2xl font-bold text-white">{personnel.length}</div>
            <div className="text-xs text-red-400 uppercase tracking-widest">Total</div>
          </div>
        </div>
        {canModify && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add Personnel
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, rank, or shift..."
          className="w-full bg-[#111] border border-[#1f1f1f] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-600/50"
        />
      </div>

      {/* Station / Location Filter — admin/superadmin only */}
      {isAdmin && (
        <FilterSortPanel
          stationOptions={stationOptions}
          cityOptions={cityOptions}
          districtOptions={districtOptions}
          regionOptions={regionOptions}
          filters={stationFilters}
          onFilterChange={handleStationFilter}
          sortBy={stationSort}
          onSortChange={setStationSort}
        />
      )}

      {/* Duty-status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'On Duty', 'Off Duty', 'On Leave'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter === f
                ? "bg-red-600 border-red-600 text-white"
                : "border-[#1f1f1f] text-gray-400 hover:border-red-600/40 hover:text-white"
            }`}>{f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading personnel...</div>
      ) : !filtered.length ? (
        <div className="text-center text-gray-600 py-16">No personnel found</div>
      ) : (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                  {['Rank', 'Full Name', ...(role === 'superadmin' ? ['Station'] : []), 'Shift', 'Duty Status', 'Training / Skills', canModify ? 'Actions' : ''].filter(Boolean).map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-[#1a1a1a] hover:bg-white/5 transition-all">
                    <td className={`px-4 py-3 font-bold ${rankColors[p.rank] || "text-gray-400"}`}>{p.rank}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {p.full_name}
                      {p.is_station_commander && (
                        <span className="ml-2 text-xs text-yellow-400 border border-yellow-600/30 bg-yellow-600/10 px-1.5 py-0.5 rounded">Commander</span>
                      )}
                    </td>
                    {role === 'superadmin' && (
                      <td className="px-4 py-3 text-gray-400">{p.station?.station_name || <span className="text-gray-600">—</span>}</td>
                    )}
                    <td className="px-4 py-3 text-gray-400">{p.shift ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${DUTY_COLORS[p.duty_status] ?? DUTY_COLORS['Off Duty']}`}>
                        {p.duty_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.certification ? (
                        <div className="flex flex-wrap gap-1">
                          {parseCert(p.certification).map(s => (
                            <span key={s} className="text-xs bg-red-900/30 text-red-400 border border-red-900/40 px-2 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    {canModify && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleDuty(p)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-red-600/50 hover:text-red-400 transition-all"
                          >
                            {p.duty_status === 'On Duty' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {p.duty_status === 'On Duty' ? 'Off Duty' : 'On Duty'}
                          </button>
                          <button onClick={() => openEdit(p)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-blue-600/50 hover:text-blue-400 transition-all">
                            <Pencil className="w-3 h-3" />
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleDelete(p)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-red-600/50 hover:text-red-400 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" />
                {editId ? 'Edit Personnel' : 'Add Personnel'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setSkills([]); }} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Full Name *</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Juan dela Cruz"
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-red-600/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Rank</label>
                  <select value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-600/50">
                    {BFP_RANKS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Shift</label>
                  <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-600/50">
                    {BFP_SHIFTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Special Trainings</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAINING_SKILLS.map(skill => {
                    const active = skills.includes(skill);
                    return (
                      <div key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                          active
                            ? "bg-red-600/20 border-red-600/50 text-red-400"
                            : "bg-[#0d0d0d] border-[#2f2f2f] text-gray-500 hover:border-gray-500"
                        }`}>
                        <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${active ? 'bg-red-600 border-red-600' : 'border-gray-600'}`}>
                          {active && <span className="text-white text-[10px]">✓</span>}
                        </span>
                        {skill}
                      </div>
                    );
                  })}
                </div>
                <p className="text-gray-500 text-xs mt-1">{skills.length} selected (max 5)</p>
              </div>
              <button onClick={handleSave}
                disabled={saving || !form.full_name}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-all">
                {saving ? 'Saving...' : editId ? 'Update Personnel' : 'Save Personnel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ────────────────────────────────────────────── */}
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
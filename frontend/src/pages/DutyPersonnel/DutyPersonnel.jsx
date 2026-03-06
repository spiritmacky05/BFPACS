/**
 * pages/DutyPersonnel.jsx
 *
 * Duty personnel list with duty status management.
 */

import { useState, useEffect } from 'react';
import { UserCheck, Plus, X, RefreshCw } from 'lucide-react';
import { personnelApi } from '@/api/personnel/personnel';
import { useAuth }      from '@/context/AuthContext/AuthContext';
import PersonnelLink    from '@/components/PersonnelLink/PersonnelLink';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "space-y-6",
  
  header: {
    wrapper: "flex items-center justify-between",
    titleFlex: "flex items-center gap-2",
    icon: "w-5 h-5 text-red-400",
    title: "text-white font-semibold text-lg",
    subtitle: "text-gray-500 text-xs mt-1",
    actionsFlex: "flex gap-2",
    refreshBtn: "p-2 rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white transition-all",
    refreshIcon: "w-4 h-4",
    addBtn: "flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all",
    addIcon: "w-4 h-4"
  },
  
  filter: {
    wrapper: "flex gap-2",
    btnBase: "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
    btnActive: "bg-red-600 border-red-600 text-white",
    btnInactive: "border-[#1f1f1f] text-gray-400 hover:border-red-600/40 hover:text-white"
  },
  
  table: {
    loading: "text-center text-gray-500 py-16",
    empty: "text-center text-gray-600 py-16",
    wrapper: "border border-[#1f1f1f] rounded-xl overflow-hidden",
    table: "w-full",
    theadTr: "border-b border-[#1f1f1f] bg-[#0a0a0a]",
    th: "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase",
    tbodyTr: "border-b border-[#1f1f1f] hover:bg-[#0a0a0a]",
    tdTextBase: "px-4 py-3 text-sm font-medium",
    tdWhite: "text-white",
    tdGray: "text-gray-400",
    tdAction: "px-4 py-3",
    commanderBadge: "ml-2 text-xs text-yellow-400 border border-yellow-600/30 bg-yellow-600/10 px-1.5 py-0.5 rounded",
    statusBadgeBase: "text-xs px-2 py-0.5 rounded border",
    nfcTd: "px-4 py-3 text-xs text-gray-500 font-mono",
    select: "bg-[#0a0a0a] border border-[#2a2a2a] text-gray-400 rounded px-2 py-1 text-xs focus:border-red-600 outline-none"
  },
  
  modal: {
    overlay: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4",
    container: "bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto",
    header: "flex items-center justify-between p-6 border-b border-[#1f1f1f]",
    title: "text-white font-semibold",
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

const DUTY_COLORS = {
  'On Duty':  'text-green-400 bg-green-600/10 border-green-600/30',
  'Off Duty': 'text-gray-400 bg-gray-600/10 border-gray-600/30',
  'On Leave': 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
};

const BFP_RANKS = [
  'FO1','FO2','FO3','SFO1','SFO2','SFO3','SFO4',
  'SINSP','CINSP','SINSP','FSupt','SFSupt','CSupt','DCFSCO','CFSCO',
];

const BFP_CERTIFICATIONS = [
  'None',
  'Basic Fire Fighting (BFF)',
  'Structural Fire Fighting (SFF)',
  'Wildland Fire Fighting (WFF)',
  'Hazardous Materials (HazMat) Response',
  'Search and Rescue (SAR)',
  'Emergency Medical Technician – Basic (EMT-B)',
  'Technical Rescue Operations',
  'Fire Safety Inspector (FSI)',
  'Fire Investigation Technician',
];

const EMPTY_FORM = {
  full_name: '', rank: 'FO1', shift: 'Shift A',
  duty_status: 'On Duty', certification: 'None',
};

export default function DutyPersonnel() {
  const [personnel, setPersonnel] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('All');

  const { role } = useAuth();
  // All authenticated roles can add personnel and update duty status
  const canModify = role === 'superadmin' || role === 'admin' || role === 'user';

  const load = async () => {
    const data = await personnelApi.list();
    setPersonnel(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    await personnelApi.create({ ...form });
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleStatusChange = async (id, status) => {
    await personnelApi.updateDutyStatus(id, status);
    load();
  };

  const filtered = filter === 'All' ? personnel : personnel.filter(p => p.duty_status === filter);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header.wrapper}>
        <div>
          <h2 className={styles.header.titleFlex}>
            <UserCheck className={styles.header.icon} /> Duty Personnel
          </h2>
          <p className={styles.header.subtitle}>{personnel.length} registered</p>
        </div>
        <div className={styles.header.actionsFlex}>
          <button onClick={load} className={styles.header.refreshBtn}>
            <RefreshCw className={styles.header.refreshIcon} />
          </button>
          {canModify && (
            <button onClick={() => setShowForm(true)}
              className={styles.header.addBtn}>
              <Plus className={styles.header.addIcon} /> Add Personnel
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filter.wrapper}>
        {['All', 'On Duty', 'Off Duty', 'On Leave'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`${styles.filter.btnBase} ${
              filter === f ? styles.filter.btnActive : styles.filter.btnInactive
            }`}>{f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.table.loading}>Loading personnel...</div>
      ) : !filtered.length ? (
        <div className={styles.table.empty}>No personnel found</div>
      ) : (
        <div className={styles.table.wrapper}>
          <table className={styles.table.table}>
            <thead>
              <tr className={styles.table.theadTr}>
                {['Name', 'Rank', 'Shift', 'Status', 'Certification', canModify ? 'Actions' : ''].filter(Boolean).map(h => (
                  <th key={h} className={styles.table.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={styles.table.tbodyTr}>
                  <td className={`${styles.table.tdTextBase} ${styles.table.tdWhite}`}>
                    <PersonnelLink id={p.id} name={p.full_name} className="text-white font-medium" />
                    {p.is_station_commander && (
                      <span className={styles.table.commanderBadge}>
                        Commander
                      </span>
                    )}
                  </td>
                  <td className={`${styles.table.tdTextBase} ${styles.table.tdGray}`}>{p.rank}</td>
                  <td className={`${styles.table.tdTextBase} ${styles.table.tdGray}`}>{p.shift ?? '—'}</td>
                  <td className={styles.table.tdAction}>
                    <span className={`${styles.table.statusBadgeBase} ${DUTY_COLORS[p.duty_status] ?? DUTY_COLORS['Off Duty']}`}>
                      {p.duty_status}
                    </span>
                  </td>
                  <td className={`${styles.table.tdTextBase} text-blue-300/80`}>
                    {p.certification && p.certification !== 'None' ? p.certification : <span className="text-gray-600">—</span>}
                  </td>
                  {canModify && (
                    <td className={styles.table.tdAction}>
                      <select
                        value={p.duty_status}
                        onChange={e => handleStatusChange(p.id, e.target.value)}
                        className={styles.table.select}>
                        <option>On Duty</option>
                        <option>Off Duty</option>
                        <option>On Leave</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className={styles.modal.overlay}>
          <div className={styles.modal.container}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>Add Personnel</h2>
              <button onClick={() => setShowForm(false)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.body}>
              <div>
                <label className={styles.modal.label}>Full Name *</label>
                <input value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Juan Dela Cruz"
                  className={styles.modal.input} />
              </div>
              <div>
                <label className={styles.modal.label}>Rank *</label>
                <select value={form.rank}
                  onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}
                  className={styles.modal.input}>
                  {BFP_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.modal.label}>Shift</label>
                <select value={form.shift}
                  onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}
                  className={styles.modal.input}>
                  {['Shift A', 'Shift B'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.modal.label}>Certification / Training</label>
                <select value={form.certification}
                  onChange={e => setForm(f => ({ ...f, certification: e.target.value }))}
                  className={styles.modal.input}>
                  {BFP_CERTIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setShowForm(false)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.full_name}
                className={styles.modal.submitBtn}>
                {saving ? 'Adding...' : 'Add Personnel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
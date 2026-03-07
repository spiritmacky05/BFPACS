/**
 * pages/DutyPersonnel.jsx
 *
 * Duty personnel list with duty status management, edit, and training skills.
 */

import { useState, useEffect } from 'react';
import { UserCheck, Plus, X, RefreshCw, Pencil } from 'lucide-react';
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
    select: "bg-[#0a0a0a] border border-[#2a2a2a] text-gray-400 rounded px-2 py-1 text-xs focus:border-red-600 outline-none",
    editBtn: "p-1.5 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40 transition-all",
    editIcon: "w-3.5 h-3.5",
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
    submitBtn: "px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50",
    skillsGrid: "grid grid-cols-2 gap-2",
    skillItem: "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all",
    skillActive: "border-red-600/50 bg-red-600/10 text-white",
    skillInactive: "border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]",
    skillHint: "text-gray-500 text-xs mt-1",
  },

  confirm: {
    overlay: "fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4",
    box: "bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-sm p-6 space-y-4",
    title: "text-white font-semibold text-center",
    message: "text-gray-400 text-sm text-center",
    actions: "flex gap-3 justify-center",
    noBtn: "px-6 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm font-medium transition-all",
    yesBtn: "px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all",
  },
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

/** Parse comma-separated certification string into array */
const parseCert = (cert) => cert ? cert.split(',').map(s => s.trim()).filter(Boolean) : [];
/** Join skills array into comma-separated string */
const joinCert = (arr) => arr.join(', ');

export default function DutyPersonnel() {
  const [personnel, setPersonnel] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);     // null = create, uuid = edit
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [skills,    setSkills]    = useState([]);        // selected training skills
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('All');

  // Confirmation modal state
  const [confirm,   setConfirm]   = useState(null);
  // { title, message, onYes }

  const { role } = useAuth();
  const canModify = role === 'superadmin' || role === 'admin' || role === 'user';

  const load = async () => {
    const data = await personnelApi.list();
    setPersonnel(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Skill toggle ────────────────────────────────────────────────────────────
  const toggleSkill = (skill) => {
    setSkills(prev => {
      if (prev.includes(skill)) return prev.filter(s => s !== skill);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, skill];
    });
  };

  // ── Open create modal ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setSkills([]);
    setShowForm(true);
  };

  // ── Open edit modal ────────────────────────────────────────────────────────
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

  // ── Save (create or update) ────────────────────────────────────────────────
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

  // ── Status change with confirmation ────────────────────────────────────────
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

  const filtered = filter === 'All' ? personnel : personnel.filter(p => p.duty_status === filter);
  const skillsValid = skills.length >= 3 && skills.length <= 5;

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
            <button onClick={openCreate} className={styles.header.addBtn}>
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
                {['Name', 'Rank', ...(role === 'superadmin' ? ['Station'] : []), 'Shift', 'Status', 'Training / Skills', canModify ? 'Actions' : ''].filter(Boolean).map(h => (
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
                      <span className={styles.table.commanderBadge}>Commander</span>
                    )}
                  </td>
                  <td className={`${styles.table.tdTextBase} ${styles.table.tdGray}`}>{p.rank}</td>
                  {role === 'superadmin' && (
                    <td className={`${styles.table.tdTextBase} ${styles.table.tdGray}`}>
                      {p.station?.station_name || <span className="text-gray-600">—</span>}
                    </td>
                  )}
                  <td className={`${styles.table.tdTextBase} ${styles.table.tdGray}`}>{p.shift ?? '—'}</td>
                  <td className={styles.table.tdAction}>
                    <span className={`${styles.table.statusBadgeBase} ${DUTY_COLORS[p.duty_status] ?? DUTY_COLORS['Off Duty']}`}>
                      {p.duty_status}
                    </span>
                  </td>
                  <td className={`${styles.table.tdTextBase} text-blue-300/80`}>
                    {p.certification ? (
                      <div className="flex flex-wrap gap-1">
                        {parseCert(p.certification).map(s => (
                          <span key={s} className="text-xs bg-blue-600/10 border border-blue-600/20 text-blue-300 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  {canModify && (
                    <td className={styles.table.tdAction}>
                      <div className="flex items-center gap-2">
                        <select
                          value={p.duty_status}
                          onChange={e => requestStatusChange(p.id, p.full_name, e.target.value)}
                          className={styles.table.select}>
                          <option>On Duty</option>
                          <option>Off Duty</option>
                          <option>On Leave</option>
                        </select>
                        <button onClick={() => openEdit(p)} className={styles.table.editBtn} title="Edit">
                          <Pencil className={styles.table.editIcon} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      {showForm && (
        <div className={styles.modal.overlay}>
          <div className={styles.modal.container}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>{editId ? 'Edit Personnel' : 'Add Personnel'}</h2>
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
                  {BFP_SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.modal.label}>Training / Skills (select 3–5)</label>
                <div className={styles.modal.skillsGrid}>
                  {TRAINING_SKILLS.map(skill => {
                    const active = skills.includes(skill);
                    return (
                      <div key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`${styles.modal.skillItem} ${active ? styles.modal.skillActive : styles.modal.skillInactive}`}>
                        <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${active ? 'bg-red-600 border-red-600' : 'border-gray-600'}`}>
                          {active && <span className="text-white text-[10px]">✓</span>}
                        </span>
                        {skill}
                      </div>
                    );
                  })}
                </div>
                <p className={styles.modal.skillHint}>
                  {skills.length}/5 selected {skills.length < 3 ? '(minimum 3)' : ''}
                </p>
              </div>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setShowForm(false)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleSave}
                disabled={saving || !form.full_name || !skillsValid}
                className={styles.modal.submitBtn}>
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Personnel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ────────────────────────────────────────────── */}
      {confirm && (
        <div className={styles.confirm.overlay}>
          <div className={styles.confirm.box}>
            <h3 className={styles.confirm.title}>{confirm.title}</h3>
            <p className={styles.confirm.message}>{confirm.message}</p>
            <div className={styles.confirm.actions}>
              <button onClick={() => setConfirm(null)} className={styles.confirm.noBtn}>No</button>
              <button onClick={confirm.onYes} className={styles.confirm.yesBtn}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * pages/Equipment.jsx
 * Logistical equipment tracker with borrow/return workflow.
 */

import { useState, useEffect } from 'react';
import { Package, Plus, X, ArrowLeft, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import { equipmentApi } from '@/api/equipment';
import { personnelApi } from '@/api/personnel';
import { useAuth }      from '@/context/AuthContext';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  pageContainer: "space-y-6",
  
  header: {
    wrapper: "flex items-center justify-between",
    title: "text-white font-semibold text-lg flex items-center gap-2",
    icon: "w-5 h-5 text-red-400",
    addBtn: "flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all",
    addBtnIcon: "w-4 h-4"
  },
  
  table: {
    loading: "text-center text-gray-500 py-16",
    empty: "text-center text-gray-600 py-16",
    wrapper: "border border-[#1f1f1f] rounded-xl overflow-hidden",
    table: "w-full",
    theadTr: "border-b border-[#1f1f1f] bg-[#0a0a0a]",
    th: "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase",
    tbodyTr: "border-b border-[#1f1f1f] hover:bg-[#0a0a0a]",
    tdText: "px-4 py-3 text-sm text-gray-400",
    tdName: "px-4 py-3 text-sm text-white font-medium",
    tdBadge: "px-4 py-3",
    badgeBase: "text-xs px-2 py-0.5 rounded border",
    badgeBorrowed: "text-yellow-400 border-yellow-600/30 bg-yellow-600/10",
    badgeAvailable: "text-green-400 border-green-600/30 bg-green-600/10",
    tdAction: "px-4 py-3",
    actionFlex: "flex gap-2",
    actionBtnBorrowed: "flex items-center gap-1 text-xs px-2 py-1 rounded border border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/10 transition-all",
    actionBtnAvailable: "flex items-center gap-1 text-xs px-2 py-1 rounded border border-green-600/40 text-green-400 hover:bg-green-600/10 transition-all",
    actionIcon: "w-3 h-3"
  },
  
  modal: {
    overlay: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4",
    containerBase: "bg-[#111] border border-[#1f1f1f] rounded-xl w-full",
    containerSm: "max-w-sm",
    containerMd: "max-w-md",
    header: "flex items-center justify-between p-6 border-b border-[#1f1f1f]",
    title: "text-white font-semibold",
    closeBtn: "text-gray-500 hover:text-white",
    closeIcon: "w-5 h-5",
    body: "p-6",
    bodySpaced: "p-6 space-y-4",
    label: "block text-gray-400 text-xs uppercase tracking-wider mb-2",
    labelSpaced: "block text-gray-400 text-xs uppercase tracking-wider mb-1",
    input: "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none",
    footer: "p-6 border-t border-[#1f1f1f] flex gap-3 justify-end",
    cancelBtn: "px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm",
    submitBtnRed: "px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50",
    submitBtnYellow: "px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium disabled:opacity-50"
  }
};

const EMPTY_FORM = { equipment_name: '', quantity: 1, condition: 'Good' };

export default function Equipment() {
  const [items,    setItems]    = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [borrowItem, setBorrowItem] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const { role } = useAuth();
  // All authenticated roles can add/edit/borrow equipment
  const isAdmin = role === 'superadmin' || role === 'admin' || role === 'user';

  const load = async () => {
    try {
      const [equipData, personnelData] = await Promise.all([
        equipmentApi.list(),
        personnelApi.list()
      ]);
      setItems(equipData ?? []);
      setPersonnel(personnelData ?? []);
    } catch (err) {
      console.error('Error loading equipment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    await equipmentApi.create(form);
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleBorrow = async () => {
    if (!borrowerName || !borrowItem) return;
    await equipmentApi.borrow(borrowItem.id, { borrower_name: borrowerName });
    setBorrowItem(null);
    setBorrowerName('');
    load();
  };

  const handleReturn = async (id) => {
    await equipmentApi.return(id);
    load();
  };

  const handleUpdate = async () => {
    setSaving(true);
    const payload = { ...editItem };
    if (!payload.borrower_name) payload.borrower_name = null;
    try {
      await equipmentApi.update(editItem.id, payload);
    } catch(err) {
      console.error(err);
    }
    setSaving(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async () => {
    setSaving(true);
    await equipmentApi.delete(deleteItem.id);
    setSaving(false);
    setDeleteItem(null);
    load();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header.wrapper}>
        <h2 className={styles.header.title}>
          <Package className={styles.header.icon} /> Equipment
        </h2>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className={styles.header.addBtn}>
            <Plus className={styles.header.addBtnIcon} /> Add Equipment
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.table.loading}>Loading equipment...</div>
      ) : !items.length ? (
        <div className={styles.table.empty}>No equipment registered</div>
      ) : (
        <div className={styles.table.wrapper}>
          <table className={styles.table.table}>
            <thead>
              <tr className={styles.table.theadTr}>
                {['Item', 'Quantity', 'Status', 'Borrower', isAdmin ? 'Actions' : ''].filter(Boolean).map(h => (
                  <th key={h} className={styles.table.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className={styles.table.tbodyTr}>
                  <td className={styles.table.tdName}>{item.equipment_name || item.item_name}</td>
                  <td className={styles.table.tdText}>{item.quantity}</td>
                  <td className={styles.table.tdBadge}>
                    <span className={`${styles.table.badgeBase} ${
                      item.borrower_name
                        ? styles.table.badgeBorrowed
                        : styles.table.badgeAvailable
                    }`}>
                      {item.borrower_name ? 'Borrowed' : 'Available'}
                    </span>
                  </td>
                  <td className={styles.table.tdText}>{item.borrower_name ?? '—'}</td>
                  {isAdmin && (
                    <td className={styles.table.tdAction}>
                      <div className={styles.table.actionFlex}>
                        {!item.borrower_name ? (
                          <button onClick={() => setBorrowItem(item)}
                            className={styles.table.actionBtnBorrowed}>
                            <ArrowRight className={styles.table.actionIcon} /> Borrow
                          </button>
                        ) : (
                          <button onClick={() => handleReturn(item.id)}
                            className={styles.table.actionBtnAvailable}>
                            <ArrowLeft className={styles.table.actionIcon} /> Return
                          </button>
                        )}
                        <button onClick={() => setEditItem({ ...item })}
                          className="flex items-center justify-center px-2 py-1 border border-gray-600/40 text-gray-400 rounded hover:bg-gray-600/20 transition-all ml-1" title="Edit">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteItem(item)}
                          className="flex items-center justify-center px-2 py-1 border border-red-600/40 text-red-400 rounded hover:bg-red-600/10 transition-all" title="Delete">
                          <Trash2 className="w-3 h-3" />
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

      {/* Borrow Modal */}
      {borrowItem && (
        <div className={styles.modal.overlay}>
          <div className={`${styles.modal.containerBase} ${styles.modal.containerSm}`}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>Borrow: {borrowItem.equipment_name || borrowItem.item_name}</h2>
              <button onClick={() => setBorrowItem(null)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.body}>
              <label className={styles.modal.label}>Borrower Name *</label>
              <select 
                value={borrowerName} 
                onChange={e => setBorrowerName(e.target.value)}
                className={styles.modal.input}
              >
                <option value="">— Select Personnel —</option>
                {personnel.map(p => (
                  <option key={p.id} value={p.full_name}>
                    {p.full_name} ({p.rank || p.personnel_type || 'BFP'})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setBorrowItem(null)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleBorrow} disabled={!borrowerName}
                className={styles.modal.submitBtnYellow}>
                Confirm Borrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showForm && (
        <div className={styles.modal.overlay}>
          <div className={`${styles.modal.containerBase} ${styles.modal.containerMd}`}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>Add Equipment</h2>
              <button onClick={() => setShowForm(false)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.bodySpaced}>
              <div>
                <label className={styles.modal.labelSpaced}>Item Name *</label>
                <input value={form.equipment_name} onChange={e => setForm(f => ({ ...f, equipment_name: e.target.value }))}
                  placeholder="Fire Extinguisher"
                  className={styles.modal.input} />
              </div>
              <div>
                <label className={styles.modal.labelSpaced}>Quantity</label>
                <input type="number" min="1" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) }))}
                  className={styles.modal.input} />
              </div>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setShowForm(false)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.equipment_name}
                className={styles.modal.submitBtnRed}>
                {saving ? 'Adding...' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editItem && (
        <div className={styles.modal.overlay}>
          <div className={`${styles.modal.containerBase} ${styles.modal.containerMd}`}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>Edit Equipment</h2>
              <button onClick={() => setEditItem(null)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.bodySpaced}>
              <div>
                <label className={styles.modal.labelSpaced}>Item Name *</label>
                <input value={editItem.equipment_name || editItem.item_name} onChange={e => setEditItem(f => ({ ...f, equipment_name: e.target.value }))}
                  className={styles.modal.input} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={styles.modal.labelSpaced}>Quantity</label>
                  <input type="number" min="1" value={editItem.quantity}
                    onChange={e => setEditItem(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                    className={styles.modal.input} />
                </div>
                <div className="flex-1">
                  <label className={styles.modal.labelSpaced}>Status</label>
                  <select value={editItem.status} onChange={e => setEditItem(f => ({ ...f, status: e.target.value }))}
                    className={styles.modal.input}>
                    <option value="Serviceable">Serviceable</option>
                    <option value="Borrowed">Borrowed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={styles.modal.labelSpaced}>Borrower Name (Optional)</label>
                <select 
                  value={editItem.borrower_name || ''} 
                  onChange={e => setEditItem(f => ({ ...f, borrower_name: e.target.value }))}
                  className={styles.modal.input}
                >
                  <option value="">— None —</option>
                  {personnel.map(p => (
                    <option key={p.id} value={p.full_name}>
                      {p.full_name} ({p.rank || p.personnel_type || 'BFP'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setEditItem(null)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleUpdate} disabled={saving || (!editItem.equipment_name && !editItem.item_name)}
                className={styles.modal.submitBtnRed}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className={styles.modal.overlay}>
          <div className={`${styles.modal.containerBase} ${styles.modal.containerSm}`}>
            <div className={styles.modal.header}>
              <h2 className={styles.modal.title}>Delete Equipment</h2>
              <button onClick={() => setDeleteItem(null)} className={styles.modal.closeBtn}>
                <X className={styles.modal.closeIcon} />
              </button>
            </div>
            <div className={styles.modal.body}>
              <p className="text-gray-400 text-sm">Are you sure you want to delete <strong className="text-white">{deleteItem.equipment_name || deleteItem.item_name}</strong>?</p>
              <p className="text-gray-500 text-xs mt-2">This action cannot be undone.</p>
            </div>
            <div className={styles.modal.footer}>
              <button onClick={() => setDeleteItem(null)}
                className={styles.modal.cancelBtn}>Cancel</button>
              <button onClick={handleDelete} disabled={saving}
                className={styles.modal.submitBtnRed}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
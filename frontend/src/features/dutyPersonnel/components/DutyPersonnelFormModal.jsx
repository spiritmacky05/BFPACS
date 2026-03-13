import {
  BFP_RANK_OPTIONS,
  BFP_SHIFT_OPTIONS,
  DUTY_STATUS_FILTER_OPTIONS,
  TRAINING_SKILL_OPTIONS,
} from '../lib/dutyPersonnel.constants';

const styles = {
  overlay: 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4',
  modal: 'bg-[#151515] border border-[#2f2f2f] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto',
  header: 'sticky top-0 bg-[#151515] border-b border-[#2f2f2f] px-6 py-4 flex justify-between items-center',
  title: 'text-xl font-bold text-white',
  closeButton: 'text-gray-500 hover:text-white text-2xl transition-colors',
  body: 'p-6 space-y-6',
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  fieldBlock: 'space-y-2',
  label: 'text-sm text-gray-400 uppercase tracking-wide',
  input:
    'w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none transition-all',
  select:
    'w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2.5 text-white focus:border-red-600 focus:outline-none transition-all',
  skillWrap: 'flex flex-wrap gap-2',
  skillButton:
    'px-3 py-1.5 rounded-lg border text-sm transition-all border-[#2f2f2f] text-gray-400 hover:border-red-600/50',
  skillButtonActive: 'bg-red-900/30 border-red-600/50 text-red-400',
  skillNote: 'text-xs text-gray-500',
  footer: 'sticky bottom-0 bg-[#151515] border-t border-[#2f2f2f] px-6 py-4 flex justify-end gap-3',
  cancelButton:
    'px-4 py-2 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-gray-500 transition-all',
  submitButton: 'px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors',
};

export default function DutyPersonnelFormModal({
  isEditing,
  isSaving,
  form,
  selectedSkills,
  stations,
  isAdmin,
  onClose,
  onChange,
  onToggleSkill,
  onSubmit,
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? 'Edit Personnel' : 'Add Personnel'}</h2>
          <button type='button' className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.grid}>
            <div className={styles.fieldBlock}>
              <label className={styles.label}>Full Name *</label>
              <input
                name='full_name'
                value={form.full_name}
                onChange={onChange}
                className={styles.input}
                placeholder='Juan Dela Cruz'
              />
            </div>

            <div className={styles.fieldBlock}>
              <label className={styles.label}>Badge Number</label>
              <input
                name='badge_number'
                value={form.badge_number}
                onChange={onChange}
                className={styles.input}
                placeholder='BFP-001'
              />
            </div>

            <div className={styles.fieldBlock}>
              <label className={styles.label}>Rank</label>
              <select name='rank' value={form.rank} onChange={onChange} className={styles.select}>
                {BFP_RANK_OPTIONS.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldBlock}>
              <label className={styles.label}>Shift</label>
              <select name='shift' value={form.shift} onChange={onChange} className={styles.select}>
                {BFP_SHIFT_OPTIONS.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldBlock}>
              <label className={styles.label}>Duty Status</label>
              <select
                name='duty_status'
                value={form.duty_status}
                onChange={onChange}
                className={styles.select}
              >
                {DUTY_STATUS_FILTER_OPTIONS.filter((status) => status !== 'All').map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin ? (
              <div className={styles.fieldBlock}>
                <label className={styles.label}>Station</label>
                <select
                  name='station_id'
                  value={form.station_id}
                  onChange={onChange}
                  className={styles.select}
                >
                  <option value=''>Select station</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.station_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.label}>Training / Skills</label>
            <div className={styles.skillWrap}>
              {TRAINING_SKILL_OPTIONS.map((skill) => {
                const isActive = selectedSkills.includes(skill);

                return (
                  <button
                    type='button'
                    key={skill}
                    onClick={() => onToggleSkill(skill)}
                    className={`${styles.skillButton} ${isActive ? styles.skillButtonActive : ''}`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
            <p className={styles.skillNote}>{selectedSkills.length} selected (max 5)</p>
          </div>
        </div>

        <div className={styles.footer}>
          <button type='button' className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button type='button' className={styles.submitButton} onClick={onSubmit}>
            {isSaving ? 'Saving...' : isEditing ? 'Update Personnel' : 'Create Personnel'}
          </button>
        </div>
      </div>
    </div>
  );
}

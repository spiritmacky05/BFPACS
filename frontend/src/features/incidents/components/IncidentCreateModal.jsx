/**
 * features/incidents/components/IncidentCreateModal.jsx
 *
 * Modal used to create a new incident.
 *
 * Why this component exists:
 * - Form markup is large and should not live inside page container.
 * - Keeps create behavior testable and reusable.
 */

import { AlertTriangle, X } from 'lucide-react';

const OCCUPANCY_TYPES = [
  'Residential Board and Care',
  'Mixed Occupancy',
  'Mercantile',
  'Industrial',
  'Healthcare',
  'Educational',
  'Detention and Correctional',
  'Day Care',
  'Business',
  'Assembly',
  'Single and Two Family Dwelling',
  'Lodging and Rooming Houses',
  'Hotel',
  'Dormitory',
  'Condominium',
  'Apartment Building',
  'Commercial',
  'Residential',
];

const ALARM_OPTIONS = ['1st Alarm', '2nd Alarm', '3rd Alarm', '4th Alarm', '5th Alarm', 'General Alarm'];

const styles = {
  overlay: 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4',
  panel: 'bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto',
  panelHeader: 'flex items-center justify-between p-6 border-b border-[#1f1f1f]',
  panelTitle: 'text-white font-semibold flex items-center gap-2',
  closeButton: 'text-gray-500 hover:text-white',
  body: 'p-6 space-y-4',
  footer: 'p-6 border-t border-[#1f1f1f] flex gap-3 justify-end',
  label: 'block text-gray-400 text-xs uppercase tracking-wider mb-1',
  input: 'w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none',
  cancelButton: 'px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm',
  submitButton: 'px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50',
  coordinatesGrid: 'grid grid-cols-2 gap-3',
};

export default function IncidentCreateModal({
  isOpen,
  form,
  isSaving,
  onClose,
  onChangeField,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <header className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Report Incident
          </h2>

          <button type="button" onClick={onClose} className={styles.closeButton}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className={styles.body}>
          <div>
            <label className={styles.label}>Location Address *</label>
            <input
              value={form.location_text}
              onChange={(event) => onChangeField('location_text', event.target.value)}
              placeholder="Type exact location address..."
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>Alarm Status</label>
            <select
              value={form.alarm_status}
              onChange={(event) => onChangeField('alarm_status', event.target.value)}
              className={styles.input}
            >
              {ALARM_OPTIONS.map((alarmOption) => (
                <option key={alarmOption} value={alarmOption}>
                  {alarmOption}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={styles.label}>Date & Time Reported</label>
            <input
              type="datetime-local"
              value={form.date_time_reported}
              onChange={(event) => onChangeField('date_time_reported', event.target.value)}
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>Type of Occupancy (optional)</label>
            <select
              value={form.occupancy_type}
              onChange={(event) => onChangeField('occupancy_type', event.target.value)}
              className={styles.input}
            >
              <option value="">— Select Occupancy Type —</option>
              {OCCUPANCY_TYPES.map((occupancyType) => (
                <option key={occupancyType} value={occupancyType}>
                  {occupancyType}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.coordinatesGrid}>
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(event) => onChangeField('lat', event.target.value)}
              placeholder="Latitude (14.5995)"
              className={styles.input}
            />

            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(event) => onChangeField('lng', event.target.value)}
              placeholder="Longitude (120.9842)"
              className={styles.input}
            />
          </div>
        </div>

        <footer className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || !form.location_text}
            className={styles.submitButton}
          >
            {isSaving ? 'Reporting...' : 'Report Incident'}
          </button>
        </footer>
      </div>
    </div>
  );
}

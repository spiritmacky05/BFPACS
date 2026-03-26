/**
 * features/dispatch/components/DispatchCreateModal.jsx
 *
 * Modal form for creating dispatch orders.
 */

import { ClipboardList, X } from 'lucide-react';

const styles = {
  overlay: 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4',
  container: 'bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md',
  header: 'flex items-center justify-between p-6 border-b border-[#1f1f1f]',
  title: 'text-white font-semibold flex items-center gap-2',
  titleIcon: 'w-4 h-4 text-red-400',
  closeButton: 'text-gray-500 hover:text-white',
  closeIcon: 'w-5 h-5',
  body: 'p-6 space-y-4',
  label: 'block text-gray-400 text-xs uppercase tracking-wider mb-1',
  input:
    'w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none',
  respondersWrap:
    'bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 max-h-52 overflow-y-auto space-y-1',
  responderRow:
    'flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-1',
  responderInfo: 'flex-1 min-w-0',
  responderName: 'text-white text-sm',
  responderCode: 'text-gray-500 text-xs ml-2',
  responderType: 'text-gray-600 text-xs shrink-0',
  responderStatus: 'text-xs px-1.5 py-0.5 rounded border shrink-0',
  responderStatusServiceable: 'text-green-400 border-green-600/30 bg-green-600/10',
  responderStatusActivated: 'text-blue-400 border-blue-600/30 bg-blue-600/10',
  responderStatusDefault: 'text-gray-400 border-gray-600/30 bg-gray-600/10',
  emptyText: 'text-gray-600 text-xs py-2',
  footer: 'p-6 border-t border-[#1f1f1f] flex gap-3 justify-end',
  cancelButton:
    'px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm',
  submitButton:
    'px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50',
};

function getResponderAcsStatusClass(acsStatus) {
  if (acsStatus === 'Serviceable') {
    return styles.responderStatusServiceable;
  }
  if (acsStatus && acsStatus.trim().toLowerCase() === 'acs activated') {
    return styles.responderStatusActivated;
  }
  return styles.responderStatusDefault;
}

export default function DispatchCreateModal({
  isOpen,
  incidents,
  selectedIncidentId,
  onChangeIncident,
  availableResponders,
  selectedResponderIds,
  onToggleResponder,
  notes,
  onChangeNotes,
  isSubmitting,
  onSubmit,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <ClipboardList className={styles.titleIcon} />
            New Dispatch Order
          </h2>

          <button type='button' onClick={onClose} className={styles.closeButton}>
            <X className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.body}>
          <div>
            <label className={styles.label}>Active Incident</label>
            <select
              value={selectedIncidentId}
              onChange={(event) => onChangeIncident(event.target.value)}
              className={styles.input}
            >
              <option value=''>Select incident...</option>
              {incidents.map((incident) => (
                <option key={incident.id} value={incident.id}>
                  {incident.incident_type || 'Incident'} — {incident.location_text}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={styles.label}>
              BFP Responders ({availableResponders.length} available)
            </label>

            {(() => {
              const filteredResponders = availableResponders.filter(
                (r) => r.agency_role === 'BFP' && r.acs_status === 'Serviceable'
              );
              if (!filteredResponders.length) {
                return <p className={styles.emptyText}>No BFP responders with Serviceable status available.</p>;
              }
              return (
                <div className={styles.respondersWrap}>
                  {filteredResponders.map((responder) => (
                    <label key={responder.id} className={styles.responderRow}>
                      <input
                        type='checkbox'
                        checked={selectedResponderIds.includes(responder.id)}
                        onChange={() => onToggleResponder(responder.id)}
                        className='accent-red-600'
                      />
                      <div className={styles.responderInfo}>
                        <span className={styles.responderName}>{responder.full_name}</span>
                        {responder.engine_number ? (
                          <span className={styles.responderCode}>#{responder.engine_number}</span>
                        ) : null}
                      </div>
                      <span className={styles.responderType}>
                        {responder.type_of_vehicle || responder.user_type}
                      </span>
                      <span
                        className={`${styles.responderStatus} ${getResponderAcsStatusClass(
                          responder.acs_status
                        )}`}
                      >
                        {responder.acs_status || 'Serviceable'}
                      </span>
                    </label>
                  ))}
                </div>
              );
            })()}
          </div>

          <div>
            <label className={styles.label}>Notes</label>
            <textarea
              value={notes}
              onChange={(event) => onChangeNotes(event.target.value)}
              rows={3}
              placeholder='Dispatch notes...'
              className={`${styles.input} resize-none placeholder-gray-700`}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button type='button' onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>

          <button
            type='button'
            onClick={onSubmit}
            disabled={isSubmitting || !selectedIncidentId || selectedResponderIds.length === 0}
            className={styles.submitButton}
          >
            {isSubmitting
              ? 'Dispatching...'
              : `Dispatch${
                  selectedResponderIds.length > 0
                    ? ` (${selectedResponderIds.length})`
                    : ''
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}

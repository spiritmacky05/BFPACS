/**
 * features/incidentDetail/components/IncidentActions.jsx
 *
 * Action buttons shown on top of incident detail page.
 *
 * Why this component exists:
 * - Keeps action/permission rendering out of the page container.
 * - Makes role-based button logic easy to read.
 */

import { CheckCircle2, Flame, Lock, Pencil, Printer, Wifi } from 'lucide-react';

const styles = {
  actionsWrap: 'flex gap-2 flex-wrap',
  buttonBase:
    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
  editButton:
    'border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-red-600/40',
  controlledButton:
    'border border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/10',
  fireOutButton:
    'border border-blue-600/40 text-blue-400 hover:bg-blue-600/10',
  closeButton:
    'border border-gray-600/40 text-gray-400 hover:text-white hover:border-gray-400',
  acsButton:
    'border border-green-600/40 text-green-400 hover:bg-green-600/10',
  printButton: 'bg-red-600 hover:bg-red-700 text-white',
  icon: 'w-4 h-4',
};

export default function IncidentActions({
  isAdmin,
  currentStatus,
  onEdit,
  onMarkControlled,
  onMarkFireOut,
  onCloseIncident,
  onOpenAcsPortal,
  onPrint,
}) {
  if (!isAdmin) return null;

  return (
    <div className={styles.actionsWrap}>
      <button type="button" onClick={onEdit} className={`${styles.buttonBase} ${styles.editButton}`}>
        <Pencil className={styles.icon} />
        Edit
      </button>

      {currentStatus === 'Active' && (
        <button
          type="button"
          onClick={onMarkControlled}
          className={`${styles.buttonBase} ${styles.controlledButton}`}
        >
          <CheckCircle2 className={styles.icon} />
          Mark Controlled
        </button>
      )}

      {(currentStatus === 'Active' || currentStatus === 'Controlled') && (
        <button
          type="button"
          onClick={onMarkFireOut}
          className={`${styles.buttonBase} ${styles.fireOutButton}`}
        >
          <Flame className={styles.icon} />
          Fire Out
        </button>
      )}

      {currentStatus !== 'Done' && (
        <button
          type="button"
          onClick={onCloseIncident}
          className={`${styles.buttonBase} ${styles.closeButton}`}
        >
          <Lock className={styles.icon} />
          Close Incident
        </button>
      )}

      <button
        type="button"
        onClick={onOpenAcsPortal}
        className={`${styles.buttonBase} ${styles.acsButton}`}
      >
        <Wifi className={styles.icon} />
        ACS Portal
      </button>

      <button
        type="button"
        onClick={onPrint}
        className={`${styles.buttonBase} ${styles.printButton}`}
      >
        <Printer className={styles.icon} />
        Print / Export
      </button>
    </div>
  );
}

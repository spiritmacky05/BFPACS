/**
 * features/dispatch/components/DispatchToolbar.jsx
 *
 * Header/toolbar for dispatch page.
 */

import { ClipboardList } from 'lucide-react';

const styles = {
  wrapper: 'flex items-center justify-between',
  titleWrap: 'flex items-center gap-3',
  iconBox: 'w-9 h-9 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center justify-center',
  icon: 'w-5 h-5 text-red-400',
  title: 'text-white font-semibold text-lg',
  subtitle: 'text-gray-500 text-xs',
  createButton:
    'flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all',
  createIcon: 'w-4 h-4',
};

export default function DispatchToolbar({ canCreate, onCreate }) {
  return (
    <header className={styles.wrapper}>
      <div className={styles.titleWrap}>
        <div className={styles.iconBox}>
          <ClipboardList className={styles.icon} />
        </div>

        <div>
          <h2 className={styles.title}>Dispatch System</h2>
          <p className={styles.subtitle}>
            Manage fleet deployment and responder status
          </p>
        </div>
      </div>

      {/* Temporarily disabled: ACS check-in now auto-creates dispatch records. */}
      {/* {canCreate ? (
        <button type='button' onClick={onCreate} className={styles.createButton}>
          <Plus className={styles.createIcon} />
          New Dispatch
        </button>
      ) : null} */}
    </header>
  );
}

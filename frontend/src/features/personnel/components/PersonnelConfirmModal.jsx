const styles = {
  overlay: 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4',
  modal: 'bg-[#151515] border border-[#2f2f2f] rounded-xl w-full max-w-md',
  body: 'p-6 space-y-4',
  title: 'text-lg font-bold text-white',
  message: 'text-sm text-gray-400',
  footer: 'px-6 py-4 border-t border-[#2f2f2f] flex justify-end gap-3',
  cancelButton:
    'px-4 py-2 rounded-lg border border-[#2f2f2f] text-gray-400 hover:border-gray-500 transition-all',
  dangerButton: 'px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors',
  primaryButton: 'px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors',
};

export default function PersonnelConfirmModal({
  title,
  message,
  confirmText,
  confirmType = 'danger',
  onCancel,
  onConfirm,
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.body}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.footer}>
          <button type='button' onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className={confirmType === 'primary' ? styles.primaryButton : styles.dangerButton}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

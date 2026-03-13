import { DUTY_STATUS_FILTER_OPTIONS } from '../lib/dutyPersonnel.constants';

const styles = {
  wrapper: 'flex gap-2 flex-wrap',
  buttonBase: 'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
  buttonActive: 'bg-red-600 border-red-600 text-white',
  buttonInactive:
    'border-[#1f1f1f] text-gray-400 hover:border-red-600/40 hover:text-white',
};

export default function DutyPersonnelStatusFilter({ value, onChange }) {
  return (
    <div className={styles.wrapper}>
      {DUTY_STATUS_FILTER_OPTIONS.map((status) => {
        const isActive = value === status;

        return (
          <button
            key={status}
            type='button'
            onClick={() => onChange(status)}
            className={`${styles.buttonBase} ${
              isActive ? styles.buttonActive : styles.buttonInactive
            }`}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}

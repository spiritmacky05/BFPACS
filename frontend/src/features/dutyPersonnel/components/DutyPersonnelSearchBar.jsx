import { Search } from 'lucide-react';

const styles = {
  wrapper: 'relative',
  icon: 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500',
  input:
    'w-full bg-[#111] border border-[#1f1f1f] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-600/50',
};

export default function DutyPersonnelSearchBar({ value, onChange }) {
  return (
    <div className={styles.wrapper}>
      <Search className={styles.icon} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='Search by name, rank, or shift...'
        className={styles.input}
      />
    </div>
  );
}

/**
 * features/incidentDetail/components/IncidentDetailCard.jsx
 *
 * Generic card section used in incident detail page.
 *
 * Why this component exists:
 * - The page has multiple cards with the same shell layout.
 * - Reusing this avoids repeated Tailwind blocks.
 */

const styles = {
  card: 'bg-[#111] border border-[#1f1f1f] rounded-xl p-5',
  titleWrap:
    'flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4',
  icon: 'w-3.5 h-3.5',
};

export default function IncidentDetailCard({ title, Icon, children }) {
  return (
    <section className={styles.card}>
      <div className={styles.titleWrap}>
        {Icon ? <Icon className={styles.icon} /> : null}
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

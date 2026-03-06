/**
 * components/PersonnelLink.jsx
 *
 * Reusable clickable personnel name that navigates to the
 * PersonnelProfile page. Drop-in replacement anywhere a
 * name string is rendered.
 *
 * Props:
 *   id        — personnel UUID (required)
 *   name      — display text (required)
 *   className — optional extra Tailwind classes
 */

import { Link } from 'react-router-dom';

export default function PersonnelLink({ id, name, className = '' }) {
  if (!id) return <span className={className}>{name ?? '—'}</span>;

  return (
    <Link
      to={`/PersonnelProfile?id=${id}`}
      className={`hover:text-red-400 hover:underline underline-offset-2 transition-colors cursor-pointer ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {name ?? '—'}
    </Link>
  );
}

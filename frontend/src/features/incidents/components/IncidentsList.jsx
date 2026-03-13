/**
 * features/incidents/components/IncidentsList.jsx
 *
 * Wrapper that decides which visual list mode to render.
 *
 * Why this file exists:
 * - Keeps page component from containing mode-switch rendering details.
 */

import IncidentCard from './IncidentCard';
import IncidentsTable from './IncidentsTable';

const styles = {
  loadingState: 'text-center text-gray-500 py-16',
  emptyState: 'text-center text-gray-600 py-16',
  cardGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
};

export default function IncidentsList({
  incidents,
  isLoading,
  viewMode,
  canEdit,
  canDeleteDone,
  onOpenDetail,
  onOpenEdit,
  onRequestStatus,
  onRequestDelete,
}) {
  if (isLoading) {
    return <div className={styles.loadingState}>Loading incidents...</div>;
  }

  if (!incidents.length) {
    return <div className={styles.emptyState}>No incidents found</div>;
  }

  if (viewMode === 'table') {
    return (
      <IncidentsTable
        incidents={incidents}
        canEdit={canEdit}
        canDeleteDone={canDeleteDone}
        onOpenDetail={onOpenDetail}
        onOpenEdit={onOpenEdit}
        onRequestDelete={onRequestDelete}
      />
    );
  }

  return (
    <div className={styles.cardGrid}>
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          canEdit={canEdit}
          canDeleteDone={canDeleteDone}
          onOpenDetail={onOpenDetail}
          onOpenEdit={onOpenEdit}
          onRequestStatus={onRequestStatus}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </div>
  );
}

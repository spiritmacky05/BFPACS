/**
 * features/incidents/index.js
 *
 * Barrel exports for the incidents feature.
 *
 * Why this file exists:
 * - Import paths stay short and predictable.
 * - Future migrations become easier.
 */

export { default as IncidentsPage } from './pages/IncidentsPage';
export { default as incidentsApi } from './api/incidents.api';
export { default as incidentAssetsApi } from './api/incidentAssets.api';
export { useIncidentsPage } from './hooks/useIncidentsPage';
export {
  applyIncidentStatusWorkflow,
  INCIDENT_STATUS,
} from './services/incidentStatusWorkflow.service';

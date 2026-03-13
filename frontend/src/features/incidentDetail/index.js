/**
 * features/incidentDetail/index.js
 *
 * Barrel exports for Incident Detail feature.
 */

export { default as IncidentDetailPage } from './pages/IncidentDetailPage';
export { default as incidentDetailApi } from './api/incidentDetail.api';
export { default as incidentDetailAssetsApi } from './api/incidentDetailAssets.api';
export { useIncidentDetail } from './hooks/useIncidentDetail';
export {
  applyIncidentDetailStatusWorkflow,
  INCIDENT_DETAIL_STATUS,
} from './services/incidentDetailStatusWorkflow.service';

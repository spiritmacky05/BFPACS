/**
 * features/dashboard/index.js
 *
 * Barrel exports for dashboard feature.
 */

export { default as DashboardPage } from './pages/DashboardPage';
export { default as dashboardApi } from './api/dashboard.api';
export { useDashboard, DASHBOARD_POLL_INTERVAL_MS } from './hooks/useDashboard';
export { buildDashboardSummary } from './services/dashboardSummary.service';

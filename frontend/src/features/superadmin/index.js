/**
 * features/superadmin/index.js
 *
 * Barrel exports for SuperAdmin feature.
 */

export { default as SuperAdminPage } from './pages/SuperAdminPage';
export { default as UserEditModal } from './components/UserEditModal';
export { useUserManagement } from './hooks/useUserManagement';
export { superadminApi } from './api/superadmin.api';

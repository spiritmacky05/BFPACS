/**
 * features/personnel/index.js
 *
 * Barrel exports for Personnel feature.
 */

export { default as PersonnelPage } from './pages/PersonnelPage';
export { default as PersonnelProfilePage } from './pages/PersonnelProfilePage';
export { default as ProfilePage } from './pages/ProfilePage';
export { default as PersonnelLink } from './components/PersonnelLink';
export { usePersonnel } from './hooks/usePersonnel';
export { usePersonnelProfile } from './hooks/usePersonnelProfile';
export { personnelApi } from './api/personnel.api';

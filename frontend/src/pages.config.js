/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { CheckInPage as CheckIn } from './features/checkin';
import Dashboard from './features/dashboard/pages/DashboardPage';
import Dispatch from './features/dispatch/pages/DispatchPage';
import { PersonnelPage as Personnel, PersonnelProfilePage as PersonnelProfile, ProfilePage as Profile } from './features/personnel';
import { EquipmentPage as Equipment } from './features/equipment';
import { FleetPage as Fleet } from './features/fleet';
import { HydrantsPage as Hydrants } from './features/hydrants';
import { StationsPage as Stations } from './features/stations';
import { SuperAdminPage as SuperAdmin } from './features/superadmin';
import { LoginPage as Login, RegisterPage as Register } from './features/auth';
import IncidentDetail from './features/incidentDetail/pages/IncidentDetailPage';
import Incidents from './features/incidents/pages/IncidentsPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CheckIn": CheckIn,
    "Dashboard": Dashboard,
    "Dispatch": Dispatch,
    "DutyPersonnel": Personnel,
    "PersonnelProfile": PersonnelProfile,
    "Profile": Profile,
    "Equipment": Equipment,
    "Fleet": Fleet,
    "Hydrants": Hydrants,
    "IncidentDetail": IncidentDetail,
    "Incidents": Incidents,
    "Login": Login,
    "Register": Register,
    "SuperAdmin": SuperAdmin,
    "Stations": Stations,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
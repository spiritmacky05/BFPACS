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
import CheckIn from './pages/CheckIn/CheckIn';
import Dashboard from './features/dashboard/pages/DashboardPage';
import Dispatch from './features/dispatch/pages/DispatchPage';
import DutyPersonnel from './features/dutyPersonnel/pages/DutyPersonnelPage';
import Equipment from './pages/Equipment/Equipment';
import Fleet from './pages/Fleet/Fleet';
import Hydrants from './pages/Hydrants/Hydrants';
import IncidentDetail from './features/incidentDetail/pages/IncidentDetailPage';
import Incidents from './features/incidents/pages/IncidentsPage';
import Personnel from './pages/Personnel/Personnel';
import PersonnelProfile from './pages/PersonnelProfile/PersonnelProfile';
import Profile from './pages/Profile/Profile';
import SuperAdmin from './pages/SuperAdmin/SuperAdmin';
import Stations from './pages/Stations/Stations';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CheckIn": CheckIn,
    "Dashboard": Dashboard,
    "Dispatch": Dispatch,
    "DutyPersonnel": DutyPersonnel,
    "Equipment": Equipment,
    "Fleet": Fleet,
    "Hydrants": Hydrants,
    "IncidentDetail": IncidentDetail,
    "Incidents": Incidents,
    "Personnel": Personnel,
    "PersonnelProfile": PersonnelProfile,
    "Profile": Profile,
    "SuperAdmin": SuperAdmin,
    "Stations": Stations,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
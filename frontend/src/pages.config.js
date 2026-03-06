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
import CheckIn from './pages/CheckIn';
import Dashboard from './pages/Dashboard';
import Dispatch from './pages/Dispatch';
import DutyPersonnel from './pages/DutyPersonnel';
import Equipment from './pages/Equipment';
import Fleet from './pages/Fleet';
import Hydrants from './pages/Hydrants';
import IncidentDetail from './pages/IncidentDetail';
import Incidents from './pages/Incidents';
import Personnel from './pages/Personnel';
import PersonnelProfile from './pages/PersonnelProfile';
import Profile from './pages/Profile';
import SuperAdmin from './pages/SuperAdmin';
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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
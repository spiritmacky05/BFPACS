/**
 * Layout.jsx
 *
 * Main app shell: fixed sidebar + top bar.
 * UI is identical to the original — only the data source changed:
 *   - currentUser now comes from AuthContext instead of base44.auth.me()
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Truck, AlertTriangle, ClipboardList, Menu, Shield,
  UserCheck, Package, Droplets, User, ShieldCheck,
  FolderOpen, ChevronDown, ChevronRight, Activity, LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext/AuthContext';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────
const styles = {
  container: "flex h-screen bg-[#0a0a0a] text-gray-100 overflow-hidden",
  mobileOverlay: "fixed inset-0 bg-black/80 z-20 lg:hidden",
  
  sidebar: {
    base: "fixed top-0 left-0 h-full w-64 bg-[#0d0d0d] border-r border-[#1f1f1f] z-30 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
    open: "translate-x-0",
    closed: "-translate-x-full",
    
    logoWrapper: "p-4 border-b border-[#1f1f1f]",
    logoAuto: "w-full h-auto object-contain",
    statusRow: "mt-3 flex items-center gap-2",
    statusDot: "w-2 h-2 bg-green-400 rounded-full status-pulse",
    statusText: "text-green-400 text-xs font-medium",
    
    navWrapper: "p-4 space-y-1 flex-1 overflow-y-auto",
    navItemBase: "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border",
    navItemActive: "bg-red-600/20 border-red-600/40 text-red-400",
    navItemInactive: "text-gray-400 hover:bg-white/5 hover:text-white border-transparent",
    navIconActive: "text-red-400",
    navIconInactive: "text-gray-500 group-hover:text-red-400",
    navText: "font-medium text-sm flex-1 text-left",
    navIndicator: "ml-auto w-1.5 h-1.5 bg-red-400 rounded-full",
    
    resourcesWrapper: "mb-1",
    subnavWrapper: "ml-4 mt-1 space-y-1 border-l border-[#2a2a2a] pl-3",
    subnavItemBase: "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group border",
    subnavIconActive: "text-red-400",
    subnavIconInactive: "text-gray-500 group-hover:text-red-400",
    
    footerWrapper: "p-4 border-t border-[#1f1f1f]",
    footerTop: "flex items-center gap-2 text-xs text-gray-600",
    footerIcon: "w-3 h-3",
    footerBottom: "text-xs text-gray-700 mt-1"
  },
  
  main: {
    wrapper: "flex-1 flex flex-col h-full min-w-0 overflow-hidden",
    header: "bg-[#0d0d0d] border-b border-[#1f1f1f] px-4 lg:px-6 py-4 flex items-center gap-4 shrink-0",
    menuBtn: "lg:hidden text-gray-400 hover:text-white",
    menuIcon: "w-6 h-6",
    headerTitleBox: "flex-1",
    headerTitle: "text-white font-semibold text-lg",
    headerSubtitle: "text-gray-500 text-xs",
    headerRight: "flex items-center gap-3",
    monitoringBadge: "hidden md:flex items-center gap-2 bg-red-950/30 border border-red-900/40 px-3 py-1.5 rounded-lg",
    monitoringIcon: "w-3 h-3 text-red-400",
    monitoringText: "text-red-400 text-xs font-medium",
    content: "flex-1 overflow-auto p-4 lg:p-6"
  }
};

// ─── Nav Definitions ─────────────────────────────────────────────────────────

const userNavItems = [
  { label: 'Dashboard',     page: 'Dashboard',    icon: LayoutDashboard },
  { label: 'Incidents',     page: 'Incidents',    icon: AlertTriangle },
  { label: 'Duty Personnel',page: 'DutyPersonnel',icon: UserCheck },
  { label: 'Equipment',     page: 'Equipment',    icon: Package },
  { label: 'Fire Hydrants', page: 'Hydrants',     icon: Droplets },
  { label: 'Profile',       page: 'Profile',      icon: User },
];

const adminNavItems = [
  { label: 'Dashboard', page: 'Dashboard', icon: Activity },
  { label: 'Incidents', page: 'Incidents', icon: AlertTriangle },
  { label: 'Fleet',     page: 'Fleet',     icon: Truck },
  { label: 'Dispatch System',  page: 'Dispatch',  icon: ClipboardList },
  { label: 'Profile',   page: 'Profile',   icon: User },
];

const adminResourceItems = [
  { label: 'Duty Personnel', page: 'DutyPersonnel', icon: UserCheck },
  { label: 'Equipment',      page: 'Equipment',     icon: Package },
  { label: 'Fire Hydrants',  page: 'Hydrants',      icon: Droplets },
];

const superAdminNavItems = [
  { label: 'Dashboard',  page: 'Dashboard',  icon: LayoutDashboard },
  { label: 'Incidents',  page: 'Incidents',  icon: AlertTriangle },
  { label: 'Fleet',      page: 'Fleet',      icon: Truck },
  { label: 'Dispatch System',   page: 'Dispatch',   icon: ClipboardList },
  { label: 'Profile',    page: 'Profile',    icon: User },
  { label: 'SuperAdmin', page: 'SuperAdmin', icon: ShieldCheck },
];

const allNavItems = [
  { label: 'Dashboard',     page: 'Dashboard',    icon: LayoutDashboard },
  { label: 'Incidents',     page: 'Incidents',    icon: AlertTriangle },
  { label: 'Fleet',         page: 'Fleet',        icon: Truck },
  { label: 'Dispatch System',      page: 'Dispatch',     icon: ClipboardList },
  { label: 'Duty Personnel',page: 'DutyPersonnel',icon: UserCheck },
  { label: 'Equipment',     page: 'Equipment',    icon: Package },
  { label: 'Fire Hydrants', page: 'Hydrants',     icon: Droplets },
  { label: 'Profile',       page: 'Profile',      icon: User },
  { label: 'SuperAdmin',    page: 'SuperAdmin',   icon: ShieldCheck },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const { role } = useAuth();
  const isSuperAdmin = role === 'superadmin';
  const isAdmin      = role === 'admin';
  const showResources = isSuperAdmin || isAdmin;
  const navItems = isSuperAdmin
    ? superAdminNavItems
    : isAdmin
    ? adminNavItems
    : userNavItems;

  return (
    <div className={styles.container}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar.base} ${sidebarOpen ? styles.sidebar.open : styles.sidebar.closed}`}>
        {/* Logo */}
        <div className={styles.sidebar.logoWrapper}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a3d28625a0e78023b5bac0/ae003633f_bfpacsrecLOGO.png"
            alt="BFP ACS Logo"
            className={styles.sidebar.logoAuto}
            style={{ maxHeight: '64px' }}
          />
          <div className={styles.sidebar.statusRow}>
            <div className={styles.sidebar.statusDot} />
            <span className={styles.sidebar.statusText}>SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebar.navWrapper}>
          {navItems.map(({ label, page, icon: Icon }) => {
            const insertResourcesBefore = label === 'Profile' && showResources;
            const isActive      = currentPageName === page;
            const resourcePages = ['DutyPersonnel', 'Equipment', 'Hydrants'];
            const resourceActive = resourcePages.includes(currentPageName);

            return (
              <div key={page}>
                {/* Resources collapsible group */}
                {insertResourcesBefore && (
                  <div className={styles.sidebar.resourcesWrapper}>
                    <button
                      onClick={() => setResourcesOpen(o => !o)}
                      className={`w-full ${styles.sidebar.navItemBase} ${
                        resourceActive
                          ? styles.sidebar.navItemActive
                          : styles.sidebar.navItemInactive
                      }`}
                    >
                      <FolderOpen className={`w-5 h-5 ${resourceActive ? styles.sidebar.navIconActive : styles.sidebar.navIconInactive}`} />
                      <span className={styles.sidebar.navText}>Resources</span>
                      {resourcesOpen || resourceActive
                        ? <ChevronDown className="w-4 h-4 text-gray-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </button>
                    {(resourcesOpen || resourceActive) && (
                      <div className={styles.sidebar.subnavWrapper}>
                        {adminResourceItems.map(({ label: rl, page: rp, icon: RI }) => {
                          const rActive = currentPageName === rp;
                          return (
                            <Link
                              key={rp}
                              to={createPageUrl(rp)}
                              onClick={() => setSidebarOpen(false)}
                              className={`${styles.sidebar.subnavItemBase} ${
                                rActive
                                  ? styles.sidebar.navItemActive
                                  : styles.sidebar.navItemInactive
                              }`}
                            >
                              <RI className={`w-4 h-4 ${rActive ? styles.sidebar.subnavIconActive : styles.sidebar.subnavIconInactive}`} />
                              <span className="font-medium text-sm">{rl}</span>
                              {rActive && <div className={styles.sidebar.navIndicator} />}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Regular nav item */}
                <Link
                  to={createPageUrl(page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`${styles.sidebar.navItemBase} ${
                    isActive
                      ? styles.sidebar.navItemActive
                      : styles.sidebar.navItemInactive
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? styles.sidebar.navIconActive : styles.sidebar.navIconInactive}`} />
                  <span className={styles.sidebar.navText}>{label}</span>
                  {isActive && <div className={styles.sidebar.navIndicator} />}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.sidebar.footerWrapper}>
          <div className={styles.sidebar.footerTop}>
            <Shield className={styles.sidebar.footerIcon} />
            <span>Bureau of Fire Protection</span>
          </div>
          <div className={styles.sidebar.footerBottom}>© 2026 BFP Philippines</div>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main.wrapper}>
        {/* Top bar */}
        <header className={styles.main.header}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={styles.main.menuBtn}
          >
            <Menu className={styles.main.menuIcon} />
          </button>
          <div className={styles.main.headerTitleBox}>
            <h1 className={styles.main.headerTitle}>
              {allNavItems.find(n => n.page === currentPageName)?.label || currentPageName}
            </h1>
            <p className={styles.main.headerSubtitle}>Bureau of Fire Protection Automated Check-in System</p>
          </div>
          <div className={styles.main.headerRight}>
            <div className={styles.main.monitoringBadge}>
              <AlertTriangle className={styles.main.monitoringIcon} />
              <span className={styles.main.monitoringText}>ACTIVE MONITORING</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.main.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
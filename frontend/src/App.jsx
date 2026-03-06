/**
 * App.jsx
 *
 * Root of the application. Sets up:
 *   - React Query for data fetching
 *   - React Router for navigation
 *   - AuthProvider for role context
 *   - Toaster for toast notifications
 */

import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/context/AuthContext/AuthContext';
import { queryClientInstance } from '@/lib/query-client/query-client';
import { pagesConfig } from './pages.config';
import PageNotFound from './lib/PageNotFound/PageNotFound';

// Import Auth Pages directly
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = Pages[mainPageKey];

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout
    ? <Layout currentPageName={currentPageName}>{children}</Layout>
    : <>{children}</>;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      {Object.entries(Pages).map(([pageName, Page]) => (
        <Route
          key={pageName}
          path={`/${pageName}`}
          element={
            <ProtectedRoute>
              <LayoutWrapper currentPageName={pageName}>
                <Page />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

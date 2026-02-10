import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy Loading für Seiten
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AccountSettings = lazy(() => import('./pages/Accountsettings'));
const AccountDeleted = lazy(() => import('./pages/Accountdeleted'));
const ShareView = lazy(() => import('./pages/ShareView'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">Laden...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-settings"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />
          <Route path="/account-deleted" element={<AccountDeleted />} />
          <Route path="/share/:code" element={<ShareView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
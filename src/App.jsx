import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SolanaWalletProvider } from './context/WalletContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { registerPushToken, removePushToken } from './services/pushNotificationService';

// Lazy Loading für Seiten
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AccountSettings = lazy(() => import('./pages/Accountsettings'));
const AccountDeleted = lazy(() => import('./pages/Accountdeleted'));
const ShareView = lazy(() => import('./pages/ShareView'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const BrokerPortal = lazy(() => import('./pages/BrokerPortal'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">Laden...</p>
    </div>
  </div>
);

// Push Notification Setup — muss innerhalb von AuthProvider sein
function PushNotificationSetup() {
  const { currentUser } = useAuth();
  const currentTokenRef = useRef(null);

  useEffect(() => {
    let cleanup = null;

    async function setupPush() {
      // Nur auf echten Geräten (iOS/Android), nicht im Browser
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import('@capacitor/push-notifications');

      if (currentUser?.id) {
        // Permission anfragen
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') return;

        await PushNotifications.register();

        // Token empfangen und in Supabase speichern
        const registrationListener = await PushNotifications.addListener(
          'registration',
          async (token) => {
            currentTokenRef.current = token.value;
            const platform = Capacitor.getPlatform(); // 'ios'
            await registerPushToken(currentUser.id, token.value, platform);
          }
        );

        // Fehler loggen
        const errorListener = await PushNotifications.addListener(
          'registrationError',
          (err) => console.error('Push Registrierung fehlgeschlagen:', err)
        );

        cleanup = async () => {
          registrationListener.remove();
          errorListener.remove();
        };
      } else {
        // User ausgeloggt → Token löschen
        if (currentTokenRef.current) {
          await removePushToken(currentTokenRef.current);
          currentTokenRef.current = null;
        }
      }
    }

    setupPush();
    return () => { if (cleanup) cleanup(); };
  }, [currentUser?.id]);

  return null;
}

function App() {
  return (
    <Router>
      <SolanaWalletProvider>
      <LanguageProvider>
      <AuthProvider>
        <PushNotificationSetup />
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
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/broker" element={<BrokerPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
      </LanguageProvider>
      </SolanaWalletProvider>
    </Router>
  );
}

export default App;

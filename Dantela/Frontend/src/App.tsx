import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CataloguePage from './pages/CataloguePage';
import OrderManagementPage from './pages/OrderManagementPage';
import DirectDistributionPage from './pages/DirectDistributionPage';
import MyRequestsPage from './pages/MyRequestsPage';
import Dashboard from './components/Dashboard';
import DepotManagementPage from './pages/DepotManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import NotificationsPage from './pages/NotificationsPage';
import StockMovementsPage from './pages/StockMovementsPage';
import ProfilePage from './pages/ProfilePage';
import DeliveryNotePage from './pages/DeliveryNotePage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
}

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={
            <>
              <Navbar />
              <HomePage />
            </>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes pour les modules magazinier */}
        <Route 
          path="/catalogue" 
          element={
            <ProtectedRoute>
              <CataloguePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/gestion-commandes" 
          element={
            <ProtectedRoute>
              <OrderManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/distribution-directe" 
          element={
            <ProtectedRoute>
              <DirectDistributionPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/depots" 
          element={
            <ProtectedRoute>
              <DepotManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <UserManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stocks" 
          element={
            <ProtectedRoute>
              <StockMovementsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mes-demandes" 
          element={
            <ProtectedRoute>
              <MyRequestsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Chat</h1>
                  <p className="text-gray-600">En cours de développement...</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/historique" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Historique</h1>
                  <p className="text-gray-600">En cours de développement...</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/bon-livraison/:id" 
          element={
            <ProtectedRoute>
              <DeliveryNotePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Placeholder routes for navigation */}
        <Route 
          path="/services" 
          element={
            <>
              <Navbar />
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Services</h1>
                  <p className="text-gray-600">Page en cours de développement</p>
                </div>
              </div>
            </>
          } 
        />
        <Route 
          path="/about" 
          element={
            <>
              <Navbar />
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">À propos</h1>
                  <p className="text-gray-600">Page en cours de développement</p>
                </div>
              </div>
            </>
          } 
        />
        <Route 
          path="/contact" 
          element={
            <>
              <Navbar />
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact</h1>
                  <p className="text-gray-600">Page en cours de développement</p>
                </div>
              </div>
            </>
          } 
        />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
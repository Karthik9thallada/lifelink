import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Navbar from './components/Navbar';
import LiveAlertToast from './components/LiveAlertToast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Heart } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Validating credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
            <Navbar />
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                <Route
                  path="/donor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                      <DonorDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hospital/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['HOSPITAL', 'ADMIN']}>
                      <HospitalDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/hospitals"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <LiveAlertToast />

            {/* Footer */}
            <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-auto text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                  <span className="font-bold text-slate-300 font-mono">LifeLink Emergency Grid</span>
                </div>
                <p className="italic text-slate-400">
                  “Connecting Every Lifesaving Donation to Those Who Need It.”
                </p>
                <p>© 2026 LifeLink Network. Built with Spring Boot, PostGIS, Redis & React.</p>
              </div>
            </footer>
          </div>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

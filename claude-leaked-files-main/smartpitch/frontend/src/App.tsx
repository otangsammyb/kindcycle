import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/dashboard/Chat';
import Billing from './pages/dashboard/Billing';
import Settings from './pages/dashboard/Settings';
import Analyses from './pages/dashboard/Analyses';

import AdminOverview from './pages/admin/Overview';
import AdminUsers from './pages/admin/Users';
import AdminFinancials from './pages/admin/Financials';
import AdminSettings from './pages/admin/Settings';

import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const token = localStorage.getItem('token');
  
  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!token || !isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const token = localStorage.getItem('token');

  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Verifying...</div>;
  if (!token || !isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;

  return children;
};

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/dashboard/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/dashboard/analyses" element={<ProtectedRoute><Analyses /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/financials" element={<AdminRoute><AdminFinancials /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

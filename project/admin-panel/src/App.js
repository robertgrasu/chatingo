import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import { BotProvider } from './BotContext';
import { AuthProvider, useAuth } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { setAuthHelpers } from './api';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Integration from './pages/Integration';
import KnowledgeBase from './pages/KnowledgeBase';
import Conversations from './pages/Conversations';
import Settings from './pages/Settings';
import QuickReplies from './pages/QuickReplies';
import Reviews from './pages/Reviews';
import Bots from './pages/Bots';
import AccountSettings from './pages/AccountSettings';
import Notifications from './pages/Notifications';
import BotBehavior from './pages/BotBehavior';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a1120]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AuthWiring({ children }) {
  const { accessToken, refreshAccessToken, logout } = useAuth();
  const navigate = useNavigate();

  const getToken = useCallback(() => accessToken, [accessToken]);
  const onFailure = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    setAuthHelpers(getToken, refreshAccessToken, onFailure);
  }, [getToken, refreshAccessToken, onFailure]);

  return children;
}

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BotProvider>
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1120] transition-colors">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <Topbar sidebarCollapsed={sidebarCollapsed} />
        <main className={`${sidebarCollapsed ? 'ml-[72px]' : 'ml-[226px]'} pt-[60px] transition-all duration-300`}>
          <div className="h-[calc(100vh-60px)] overflow-y-auto p-5 sm:p-7">
            <div className="max-w-[1400px] mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bots" element={<Bots />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/conversations" element={<Conversations />} />
                <Route path="/quick-replies" element={<QuickReplies />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/behavior" element={<BotBehavior />} />
                <Route path="/integration" element={<Integration />} />
                <Route path="/account" element={<AccountSettings />} />
                <Route path="/notifications" element={<Notifications />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </NotificationProvider>
    </BotProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthWiring>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                } />
              </Routes>
            </AuthWiring>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

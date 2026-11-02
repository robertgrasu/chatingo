import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider, useToast } from './ToastContext';
import { BotProvider } from './BotContext';
import { AuthProvider, useAuth } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { setAuthHelpers, setDemoHelper } from './api';
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
import LiveChat from './pages/LiveChat';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';

// Permite accesul doar utilizatorilor autentificati; ceilalti sunt trimisi la pagina de login
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a1120]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Leaga contextul de autentificare de clientul API: token-ul, reinnoirea lui, deconectarea la esec si blocarea scrierilor pentru contul demo
function AuthWiring({ children }) {
  const { accessToken, refreshAccessToken, logout, user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Functiile pasate clientului API pentru token si pentru cazul in care autentificarea esueaza definitiv
  const getToken = useCallback(() => accessToken, [accessToken]);
  const onFailure = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    setAuthHelpers(getToken, refreshAccessToken, onFailure);
  }, [getToken, refreshAccessToken, onFailure]);

  useEffect(() => {
    // Contul demo poate doar citi, iar la orice incercare de scriere se afiseaza un mesaj
    const isDemo = user?.role === 'demo';
    setDemoHelper(isDemo, isDemo ? () => addToast('Cont demo - modificările nu sunt permise', 'info') : null);
  }, [user, addToast]);

  return children;
}

// Structura paginilor din panou: bara laterala, bara de sus si zona cu rutele protejate
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
                <Route path="/live-chat" element={<LiveChat />} />
                <Route path="/quick-replies" element={<QuickReplies />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/behavior" element={<BotBehavior />} />
                <Route path="/integration" element={<Integration />} />
                <Route path="/users" element={<UserManagement />} />
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

// Componenta radacina: furnizorii de context si rutele aplicatiei
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

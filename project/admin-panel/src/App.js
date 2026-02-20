import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import { BotProvider } from './BotContext';
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

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ThemeProvider>
      <BotProvider>
        <ToastProvider>
          <BrowserRouter>
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
                      <Route path="/integration" element={<Integration />} />
                    </Routes>
                  </div>
                </div>
              </main>
            </div>
          </BrowserRouter>
        </ToastProvider>
      </BotProvider>
    </ThemeProvider>
  );
}

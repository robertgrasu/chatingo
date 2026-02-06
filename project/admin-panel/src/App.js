import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Integration from './pages/Integration';
import KnowledgeBase from './pages/KnowledgeBase';
import Conversations from './pages/Conversations';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <Sidebar />
            <main className="flex-1 p-8 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/knowledge" element={<KnowledgeBase />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/integration" element={<Integration />} />
                </Routes>
              </div>
            </main>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

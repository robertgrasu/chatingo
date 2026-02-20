import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useBot } from '../BotContext';

export default function Topbar({ sidebarCollapsed }) {
  const { dark, toggle } = useTheme();
  const { selectedBotId, selectBot, bots } = useBot();
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [botDropOpen, setBotDropOpen] = useState(false);
  const profileRef = useRef(null);
  const botDropRef = useRef(null);

  const currentBot = bots.find((b) => b.bot_id === selectedBotId);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (botDropRef.current && !botDropRef.current.contains(e.target)) setBotDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className={`h-[60px] fixed top-0 right-0 ${sidebarCollapsed ? 'left-[72px]' : 'left-[226px]'} z-40 bg-white dark:bg-dark border-b-2 border-gray-100 dark:border-gray-800/50 transition-all duration-300`}>
      <div className="h-full flex items-center justify-between px-5">
        {/* Search */}
        <div className={`relative flex items-center transition-all duration-200 ${searchFocused ? 'w-80' : 'w-64'}`}>
          <svg className="absolute left-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Bot Selector */}
          <div ref={botDropRef} className="relative">
            <button
              onClick={() => setBotDropOpen(!botDropOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors duration-200"
            >
              <div className="w-4 h-4 rounded-md flex-shrink-0" style={{ backgroundColor: currentBot?.primary_color || '#6366f1' }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                {currentBot?.bot_name || 'Select Bot'}
              </span>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${botDropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {botDropOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 py-1.5 animate-scale-in max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Botii Mei</p>
                </div>
                {bots.map((bot) => (
                  <button
                    key={bot.bot_id}
                    onClick={() => { selectBot(bot.bot_id); setBotDropOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      bot.bot_id === selectedBotId
                        ? 'bg-primary/5 dark:bg-primary/10'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-lighter'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md flex-shrink-0" style={{ backgroundColor: bot.primary_color || '#6366f1' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{bot.bot_name}</p>
                      <p className="text-[10px] text-gray-400">{bot.document_count} docs &middot; {bot.conversation_count} conv</p>
                    </div>
                    {bot.bot_id === selectedBotId && (
                      <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-lighter transition-colors duration-200"
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" fill="currentColor" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" opacity="0.3" />
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-lighter transition-colors duration-200 relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path opacity="0.3" d="M18.75 9V9.704C18.75 10.432 18.965 11.144 19.365 11.752L20.06 12.808C20.919 14.116 20.265 15.88 18.756 16.255C14.326 17.33 9.674 17.33 5.245 16.255C3.735 15.88 3.081 14.116 3.94 12.808L4.635 11.752C5.035 11.144 5.25 10.432 5.25 9.704V9C5.25 5.272 8.272 2.25 12 2.25C15.728 2.25 18.75 5.272 18.75 9Z" fill="currentColor" />
              <path d="M7.5 16.5C8.156 19.443 9.873 21.75 12 21.75C14.127 21.75 15.844 19.443 16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* User profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-lighter transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">Admin</p>
                <p className="text-[10px] text-gray-400 leading-tight">Administrator</p>
              </div>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 py-1.5 animate-scale-in">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                  <p className="text-xs text-gray-400">admin@chatbot.local</p>
                </div>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

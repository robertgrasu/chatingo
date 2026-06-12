import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useBot } from '../BotContext';
import { useAuth } from '../AuthContext';
import { useNotifications } from '../NotificationContext';

// Afiseaza in forma scurta cat timp a trecut de la un moment dat
function timeAgo(ts) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'Chiar acum';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}z`;
}

// Paginile in care se poate cauta din bara de sus, cu descriere, ruta si cuvinte cheie
const SEARCH_ITEMS = [
  { label: 'Dashboard', desc: 'Statistici si sumar general', route: '/', category: 'Pagini', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4', keywords: 'acasa home statistici stats overview' },
  { label: 'Knowledge Base', desc: 'Documente si categorii', route: '/knowledge', category: 'Pagini', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', keywords: 'documente fisiere upload knowledge baza cunostinte' },
  { label: 'Conversatii', desc: 'Istoricul conversatiilor', route: '/conversations', category: 'Pagini', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', keywords: 'chat mesaje messages istoric history' },
  { label: 'Raspunsuri Rapide', desc: 'Quick replies si categorii', route: '/quick-replies', category: 'Pagini', icon: 'M13 10V3L4 14h7v7l9-11h-7z', keywords: 'quick replies butoane intrebari frecvente' },
  { label: 'Recenzii', desc: 'Feedback si rating-uri', route: '/reviews', category: 'Pagini', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', keywords: 'feedback stele reviews rating evaluare' },
  { label: 'Notificari', desc: 'Toate notificarile', route: '/notifications', category: 'Pagini', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', keywords: 'alerts alerte notificari mesaje noi' },
  { label: 'Widget Config', desc: 'Tema, culori, avatar, pozitie', route: '/settings', category: 'Setari', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.11-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', keywords: 'configurare setari widget tema culoare accent header buton flotant iconita pozitie avatar culori personalizate' },
  { label: 'Comportament AI', desc: 'System prompt, temperatura, limba', route: '/behavior', category: 'Setari', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', keywords: 'ai inteligenta prompt temperatura creativitate tokeni limba raspunsuri stil context' },
  { label: 'Botii Mei', desc: 'Gestioneaza botii', route: '/bots', category: 'Setari', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', keywords: 'bot boti creare stergere administrare' },
  { label: 'Live Chat', desc: 'Chat in timp real cu vizitatorii', route: '/live-chat', category: 'Pagini', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8zM7 4h8a2 2 0 012 2v2H9a4 4 0 00-4 4v2H5a2 2 0 01-2-2V6a2 2 0 012-2z', keywords: 'live chat operator uman conversatie real-time vizitatori suport' },
  { label: 'Integration', desc: 'Cod embed si instalare', route: '/integration', category: 'Setari', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', keywords: 'embed cod script instalare website html' },
  { label: 'Utilizatori', desc: 'Gestioneaza conturile admin', route: '/users', category: 'Setari', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', keywords: 'utilizatori useri conturi admin operator creare stergere management' },
  { label: 'Setari Cont', desc: 'Profil, parola, email', route: '/account', category: 'Cont', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', keywords: 'cont profil parola schimba email utilizator admin' },
];

// Bara de sus: cautare globala, selectorul de bot, notificarile, tema si meniul profilului
export default function Topbar({ sidebarCollapsed }) {
  // Datele din contexte: tema, botii, utilizatorul si notificarile
  const { dark, toggle } = useTheme();
  const { selectedBotId, selectBot, bots } = useBot();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Starea cautarii: focus, text si rezultatul selectat cu tastatura
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  // Starea meniurilor deschise: profil, selector de bot, notificari si filtrul lor
  const [profileOpen, setProfileOpen] = useState(false);
  const [botDropOpen, setBotDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  // Referintele folosite pentru a inchide meniurile la click in afara lor
  const profileRef = useRef(null);
  const botDropRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Botul selectat, afisat in selector
  const currentBot = bots.find((b) => b.bot_id === selectedBotId);

  // Profilul vine din contextul de autentificare, nu din localStorage
  const profileName = user?.username || 'Admin';
  const profileEmail = user?.email || '';
  const profileAvatar = null;

  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  // Primele 5 notificari dupa filtrul ales (toate, citite sau necitite)
  const filteredNotifs = notifications.filter((n) => {
    if (notifFilter === 'read') return n.read;
    if (notifFilter === 'unread') return !n.read;
    return true;
  }).slice(0, 5);

  // Rezultatele cautarii globale: primele 8 pagini care contin toate cuvintele scrise
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return SEARCH_ITEMS.filter((item) => {
      const haystack = `${item.label} ${item.desc} ${item.keywords}`.toLowerCase();
      return q.split(/\s+/).every((word) => haystack.includes(word));
    }).slice(0, 8);
  }, [searchQuery]);

  // Lista de rezultate apare cat timp campul are focus si text
  const showSearch = searchFocused && searchQuery.trim().length > 0;

  // La fiecare cautare noua selectia revine la primul rezultat
  useEffect(() => { setSelectedIdx(0); }, [searchResults]);

  // Scurtatura Ctrl+K pentru cautare
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Navigare cu tastatura in rezultate: sageti, Enter pentru a deschide pagina si Escape pentru a inchide
  const handleSearchKey = (e) => {
    if (!showSearch && e.key !== 'Escape') return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, searchResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && searchResults[selectedIdx]) {
      e.preventDefault();
      navigate(searchResults[selectedIdx].route);
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
    else if (e.key === 'Escape') { setSearchQuery(''); searchInputRef.current?.blur(); }
  };

  // Click in afara unui meniu il inchide
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (botDropRef.current && !botDropRef.current.contains(e.target)) setBotDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) { setNotifOpen(false); setNotifMenuOpen(false); }
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  return (
    <header className={`h-[60px] fixed top-0 right-0 ${sidebarCollapsed ? 'left-[72px]' : 'left-[226px]'} z-40 bg-white dark:bg-dark border-b-2 border-gray-100 dark:border-gray-800/50 transition-all duration-300`}>
      <div className="h-full flex items-center justify-between px-5">
        {/* Cautare */}
        <div ref={searchRef} className={`relative flex items-center transition-all duration-200 ${searchFocused ? 'w-96' : 'w-64'}`}>
          <svg className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            name="topbar-search"
            autoComplete="off"
            placeholder="Cauta pagini, setari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleSearchKey}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />

          {/* Lista de rezultate apare doar cand se cauta ceva */}
          {showSearch && (
            <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 overflow-hidden z-50 animate-scale-in">
              {/* Mesaj cand nu exista rezultate, altfel lista grupata pe categorii */}
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-xs text-gray-400">Niciun rezultat pentru "{searchQuery}"</p>
                </div>
              ) : (
                <>
                  {/* Rezultatele sunt grupate pe categorii */}
                  {(() => {
                    let lastCat = '';
                    let globalIdx = -1;
                    return searchResults.map((item) => {
                      globalIdx++;
                      const idx = globalIdx;
                      const showCat = item.category !== lastCat;
                      lastCat = item.category;
                      return (
                        <div key={item.route}>
                          {showCat && (
                            <div className="px-3 pt-2.5 pb-1">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.category}</p>
                            </div>
                          )}
                          <button
                            onMouseDown={(e) => { e.preventDefault(); navigate(item.route); setSearchQuery(''); setSearchFocused(false); }}
                            onMouseEnter={() => setSelectedIdx(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              selectedIdx === idx
                                ? 'bg-primary/5 dark:bg-primary/10'
                                : 'hover:bg-gray-50 dark:hover:bg-dark-lighter'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selectedIdx === idx ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${selectedIdx === idx ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>{item.label}</p>
                              <p className="text-[11px] text-gray-400 truncate">{item.desc}</p>
                            </div>
                            {selectedIdx === idx && (
                              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      );
                    });
                  })()}
                  <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400">{searchResults.length} rezultat{searchResults.length !== 1 ? 'e' : ''}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Partea din dreapta */}
        <div className="flex items-center gap-2">
          {/* Selectorul de bot */}
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

            {/* Lista de boti, vizibila doar cand selectorul este deschis */}
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

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Butonul pentru tema intunecata */}
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-lighter transition-colors duration-200"
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {/* Iconita se schimba dupa tema curenta: soare pentru intunecat, luna pentru luminos */}
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

          {/* Notificari */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-lighter transition-colors duration-200 relative"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path opacity="0.3" d="M18.75 9V9.704C18.75 10.432 18.965 11.144 19.365 11.752L20.06 12.808C20.919 14.116 20.265 15.88 18.756 16.255C14.326 17.33 9.674 17.33 5.245 16.255C3.735 15.88 3.081 14.116 3.94 12.808L4.635 11.752C5.035 11.144 5.25 10.432 5.25 9.704V9C5.25 5.272 8.272 2.25 12 2.25C15.728 2.25 18.75 5.272 18.75 9Z" fill="currentColor" />
                <path d="M7.5 16.5C8.156 19.443 9.873 21.75 12 21.75C14.127 21.75 15.844 19.443 16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {/* Insigna cu numarul de notificari necitite */}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Panoul de notificari, vizibil doar cand este deschis */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 animate-scale-in z-50">
                {/* Antet */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Notificari</h4>
                  <div className="flex items-center gap-2">
                    {/* Butonul pentru marcarea tuturor ca citite apare doar daca exista necitite */}
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-primary hover:text-primary-600 font-medium">
                        Citeste tot
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                        className="text-gray-400 hover:text-primary transition-colors p-1"
                      >
                        <svg width="14" height="4" viewBox="0 0 18 4" fill="none">
                          <circle cx="2" cy="2" r="2" fill="currentColor" />
                          <circle cx="9" cy="2" r="2" fill="currentColor" />
                          <circle cx="16" cy="2" r="2" fill="currentColor" />
                        </svg>
                      </button>
                      {/* Meniul cu filtrele de notificari */}
                      {notifMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                          {/* Cate un buton pentru fiecare filtru */}
                          {['all', 'unread', 'read'].map((f) => (
                            <button
                              key={f}
                              onClick={() => { setNotifFilter(f); setNotifMenuOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                notifFilter === f ? 'text-primary font-medium bg-primary/5' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-lighter'
                              }`}
                            >
                              {f === 'all' ? 'Toate' : f === 'unread' ? 'Necitite' : 'Citite'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista */}
                <div className="max-h-80 overflow-y-auto">
                  {/* Mesaj cand nu exista notificari, altfel lista lor */}
                  {filteredNotifs.length === 0 ? (
                    <div className="py-8 text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-xs text-gray-400">Nicio notificare</p>
                    </div>
                  ) : (
                    filteredNotifs.map((notif) => {
                      const routes = { conversation: '/conversations', feedback: '/reviews', document: '/knowledge' };
                      return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          const route = routes[notif.type];
                          if (route) { navigate(route); setNotifOpen(false); }
                        }}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${
                          notif.read ? 'opacity-60' : 'bg-primary/[0.02] dark:bg-primary/[0.03]'
                        } hover:bg-gray-50 dark:hover:bg-dark-lighter`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          notif.type === 'conversation' ? 'bg-primary/10' :
                          notif.type === 'feedback' ? 'bg-purple/10' :
                          notif.type === 'document' ? 'bg-emerald-500/10' :
                          'bg-amber-500/10'
                        }`}>
                          {notif.type === 'conversation' && (
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                          {notif.type === 'feedback' && (
                            <svg className="w-4 h-4 text-purple" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          )}
                          {notif.type === 'document' && (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {notif.type === 'system' && (
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{notif.title}</p>
                            {!notif.read && <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{notif.desc}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">{timeAgo(notif.time)}</p>
                        </div>
                      </button>
                      );
                    })
                  )}
                </div>

                {/* Subsol */}
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 text-center">
                  <button
                    onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                    className="text-xs font-semibold text-gray-400 hover:text-primary transition-colors"
                  >
                    Vezi toate notificarile &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Profilul utilizatorului */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-lighter transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  profileName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
                  {profileName}
                  {/* Eticheta demo apare doar pentru contul demo */}
                  {user?.role === 'demo' && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide">Demo</span>
                  )}
                </p>
                {user?.role !== 'demo' && <p className="text-[10px] text-gray-400 leading-tight capitalize">{user?.role || 'admin'}</p>}
              </div>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Meniul profilului, vizibil doar cand este deschis */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 py-1.5 animate-scale-in">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{profileName}</p>
                  <p className="text-xs text-gray-400">{profileEmail}</p>
                </div>
                <button
                  onClick={() => { navigate('/account'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Setari Cont
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <button
                  onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Deconectare
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

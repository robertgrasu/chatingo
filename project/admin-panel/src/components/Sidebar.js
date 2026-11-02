import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getStats } from '../api';
import { useBot } from '../BotContext';


// Iconita in doua tonuri folosita in meniul lateral
const DuoIcon = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">{children}</svg>
);

// Iconitele meniului, desenate ca SVG in doua tonuri
const icons = {
  dashboard: (
    <DuoIcon>
      <g opacity="0.4"><rect x="13" y="11" width="7" height="9" rx="2" ry="2"/><rect x="4" y="4" width="7" height="9" rx="2" ry="2"/></g>
      <g><rect x="4" y="15" width="7" height="5" rx="2" ry="2"/><rect x="13" y="4" width="7" height="5" rx="2" ry="2"/></g>
    </DuoIcon>
  ),
  bookContent: (
    <DuoIcon>
      <g opacity="0.4"><path d="m17.5,4h-5.5v16h5.5c1.93,0,3.5-1.57,3.5-3.5V7.5c0-1.93-1.57-3.5-3.5-3.5Zm1,8h-4c-.28,0-.5-.22-.5-.5s.22-.5.5-.5h4c.28,0,.5.22.5.5s-.22.5-.5.5Zm0-4h-4c-.28,0-.5-.22-.5-.5s.22-.5.5-.5h4c.28,0,.5.22.5.5s-.22.5-.5.5Z"/></g>
      <g><path d="m12,4h-5.5c-1.93,0-3.5,1.57-3.5,3.5v9c0,1.93,1.57,3.5,3.5,3.5h5.5V4Z"/></g>
    </DuoIcon>
  ),
  bolt: (
    <DuoIcon>
      <g opacity="0.4"><path d="m14.36,4.61c0-.69-.42-1.29-1.07-1.52-.65-.23-1.35-.03-1.79.51l-6.52,8.15c-.39.49-.46,1.14-.19,1.7.27.56.82.91,1.45.91h3.4l4.72-4.72v-5.03Z"/></g>
      <g><path d="m17.76,9.64h-3.4l-4.72,4.72v5.03c0,.69.42,1.29,1.07,1.52.18.06.36.09.54.09.47,0,.93-.21,1.24-.6l6.52-8.15c.39-.49.46-1.14.19-1.7-.27-.56-.82-.91-1.45-.91Z"/></g>
    </DuoIcon>
  ),
  star: (
    <DuoIcon>
      <g opacity="0.4"><path d="M12 2l2.94 5.96 6.58.58c.49.04.9.36 1.07.82s.06.96-.29 1.31l-5.01 5.01 1.25 4.06c.16.51-.02 1.05-.45 1.37s-1 .33-1.44-.04L12 17.77V2Z"/></g>
      <g><path d="M12 2L9.06 7.96l-6.58.58c-.49.04-.9.36-1.07.82s-.06.96.29 1.31l5.01 5.01-1.25 4.06c-.16.51.02 1.05.45 1.37s1 .33 1.44-.04L12 17.77V2Z"/></g>
    </DuoIcon>
  ),
  chat: (
    <DuoIcon>
      <g opacity="0.4"><path d="M17.98 14.51C18.09 14.46 18.2 14.42 18.3 14.37c.29-.14.63-.19.93-.1l1 .27c.79.21 1.5-.5 1.29-1.29l-.27-1c-.08-.31-.03-.65.14-.93C21.77 10.45 22 9.5 22 8.5 22 4.91 19.09 2 15.5 2c-2.71 0-5.03 1.66-6.01 4.02.17-.01.34-.02.51-.02 4.42 0 8 3.58 8 8 0 .17 0 .34-.02.51Z"/></g>
      <g><path d="M18 14c0 4.42-3.58 8-8 8-1.24 0-2.41-.28-3.45-.78-.36-.17-.77-.23-1.16-.13l-1.23.33c-.97.26-1.85-.66-1.58-1.59l.33-1.23c.1-.39.04-.79-.13-1.16C2.28 16.41 2 15.24 2 14c0-4.42 3.58-8 8-8s8 3.58 8 8Z"/></g>
    </DuoIcon>
  ),
  liveChat: (
    <DuoIcon>
      <g opacity="0.4"><path d="M12 2C7.58 2 4 5.58 4 10v4c0 1.1-.9 2-2 2v2c2.21 0 4-1.79 4-4v-4c0-3.31 2.69-6 6-6s6 2.69 6 6v4c0 2.21 1.79 4 4 4v-2c-1.1 0-2-.9-2-2v-4c0-4.42-3.58-8-8-8z"/></g>
      <g><rect x="5" y="12" width="4" height="6" rx="2"/><rect x="15" y="12" width="4" height="6" rx="2"/></g>
    </DuoIcon>
  ),
  bot: (
    <DuoIcon>
      <g opacity="0.4"><path d="M12 2a1 1 0 0 1 1 1v1h-2V3a1 1 0 0 1 1-1ZM3 11a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Zm18 0a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Z"/></g>
      <g><rect x="5" y="5" width="14" height="13" rx="3" ry="3"/><circle cx="9.5" cy="10.5" r="1.5" fill="white"/><circle cx="14.5" cy="10.5" r="1.5" fill="white"/><path d="M9 14.5c0-.28.22-.5.5-.5h5c.28 0 .5.22.5.5s-.22.5-.5.5h-5c-.28 0-.5-.22-.5-.5Z" fill="white"/></g>
    </DuoIcon>
  ),
  brain: (
    <DuoIcon>
      <g opacity="0.4"><path d="m10.11,3c-1.13,0-2.09.8-2.33,1.89h-.03c-1.58,0-2.86,1.28-2.86,2.86,0,.4.08.79.24,1.14-1.25.49-2.13,1.72-2.13,3.11,0,.99.43,1.91,1.18,2.55-.15.39-.23.81-.23,1.23,0,1.71,1.3,3.12,3,3.31.4,1.13,1.48,1.91,2.7,1.91.98,0,1.85-.49,2.36-1.25V3.93c-.44-.56-1.12-.93-1.89-.93Z"/></g>
      <g><path d="m18.87,8.89c.16-.36.24-.75.24-1.14,0-1.59-1.34-2.9-2.89-2.86-.23-1.08-1.19-1.89-2.34-1.89-.77,0-1.45.36-1.89.93v15.83c.52.75,1.38,1.25,2.36,1.25,1.22,0,2.3-.78,2.7-1.91,1.68-.17,3-1.59,3-3.32,0-.42-.08-.84-.23-1.23.74-.63,1.18-1.56,1.18-2.55,0-1.39-.88-2.62-2.13-3.11Z"/></g>
    </DuoIcon>
  ),
  palette: (
    <DuoIcon>
      <g opacity="0.4"><path d="m13.26,3.09c-2.83-.39-5.62.54-7.63,2.55-2.01,2.01-2.94,4.79-2.55,7.63.48,3.5,3.11,6.48,6.56,7.42.78.21,1.57.32,2.36.32.04,0,.08,0,.12,0,.82-.01,1.57-.44,2-1.14.43-.7.48-1.55.12-2.29l-.19-.39c-.53-1.1-.11-2.09.45-2.66.57-.57,1.56-.98,2.66-.45l.39.19c.74.36,1.59.31,2.29-.12s1.12-1.18,1.14-2c.01-.83-.09-1.66-.32-2.48-.93-3.45-3.92-6.08-7.42-6.56Z"/></g>
      <g><circle cx="7.4" cy="10.05" r="1.12"/><circle cx="10.2" cy="7.31" r="1.25"/><circle cx="7.33" cy="13.76" r="1"/><circle cx="14.27" cy="7.55" r="1.38"/></g>
    </DuoIcon>
  ),
  codeAlt: (
    <DuoIcon>
      <g opacity="0.4"><path d="m7.9,16.1c.1.1.23.15.35.15s.26-.05.35-.15c.2-.2.2-.51,0-.71l-3.4-3.4,3.4-3.4c.2-.2.2-.51,0-.71s-.51-.2-.71,0l-3.75,3.75c-.2.2-.2.51,0,.71l3.75,3.75Z"/><path d="m15.4,7.9c-.2.2-.2.51,0,.71l3.4,3.4-3.4,3.4c-.2.2-.2.51,0,.71.1.1.23.15.35.15s.26-.05.35-.15l3.75-3.75c.2-.2.2-.51,0-.71l-3.75-3.75c-.2-.2-.51-.2-.71,0Z"/></g>
      <g><path d="m10,19.98s.08.02.12.02c.22,0,.43-.15.49-.38l3.75-15c.07-.27-.1-.54-.36-.61-.27-.07-.54.1-.61.36l-3.75,15c-.07.27.1.54.36.61Z"/></g>
    </DuoIcon>
  ),
  users: (
    <DuoIcon>
      <g opacity="0.4"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></g>
      <g><circle cx="12" cy="7" r="4"/></g>
    </DuoIcon>
  ),
  account: (
    <DuoIcon>
      <g opacity="0.4"><path d="M12 14c-3.31 0-6 2.69-6 6v1h12v-1c0-3.31-2.69-6-6-6Z"/></g>
      <g><circle cx="12" cy="8" r="4"/></g>
    </DuoIcon>
  ),
  logout: (
    <DuoIcon>
      <g opacity="0.4"><path d="M5 5h6V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h6v-2H5V5Z"/></g>
      <g><path d="m20.5,12.5l-4,4v-3h-6v-2h6v-3l4,4Z"/></g>
    </DuoIcon>
  ),
};

// Structura meniului: sectiuni, fiecare cu linkurile ei
const menuItems = [
  {
    section: 'General',
    items: [
      { to: '/', label: 'Dashboard', icon: icons.dashboard },
      { to: '/knowledge', label: 'Bază de cunoștințe', icon: icons.bookContent },
      { to: '/quick-replies', label: 'Răspunsuri Rapide', icon: icons.bolt },
    ],
  },
  {
    section: 'Comunicare',
    items: [
      { to: '/conversations', label: 'Conversatii', badge: true, icon: icons.chat },
      { to: '/live-chat', label: 'Live Chat', icon: icons.liveChat },
      { to: '/reviews', label: 'Recenzii', icon: icons.star },
    ],
  },
  {
    section: 'Configurare',
    items: [
      { to: '/bots', label: 'Boții Mei', icon: icons.bot },
      { to: '/behavior', label: 'Comportament Bot', icon: icons.brain },
      { to: '/users', label: 'Utilizatori', icon: icons.users },
      { to: '/settings', label: 'Setări Widget', icon: icons.palette },
      { to: '/integration', label: 'Integrare', icon: icons.codeAlt },
    ],
  },
];

// Meniul lateral cu sectiunile panoului; arata numarul de conversatii ale botului selectat si se poate restrange
export default function Sidebar({ collapsed, setCollapsed }) {
  const { selectedBotId } = useBot();

  // Numarul total de conversatii afisat in meniu
  const [convCount, setConvCount] = useState(0);

  // Numarul de conversatii se reincarca cand se schimba botul selectat
  useEffect(() => {
    getStats(selectedBotId).then((res) => setConvCount(res.data.total_conversations)).catch(() => {});
  }, [selectedBotId]);

  // Meniul este fix pe stanga si isi schimba latimea cand este restrans
  return (
    <nav className={`${collapsed ? 'w-[72px]' : 'w-[226px]'} fixed z-50 flex-none border-r border-gray-200/80 dark:border-gray-800/60 transition-all duration-300 bg-white dark:bg-dark h-full`}>
      <div className="h-full flex flex-col">

        {/* Logo */}
        <div className="px-3.5 pt-4 pb-2">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-1'}`}>
            {/* Varianta pentru tema luminoasa */}
            <div className="flex dark:hidden items-center justify-center flex-shrink-0"
              style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#2563eb', boxShadow: '4px 4px 0 #1e40af' }}>
              <svg width="29" height="29" viewBox="0 0 40 40" fill="none">
                <path d="M8 12C8 9 10 7 13 7H23C26 7 28 9 28 12V15C28 18 26 20 23 20H15L11 24V20H10C8 20 8 18 8 18V12Z"
                  stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M14 20V22C14 25 16 27 19 27H27L31 31V27H30C32 27 34 25 34 22V18C34 15 32 13 29 13H28"
                  stroke="white" strokeWidth="2.5" strokeOpacity="0.45" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Varianta pentru tema intunecata */}
            <div className="hidden dark:flex items-center justify-center flex-shrink-0"
              style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '4px 4px 0 rgba(0,0,0,0.25)' }}>
              <svg width="29" height="29" viewBox="0 0 40 40" fill="none">
                <path d="M8 12C8 9 10 7 13 7H23C26 7 28 9 28 12V15C28 18 26 20 23 20H15L11 24V20H10C8 20 8 18 8 18V12Z"
                  stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M14 20V22C14 25 16 27 19 27H27L31 31V27H30C32 27 34 25 34 22V18C34 15 32 13 29 13H28"
                  stroke="white" strokeWidth="2.5" strokeOpacity="0.45" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Titlul sectiunii apare doar cand meniul este extins */}
            {!collapsed && (
              <span className="text-gray-900 dark:text-white"
                style={{ fontFamily: "'Figtree', sans-serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.6px' }}>
                Chatingo
              </span>
            )}
          </div>
        </div>

        {/* Butonul de restrangere a meniului */}
        <div className="flex items-center gap-2.5 py-2 pe-3">
          <div className="h-px bg-gray-100 dark:bg-gray-800/60 flex-1" />
          <button onClick={() => setCollapsed(!collapsed)} className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-primary duration-200">
            <svg className={`w-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 13 12" fill="none">
              <path opacity="0.2" d="M5.46133 6.00002L11.1623 12L12.4613 10.633L8.05922 6.00002L12.4613 1.36702L11.1623 0L5.46133 6.00002Z" fill="currentColor"/>
              <path d="M0 6.00002L5.70101 12L7 10.633L2.59782 6.00002L7 1.36702L5.70101 0L0 6.00002Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Navigarea */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-0.5 pb-4 space-y-5">
          {/* Fiecare sectiune a meniului, cu titlu si linkuri */}
          {menuItems.map((group) => (
            <div key={group.section}>
              {/* Eticheta si insigna apar doar cand meniul este extins */}
              {!collapsed && (
                <h2 className="pt-1 pb-1.5 text-gray-400 dark:text-gray-500 text-[10px] font-semibold uppercase tracking-widest px-2.5">{group.section}</h2>
              )}
              {/* Meniul restrans foloseste o linie in locul titlului */}
              {collapsed && <div className="h-px bg-gray-100 dark:bg-gray-800/40 mx-2 mb-2" />}
              <div className="flex flex-col gap-0.5">
                {/* Linkurile sectiunii; cel activ este evidentiat */}
                {group.items.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `group flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-2.5'} py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-800/70 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-800 dark:hover:text-gray-200'
                      }`
                    }
                    title={collapsed ? link.label : undefined}
                  >
                    {({ isActive }) => null}
                    <span className={`flex-shrink-0 transition-all duration-150 rounded-md p-1 -m-1 ${
                      false ? 'bg-primary/15' : ''
                    }`}>{link.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{link.label}</span>
                        {link.badge && convCount > 0 && (
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {convCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </nav>
  );
}

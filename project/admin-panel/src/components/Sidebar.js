import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getStats } from '../api';

const menuItems = [
  {
    section: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.3" d="M10.8939 22H13.1061C16.5526 22 18.2759 22 19.451 20.9882C20.626 19.9764 20.8697 18.2827 21.3572 14.8952L21.6359 12.9579C22.0154 10.3208 22.2051 9.00229 21.6646 7.87495C21.1242 6.7476 19.9738 6.06234 17.6731 4.69182L16.2882 3.86687C14.199 2.62229 13.1543 2 12 2C10.8457 2 9.80104 2.62229 7.71175 3.86687L6.32691 4.69181C4.02619 6.06234 2.87583 6.7476 2.33537 7.87495C1.79491 9.00229 1.98463 10.3208 2.36407 12.9579L2.64284 14.8952C3.13025 18.2827 3.37396 19.9764 4.54903 20.9882C5.72409 22 7.44737 22 10.8939 22Z" fill="currentColor"/>
          <path d="M9.44666 15.397C9.11389 15.1504 8.64418 15.2202 8.39752 15.5529C8.15086 15.8857 8.22067 16.3554 8.55343 16.6021C9.52585 17.3229 10.7151 17.7496 12 17.7496C13.285 17.7496 14.4742 17.3229 15.4467 16.6021C15.7794 16.3554 15.8492 15.8857 15.6026 15.5529C15.3559 15.2202 14.8862 15.1504 14.5534 15.397C13.8251 15.9369 12.9459 16.2496 12 16.2496C11.0541 16.2496 10.175 15.9369 9.44666 15.397Z" fill="currentColor"/>
        </svg>
      )},
      { to: '/knowledge', label: 'Knowledge Base', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.3" d="M21 18C21 18.5967 20.7629 19.169 20.341 19.591C19.919 20.0129 19.3467 20.25 18.75 20.25H8.25C8.84674 20.25 9.41903 20.0129 9.84099 19.591C10.2629 19.169 10.5 18.5967 10.5 18C10.5 17.0625 9.75 16.5 9.75 16.5H20.25C20.25 16.5 21 17.0625 21 18Z" fill="currentColor"/>
          <path d="M16.5 9.75C16.5 9.55109 16.421 9.36032 16.2803 9.21967C16.1397 9.07902 15.9489 9 15.75 9H9.75C9.55109 9 9.36032 9.07902 9.21967 9.21967C9.07902 9.36032 9 9.55109 9 9.75C9 9.94891 9.07902 10.1397 9.21967 10.2803C9.36032 10.421 9.55109 10.5 9.75 10.5H15.75C15.9489 10.5 16.1397 10.421 16.2803 10.2803C16.421 10.1397 16.5 9.94891 16.5 9.75ZM15.75 12H9.75C9.55109 12 9.36032 12.079 9.21967 12.2197C9.07902 12.3603 9 12.5511 9 12.75C9 12.9489 9.07902 13.1397 9.21967 13.2803C9.36032 13.421 9.55109 13.5 9.75 13.5H15.75C15.9489 13.5 16.1397 13.421 16.2803 13.2803C16.421 13.1397 16.5 12.9489 16.5 12.75C16.5 12.5511 16.421 12.3603 16.2803 12.2197C16.1397 12.079 15.9489 12 15.75 12Z" fill="currentColor"/>
        </svg>
      )},
    ],
  },
  {
    section: 'Apps',
    items: [
      { to: '/quick-replies', label: 'Raspunsuri Rapide', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.3" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" fill="currentColor"/>
          <path d="M13 6.75L7 12H10.25V17.25L16.25 12H13V6.75Z" fill="currentColor"/>
        </svg>
      )},
      { to: '/reviews', label: 'Recenzii', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.3" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" opacity="0.6"/>
        </svg>
      )},
      { to: '/conversations', label: 'Conversatii', badge: true, icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M18 14C18 18.4183 14.4183 22 10 22C8.76449 22 7.5944 21.7199 6.54976 21.2198C6.19071 21.0479 5.78393 20.9876 5.39939 21.0904L4.17335 21.4185C3.20701 21.677 2.32295 20.793 2.58151 19.8267L2.90955 18.6006C3.01245 18.2161 2.95209 17.8093 2.7802 17.4502C2.28008 16.4056 2 15.2355 2 14C2 9.58172 5.58172 6 10 6C14.4183 6 18 9.58172 18 14Z" fill="currentColor"/>
          <path opacity="0.3" d="M17.9841 14.5084C18.092 14.4638 18.1985 14.4163 18.3033 14.3661C18.5951 14.2264 18.9256 14.1774 19.238 14.261L20.2342 14.5275C21.0193 14.7376 21.7376 14.0193 21.5275 13.2342L21.261 12.238C21.1774 11.9256 21.2264 11.595 21.3661 11.3033C21.7725 10.4545 22 9.50385 22 8.5C22 4.91015 19.0899 2 15.5 2C12.79 2 10.4673 3.6585 9.49158 6.0159C9.6597 6.00535 9.82924 6 10 6C14.4183 6 18 9.58172 18 14C18 14.1708 17.9947 14.3403 17.9841 14.5084Z" fill="currentColor"/>
        </svg>
      )},
    ],
  },
  {
    section: 'Settings',
    items: [
      { to: '/settings', label: 'Widget Config', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.3" fillRule="evenodd" clipRule="evenodd" d="M12 2C10.8954 2 9.89541 2.6007 7.89541 3.80211L7.21541 4.20846C5.21541 5.40987 4.21541 6.01057 3.65541 7C3.09541 7.98943 3.09541 9.19084 3.09541 11.5937V12.4063C3.09541 14.8092 3.09541 16.0106 3.65541 17C4.21541 17.9894 5.21541 18.5901 7.21541 19.7915L7.89541 20.1979C9.89541 21.3993 10.8954 22 12 22C13.1046 22 14.1046 21.3993 16.1046 20.1979L16.7846 19.7915C18.7846 18.5901 19.7846 17.9894 20.3446 17C20.9046 16.0106 20.9046 14.8092 20.9046 12.4063V11.5937C20.9046 9.19084 20.9046 7.98943 20.3446 7C19.7846 6.01057 18.7846 5.40987 16.7846 4.20846L16.1046 3.80211C14.1046 2.6007 13.1046 2 12 2Z" fill="currentColor"/>
          <path d="M12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25Z" fill="currentColor"/>
        </svg>
      )},
      { to: '/integration', label: 'Integration', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.3" d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z" fill="currentColor"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M7.25 12C7.25 11.5858 7.58579 11.25 8 11.25H16C16.4142 11.25 16.75 11.5858 16.75 12C16.75 12.4142 16.4142 12.75 16 12.75H8C7.58579 12.75 7.25 12.4142 7.25 12Z" fill="currentColor"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M7.25 8C7.25 7.58579 7.58579 7.25 8 7.25H16C16.4142 7.25 16.75 7.58579 16.75 8C16.75 8.41421 16.4142 8.75 16 8.75H8C7.58579 8.75 7.25 8.41421 7.25 8Z" fill="currentColor"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M7.25 16C7.25 15.5858 7.58579 15.25 8 15.25H13C13.4142 15.25 13.75 15.5858 13.75 16C13.75 16.4142 13.4142 16.75 13 16.75H8C7.58579 16.75 7.25 16.4142 7.25 16Z" fill="currentColor"/>
        </svg>
      )},
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const [convCount, setConvCount] = useState(0);

  useEffect(() => {
    getStats().then((res) => setConvCount(res.data.total_conversations)).catch(() => {});
  }, []);

  return (
    <nav className={`${collapsed ? 'w-[72px]' : 'w-[226px]'} fixed z-50 flex-none border-r-2 border-gray-100 dark:border-gray-800/50 transition-all duration-300 bg-white dark:bg-dark h-full`}>
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="p-3.5">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-1'}`}>
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            {!collapsed && <span className="text-base font-bold text-gray-900 dark:text-white">ChatBot</span>}
          </div>
        </div>

        {/* Toggle line */}
        <div className="flex items-center gap-2.5 py-2.5 pe-2.5">
          <div className="h-[2px] bg-gray-100 dark:bg-gray-800 flex-1" />
          <button onClick={() => setCollapsed(!collapsed)} className="shrink-0 text-gray-400 hover:text-primary duration-300">
            <svg className={`w-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 13 12" fill="none">
              <path opacity="0.2" d="M5.46133 6.00002L11.1623 12L12.4613 10.633L8.05922 6.00002L12.4613 1.36702L11.1623 0L5.46133 6.00002Z" fill="currentColor"/>
              <path d="M0 6.00002L5.70101 12L7 10.633L2.59782 6.00002L7 1.36702L5.70101 0L0 6.00002Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-1 pb-4 space-y-4">
          {menuItems.map((group) => (
            <div key={group.section}>
              {!collapsed && (
                <h2 className="pt-2 pb-2 text-gray-400 text-[11px] font-semibold uppercase tracking-wider px-2">{group.section}</h2>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `nav-link group flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-2.5'} py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-lighter hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                    title={collapsed ? link.label : undefined}
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
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

        {/* Version footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50">
            <p className="text-[10px] text-gray-400">ChatBot Admin v1.0</p>
          </div>
        )}
      </div>
    </nav>
  );
}

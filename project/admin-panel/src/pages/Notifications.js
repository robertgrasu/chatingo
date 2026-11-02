import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { useNotifications } from '../NotificationContext';

function timeAgo(ts) {
  // ts here is already a timestamp number from NotificationContext
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'Chiar acum';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute in urma`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ore in urma`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} zile in urma`;
  return new Date(ts).toLocaleDateString('ro-RO');
}

// Ensure UTC dates from backend are parsed correctly
function toUTC(s) { return s && !String(s).endsWith('Z') && !String(s).includes('+') ? s + 'Z' : s; }

const NOTIF_ICONS = {
  conversation: {
    bg: 'bg-primary/10',
    color: 'text-primary',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  feedback: {
    bg: 'bg-purple/10',
    color: 'text-purple',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
  },
  document: {
    bg: 'bg-emerald-500/10',
    color: 'text-emerald-500',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  system: {
    bg: 'bg-amber-500/10',
    color: 'text-amber-500',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const TYPE_ROUTES = {
  conversation: '/conversations',
  feedback: '/reviews',
  document: '/knowledge',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { notifications, unreadCount, markAsRead, markAllRead: markAllReadCtx, deleteNotif, clearAll: clearAllCtx } = useNotifications();
  const [filter, setFilter] = useState('all');

  const handleMarkAllRead = () => {
    markAllReadCtx();
    addToast('Toate notificarile au fost marcate ca citite.', 'success');
  };

  const handleClearAll = () => {
    clearAllCtx();
    addToast('Toate notificarile au fost sterse.', 'success');
  };

  const filtered = notifications
    .filter((n) => {
      if (filter === 'unread') return !n.read;
      if (filter === 'read') return n.read;
      return true;
    })
    .sort((a, b) => b.time - a.time);

  const filters = [
    { key: 'all', label: 'Toate', count: notifications.length },
    { key: 'unread', label: 'Necitite', count: unreadCount },
    { key: 'read', label: 'Citite', count: notifications.length - unreadCount },
  ];

  return (
    <div className="animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Notificari</h1>
          <p className="text-xs text-gray-400 mt-0.5">{unreadCount} necitite</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
            >
              Citeste toate
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-dark-lighter dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sterge toate
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-0.5 mb-4 bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-lg p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              filter === f.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-lighter'
            }`}
          >
            {f.label}
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center ${
              filter === f.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 dark:bg-dark-lighter text-gray-400'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Nicio notificare</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'unread' ? 'Nu ai notificari necitite.' : filter === 'read' ? 'Nu ai notificari citite.' : 'Lista de notificari este goala.'}
            </p>
          </div>
        ) : (
          filtered.map((notif, i) => {
            const cfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0 group ${
                  notif.read
                    ? 'hover:bg-gray-50 dark:hover:bg-dark-lighter'
                    : 'bg-primary/[0.02] dark:bg-primary/[0.03] hover:bg-primary/[0.05] dark:hover:bg-primary/[0.06]'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <span className={cfg.color}>{cfg.icon}</span>
                </div>

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    markAsRead(notif.id);
                    const route = TYPE_ROUTES[notif.type];
                    if (route) navigate(route);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${notif.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{notif.desc}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[10px] text-gray-300 dark:text-gray-600">{timeAgo(notif.time)}</p>
                    {TYPE_ROUTES[notif.type] && (
                      <span className="text-[10px] text-primary font-medium">Vezi &rarr;</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Marcheaza ca citit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(notif.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Sterge"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

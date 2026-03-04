import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getNotifications, markNotificationsRead, deleteNotification as apiDeleteNotif, clearNotifications } from './api';
import { useBot } from './BotContext';

const NotificationContext = createContext();

const POLL_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }) {
  const { selectedBotId } = useBot();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!selectedBotId) return;
    try {
      if (!silent) setLoading(true);
      const res = await getNotifications({ bot_id: selectedBotId });
      const data = res.data;
      setNotifications(
        data.items.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          desc: n.description,
          read: n.read,
          reference_id: n.reference_id,
          time: new Date(n.created_at).getTime(),
        }))
      );
      setUnreadCount(data.unread_count);
    } catch {
      // Silently fail - notifications are non-critical
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedBotId]);

  // Fetch on mount and when bot changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling
  useEffect(() => {
    pollRef.current = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationsRead({ id }, selectedBotId);
    } catch {
      fetchNotifications(true); // Revert on error
    }
  }, [selectedBotId, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markNotificationsRead({ all: true }, selectedBotId);
    } catch {
      fetchNotifications(true);
    }
  }, [selectedBotId, fetchNotifications]);

  const deleteNotif = useCallback(async (id) => {
    const was = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (was && !was.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiDeleteNotif(id);
    } catch {
      fetchNotifications(true);
    }
  }, [notifications, fetchNotifications]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await clearNotifications(selectedBotId);
    } catch {
      fetchNotifications(true);
    }
  }, [selectedBotId, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllRead, deleteNotif, clearAll, refresh: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

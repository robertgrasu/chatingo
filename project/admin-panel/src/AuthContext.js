import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Access token in memory only (not localStorage - prevents XSS theft)
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);
  const initCalledRef = useRef(false);

  // Refresh token in localStorage (revocable server-side on logout)
  const getRefreshToken = () => localStorage.getItem('refresh_token');
  const setRefreshToken = (token) => {
    if (token) localStorage.setItem('refresh_token', token);
    else localStorage.removeItem('refresh_token');
  };

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setRefreshToken(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  // Schedule token refresh 2 minutes before expiry (28 min)
  const scheduleRefresh = useCallback((token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Decode JWT to get exp (no verification needed client-side)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = (payload.exp * 1000) - Date.now() - 120000; // 2 min before
      if (expiresIn > 0) {
        refreshTimerRef.current = setTimeout(() => refreshAccessToken(), expiresIn);
      }
    } catch { /* ignore decode errors */ }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const rt = getRefreshToken();
    if (!rt) { clearAuth(); return null; }
    try {
      const res = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: rt });
      const { access_token, refresh_token } = res.data;
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      scheduleRefresh(access_token);
      return access_token;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth, scheduleRefresh]);

  // On mount: try to restore session from refresh token
  // Ref guard prevents React 18 StrictMode double-invoke race condition
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    const init = async () => {
      const rt = getRefreshToken();
      if (rt) {
        const token = await refreshAccessToken();
        if (token) {
          try {
            const res = await axios.get(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data);
          } catch { clearAuth(); }
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
    const { access_token, refresh_token } = res.data;
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    scheduleRefresh(access_token);

    const meRes = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    setUser(meRes.data);
    return meRes.data;
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch { /* ignore logout errors */ }
    clearAuth();
  };

  const changePassword = async (currentPassword, newPassword) => {
    await axios.put(`${API_URL}/api/auth/change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // After password change, force re-login
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      isAuthenticated: !!accessToken && !!user,
      login,
      logout,
      changePassword,
      refreshAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

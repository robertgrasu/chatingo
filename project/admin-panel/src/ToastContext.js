import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext();

let toastId = 0;

const typeConfig = {
  success: {
    border: 'border-l-emerald-500',
    icon: 'text-emerald-500',
    iconPath: 'M5 13l4 4L19 7',
  },
  error: {
    border: 'border-l-red-500',
    icon: 'text-red-500',
    iconPath: 'M6 18L18 6M6 6l12 12',
  },
  info: {
    border: 'border-l-blue-500',
    icon: 'text-blue-500',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

function ToastItem({ toast, onClose }) {
  const config = typeConfig[toast.type] || typeConfig.info;
  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 border-l-4 ${config.border} bg-white dark:bg-dark-light shadow-lg min-w-[320px] max-w-[420px] ${
        toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
      }`}
    >
      <svg className={`w-5 h-5 flex-shrink-0 ${config.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.iconPath} />
      </svg>
      <p className="text-sm text-gray-800 dark:text-gray-200 flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

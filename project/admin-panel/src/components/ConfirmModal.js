import React from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirma actiunea',
  message = 'Esti sigur ca vrei sa continui?',
  confirmText = 'Sterge',
  variant = 'danger',
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-light rounded-xl w-full max-w-md shadow-2xl animate-scale-in border-2 border-gray-100 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            variant === 'danger' ? 'bg-red-100 dark:bg-red-500/10' : 'bg-primary/10 dark:bg-primary/10'
          }`}>
            <svg className={`w-6 h-6 ${
              variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-primary'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={variant === 'danger'
                  ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                  : 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                }
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dark/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 text-gray-700 dark:text-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            Anuleaza
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20'
                : 'bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

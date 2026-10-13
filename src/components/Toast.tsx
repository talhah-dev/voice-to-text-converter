'use client';

import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgStyles = {
    success: 'bg-zinc-900 text-white border-zinc-700 shadow-xl',
    error: 'bg-red-950 text-red-200 border-red-800 shadow-xl',
    info: 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-xl',
  }[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${bgStyles}`}
      role="status"
      aria-live="polite"
    >
      {type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
      {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
      {type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
      
      <span className="pr-1">{message}</span>
      
      <button
        onClick={onClose}
        className="ml-2 p-1 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

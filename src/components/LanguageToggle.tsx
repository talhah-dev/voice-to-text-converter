'use client';

import React from 'react';
import { LanguageMode } from '@/types';

interface LanguageToggleProps {
  mode: LanguageMode;
  onChange: (mode: LanguageMode) => void;
  disabled?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  mode,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex justify-center">
      <div className="inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onChange('english')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'english'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          English
        </button>

        <button
          type="button"
          onClick={() => onChange('urdu')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'urdu'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Urdu
        </button>

        <button
          type="button"
          onClick={() => onChange('original')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'original'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Original
        </button>
      </div>
    </div>
  );
};

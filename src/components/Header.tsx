'use client';

import React from 'react';
import { Mic, Settings, KeyRound } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  hasCustomKey: boolean;
  activeProvider: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  hasCustomKey,
  activeProvider,
}) => {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-sm">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                VoiceScribe
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium tracking-wider">
                Multi-Voice
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasCustomKey
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
            }`}
            title="Configure AI API Key (Groq / OpenAI / Gemini)"
          >
            {hasCustomKey ? (
              <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Settings className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {hasCustomKey ? `${activeProvider.toUpperCase()} Active` : 'Settings / API Key'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

'use client';

import React from 'react';
import { Mic, Video } from 'lucide-react';
import { MediaTab } from '@/types';

interface MediaTabToggleProps {
  activeTab: MediaTab;
  onChange: (tab: MediaTab) => void;
  disabled?: boolean;
}

export const MediaTabToggle: React.FC<MediaTabToggleProps> = ({
  activeTab,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex justify-center">
      <div className="inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onChange('audio')}
          disabled={disabled}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'audio'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Mic className="w-4 h-4 text-blue-500" />
          <span>Audio</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('video')}
          disabled={disabled}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'video'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Video className="w-4 h-4 text-rose-500" />
          <span>Video</span>
        </button>
      </div>
    </div>
  );
};


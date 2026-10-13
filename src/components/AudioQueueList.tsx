'use client';

import React from 'react';
import { AudioItem } from '@/types';
import { Trash2, Music, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface AudioQueueListProps {
  items: AudioItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onTranscribeAll: () => void;
  isProcessing: boolean;
}

export const AudioQueueList: React.FC<AudioQueueListProps> = ({
  items,
  onRemoveItem,
  onClearAll,
  onTranscribeAll,
  isProcessing,
}) => {
  if (items.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const completedCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Selected Audio Files
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
            {items.length} {items.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          disabled={isProcessing}
          className="text-xs text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors disabled:opacity-40"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                Voice {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>{formatFileSize(item.size)}</span>
                  {item.status === 'processing' && (
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-3 h-3 animate-spin" /> Converting...
                    </span>
                  )}
                  {item.status === 'done' && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Transcribed
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-rose-500">
                      <AlertCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Audio player preview & remove */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <audio
                controls
                src={item.audioUrl}
                className="h-8 w-44 sm:w-52 max-w-full accent-zinc-900 dark:accent-zinc-100"
                preload="metadata"
              />
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                disabled={isProcessing && item.status === 'processing'}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-40"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onTranscribeAll}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transcribing Voices...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {completedCount > 0
                  ? `Re-transcribe All (${items.length} ${items.length === 1 ? 'Voice' : 'Voices'})`
                  : `Convert ${items.length} ${items.length === 1 ? 'Voice' : 'Voices'} to Text`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

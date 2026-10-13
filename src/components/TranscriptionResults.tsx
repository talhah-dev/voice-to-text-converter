'use client';

import React, { useState } from 'react';
import { AudioItem } from '@/types';
import { Copy, Check, Download, FileText, Sparkles, AlertCircle } from 'lucide-react';

interface TranscriptionResultsProps {
  items: AudioItem[];
  onTriggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenSettings?: () => void;
}

export const TranscriptionResults: React.FC<TranscriptionResultsProps> = ({
  items,
  onTriggerToast,
  onOpenSettings,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const doneItems = items.filter((item) => item.status === 'done' && item.transcription);

  if (doneItems.length === 0) return null;

  // Format all voices combined with clear headings and 2-line gaps
  const getFormattedAllText = () => {
    return doneItems
      .map((item, index) => {
        const header = `Voice ${index + 1}: ${item.name}`;
        return `${header}\n${item.transcription}`;
      })
      .join('\n\n\n'); // Generous separation gap between voices
  };

  const handleCopyAll = async () => {
    const fullText = getFormattedAllText();
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      onTriggerToast(`Copied all ${doneItems.length} transcriptions to clipboard!`, 'success');
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      onTriggerToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleCopySingle = async (item: AudioItem, index: number) => {
    if (!item.transcription) return;
    const textToCopy = `Voice ${index + 1}: ${item.name}\n${item.transcription}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(item.id);
      onTriggerToast(`Copied Voice ${index + 1} to clipboard!`, 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onTriggerToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownloadTxt = () => {
    const fullText = getFormattedAllText();
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voice-transcriptions-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onTriggerToast('Downloaded transcriptions as text file', 'info');
  };

  return (
    <section className="w-full mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      {/* Results Header with "Copy All at Once" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Transcriptions
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200/50 dark:border-emerald-800/50">
              {doneItems.length} Ready
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Download TXT */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
            title="Download all as .txt file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* COPY ALL AT ONCE BUTTON */}
          <button
            type="button"
            onClick={handleCopyAll}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              copiedAll
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied All ({doneItems.length})</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy All at Once</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* List of distinct voice transcription cards separated with comfortable gaps */}
      <div className="space-y-6">
        {doneItems.map((item, index) => {
          const isCopied = copiedId === item.id;
          const isDemo = item.transcription?.startsWith('[Demo');

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 sm:p-6 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col gap-3.5"
            >
              {/* Voice Card Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono tracking-wide shadow-2xs">
                    Voice {index + 1}
                  </span>
                  
                  <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">
                    {item.name}
                  </span>

                  {item.modeUsed && (
                    <span className="hidden md:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {item.modeUsed === 'english'
                        ? 'English'
                        : item.modeUsed === 'urdu'
                        ? 'Urdu'
                        : 'Original'}
                    </span>
                  )}
                </div>

                {/* Individual Copy Button */}
                <button
                  type="button"
                  onClick={() => handleCopySingle(item, index)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                    isCopied
                      ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                  title={`Copy Voice ${index + 1}`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* The Text Content with RTL support for Urdu */}
              {(() => {
                const isUrduText =
                  item.modeUsed === 'urdu' ||
                  /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(item.transcription || '');
                return (
                  <div
                    dir={isUrduText ? 'rtl' : 'ltr'}
                    className={`text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal whitespace-pre-wrap select-text pl-1 ${
                      isUrduText
                        ? 'text-right text-base sm:text-lg leading-loose font-serif sm:font-sans'
                        : 'text-left text-sm sm:text-base'
                    }`}
                  >
                    {item.transcription}
                  </div>
                );
              })()}

              {/* Demo note if applicable */}
              {isDemo && (
                <div className="mt-2 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>Demo mode active. Add a free Groq or OpenAI key for live AI Whisper conversion.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-200 shrink-0"
                  >
                    Add API Key
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

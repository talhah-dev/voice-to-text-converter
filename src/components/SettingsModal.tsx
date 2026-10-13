'use client';

import React, { useState } from 'react';
import { X, KeyRound, ExternalLink, Check, Trash2, Cpu } from 'lucide-react';
import { AIProvider } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProvider;
  apiKey: string;
  onSave: (provider: AIProvider, key: string) => void;
  onClear: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  provider: initialProvider,
  apiKey: initialApiKey,
  onSave,
  onClear,
}) => {
  const [provider, setProvider] = useState<AIProvider>(initialProvider || 'groq');
  const [key, setKey] = useState<string>(initialApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(provider, key.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setKey('');
    onClear();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
            <Cpu className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            AI Engine & API Keys
          </h2>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          Configure an AI provider for real-time transcription and English translation. Keys are stored locally in your browser.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Provider Select */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Select Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('groq')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                  provider === 'groq'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                Groq (Free)
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                  provider === 'openai'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                OpenAI
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                  provider === 'gemini'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                Gemini
              </button>
            </div>
          </div>

          {/* Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {provider === 'groq'
                  ? 'Groq API Key (gsk_...)'
                  : provider === 'openai'
                  ? 'OpenAI API Key (sk-...)'
                  : 'Gemini API Key (AIza...)'}
              </label>

              {provider === 'groq' && (
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Get free key</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={
                  provider === 'groq'
                    ? 'gsk_xxxxxxxxxxxxxxxxxxxx'
                    : provider === 'openai'
                    ? 'sk-proj-xxxxxxxxxxxxxxxx'
                    : 'AIzaSyxxxxxxxxxxxxxxxxx'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute right-3.5 top-3.5" />
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
              {provider === 'groq'
                ? 'Tip: Groq Whisper-large-v3 is ultra fast and free to use.'
                : 'Key is securely stored in your browser session.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {initialApiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove key</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

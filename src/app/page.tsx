'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { UploadZone } from '@/components/UploadZone';
import { AudioQueueList } from '@/components/AudioQueueList';
import { TranscriptionResults } from '@/components/TranscriptionResults';
import { RateLimitBadge, RateLimitData } from '@/components/RateLimitBadge';
import { Toast } from '@/components/Toast';
import { AudioItem, LanguageMode } from '@/types';
import {
  saveAudioItemsToStorage,
  loadAudioItemsFromStorage,
  clearAllAudioItemsFromStorage,
} from '@/lib/storage';

export default function Home() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('english');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rateLimitData, setRateLimitData] = useState<RateLimitData | null>(null);
  const isLoadedRef = useRef(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Load saved voices and transcriptions from persistent storage on mount
  useEffect(() => {
    loadAudioItemsFromStorage()
      .then((savedItems) => {
        if (savedItems.length > 0) {
          setItems(savedItems);
        }
      })
      .finally(() => {
        isLoadedRef.current = true;
      });
  }, []);

  // Save to persistent storage whenever items change (after initial load)
  useEffect(() => {
    if (isLoadedRef.current) {
      saveAudioItemsToStorage(items);
    }
  }, [items]);

  // Add multiple files to queue
  const handleFilesSelected = (newFiles: File[]) => {
    const newItems: AudioItem[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      audioUrl: URL.createObjectURL(file),
      status: 'idle',
      timestamp: Date.now(),
    }));

    setItems((prev) => [...prev, ...newItems]);
    showToast(
      `Added ${newFiles.length} ${newFiles.length === 1 ? 'audio file' : 'audio files'}`,
      'info'
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove?.audioUrl) {
        URL.revokeObjectURL(itemToRemove.audioUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
    });
    setItems([]);
    clearAllAudioItemsFromStorage();
    showToast('Cleared all voice notes and transcriptions', 'info');
  };

  // Process all files in queue
  const handleTranscribeAll = async () => {
    if (items.length === 0 || isProcessing) return;

    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'processing', error: undefined } : it))
      );

      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('mode', languageMode);

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to transcribe audio');
        }

        // Live update rate limit quota badge
        if (data.rateLimit) {
          setRateLimitData(data.rateLimit);
        }

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'done',
                  transcription: data.transcription,
                  detectedLanguage: data.detectedLanguage,
                  modeUsed: languageMode,
                }
              : it
          )
        );
      } catch (err: unknown) {
        const error = err as Error;
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'error',
                  error: error.message || 'Transcription failed',
                }
              : it
          )
        );
      }
    }

    setIsProcessing(false);
    showToast('Transcription finished!', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-6">
        {/* Top bar with real-time API Quota Badge */}
        <div className="flex items-center justify-end w-full">
          <RateLimitBadge initialData={rateLimitData} />
        </div>

        {/* Minimal Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Voice to Text
          </h1>
        </div>

        {/* Clean Language Mode Selector */}
        <LanguageToggle
          mode={languageMode}
          onChange={setLanguageMode}
          disabled={isProcessing}
        />

        {/* Upload Zone */}
        <UploadZone
          onFilesSelected={handleFilesSelected}
          disabled={isProcessing}
        />

        {/* Uploaded Audio Files Queue */}
        <AudioQueueList
          items={items}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
          onTranscribeAll={handleTranscribeAll}
          isProcessing={isProcessing}
        />

        {/* Results Section */}
        <TranscriptionResults
          items={items}
          onTriggerToast={showToast}
        />
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

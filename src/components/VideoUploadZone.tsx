'use client';

import React, { useRef, useState } from 'react';
import { Video, Loader2, Sparkles } from 'lucide-react';
import { extractAudioFromVideo } from '@/lib/audioExtractor';
import { AudioItem } from '@/types';

interface VideoUploadZoneProps {
  onVideoExtracted: (items: AudioItem[]) => void;
  disabled?: boolean;
}

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  onVideoExtracted,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentExtractingName, setCurrentExtractingName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isExtracting) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processVideoFiles = async (files: File[]) => {
    const videoFiles = files.filter(
      (file) =>
        file.type.startsWith('video/') ||
        /\.(mp4|mov|webm|mkv|avi|m4v|wmv|flv)$/i.test(file.name)
    );

    if (videoFiles.length === 0) return;

    setIsExtracting(true);
    const newItems: AudioItem[] = [];

    for (const videoFile of videoFiles) {
      setCurrentExtractingName(videoFile.name);
      try {
        const { audioFile, duration, extractedSize } = await extractAudioFromVideo(videoFile);
        const audioUrl = URL.createObjectURL(audioFile);

        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file: audioFile,
          name: `${videoFile.name}`,
          size: extractedSize || audioFile.size,
          audioUrl,
          duration,
          status: 'idle',
          timestamp: Date.now(),
          mediaType: 'video',
          originalVideoName: videoFile.name,
          originalVideoSize: videoFile.size,
        });
      } catch (err) {
        console.error('Failed to extract audio from video:', err);
      }
    }

    setIsExtracting(false);
    setCurrentExtractingName('');

    if (newItems.length > 0) {
      onVideoExtracted(newItems);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isExtracting) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processVideoFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processVideoFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isExtracting}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isExtracting && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragging
            ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 scale-[0.99]'
            : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20'
        } ${disabled || isExtracting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4 shadow-xs">
          {isExtracting ? (
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          ) : (
            <Video className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
          )}
        </div>

        {isExtracting ? (
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Extracting Audio from Video...</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs sm:max-w-md mx-auto">
              {currentExtractingName}
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Drop video files here, or <span className="text-blue-600 dark:text-blue-400 underline underline-offset-4">browse</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              MP4, MOV, WEBM, MKV, AVI
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Audio is automatically extracted in your browser and prepared for transcription
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


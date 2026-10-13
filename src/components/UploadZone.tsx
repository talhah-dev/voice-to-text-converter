'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Mic, Square, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('audio/') ||
        /\.(mp3|wav|m4a|aac|ogg|webm|flac|wma)$/i.test(file.name)
      );
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
      // Reset input value so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  // Live in-browser voice recording support
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File(
          [audioBlob],
          `voice-recording-${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`,
          { type: 'audio/webm' }
        );
        onFilesSelected([recordedFile]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or unavailable', err);
      alert('Microphone access was denied. Please allow audio permissions or upload files directly.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isRecording && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragging
            ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 scale-[0.99]'
            : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4 shadow-xs">
          {isRecording ? (
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          ) : (
            <UploadCloud className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
          )}
        </div>

        <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
          Drop voice files here, or <span className="text-blue-600 dark:text-blue-400 underline underline-offset-4">browse</span>
        </h3>
        
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          MP3, WAV, M4A, AAC, OGG, WEBM
        </p>

        {/* Quick Voice Record Option */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 pt-2"
        >
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-rose-500" />
              <span>Record Voice Note</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500 text-white animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Recording ({formatSeconds(recordingSeconds)}) — Click to Finish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

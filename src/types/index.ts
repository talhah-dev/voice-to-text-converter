export type LanguageMode = 'english' | 'urdu' | 'original';

export type MediaTab = 'audio' | 'video';

export type AIProvider = 'groq' | 'openai' | 'gemini';

export interface AudioItem {
  id: string;
  file: File;
  name: string;
  size: number;
  audioUrl: string;
  duration?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  transcription?: string;
  detectedLanguage?: string;
  modeUsed?: LanguageMode;
  error?: string;
  timestamp: number;
  mediaType?: 'audio' | 'video';
  originalVideoName?: string;
  originalVideoSize?: number;
  isExtractingAudio?: boolean;
}

export interface TranscribeRequestConfig {
  mode: LanguageMode;
  provider?: AIProvider;
  apiKey?: string;
}

export interface TranscribeApiResponse {
  success: boolean;
  transcription?: string;
  detectedLanguage?: string;
  provider?: string;
  error?: string;
  isDemo?: boolean;
}

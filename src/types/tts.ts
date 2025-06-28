/**
 * Text-to-Speech type definitions for ElevenLabs integration
 */

export type VoiceId = 'rachel' | 'adam' | 'bella' | 'josh';

export interface TTSResponse {
  audioBlob: Blob;
  voiceId: VoiceId;
  text: string;
  cached: boolean;
}

export type TTSErrorCode = 
  | 'API_KEY_MISSING'
  | 'INVALID_INPUT'
  | 'INVALID_VOICE'
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'EMPTY_AUDIO'
  | 'PLAYBACK_ERROR'
  | 'UNKNOWN_ERROR';

export class TTSError extends Error {
  constructor(
    message: string,
    public code: TTSErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'TTSError';
  }
}

export interface TTSState {
  isGenerating: boolean;
  isPlaying: boolean;
  error: string | null;
  audioBlob: Blob | null;
  voiceId: VoiceId;
}
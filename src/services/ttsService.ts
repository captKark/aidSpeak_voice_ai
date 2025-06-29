import { VoiceId, TTSResponse, TTSError } from '../types/tts';
import { trackTTSEvent, Sentry } from '../lib/sentry';

/**
 * ElevenLabs Text-to-Speech Service
 * Provides high-quality voice synthesis for emergency report accessibility
 */
class TTSService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private timeout = 30000; // 30 seconds for audio generation
  private audioCache = new Map<string, Blob>(); // Session-based audio cache

  // High-quality natural voices optimized for emergency communication
  private voices: Record<VoiceId, { id: string; name: string; description: string }> = {
    'rachel': { 
      id: '21m00Tcm4TlvDq8ikWAM', 
      name: 'Rachel', 
      description: 'Clear, professional female voice' 
    },
    'adam': { 
      id: 'pNInz6obpgDQGcFmaJgB', 
      name: 'Adam', 
      description: 'Calm, authoritative male voice' 
    },
    'bella': { 
      id: 'EXAVITQu4vr4xnSDxMaL', 
      name: 'Bella', 
      description: 'Warm, reassuring female voice' 
    },
    'josh': { 
      id: 'TxGEqnHWrfWFTfGW9XjX', 
      name: 'Josh', 
      description: 'Professional, clear male voice' 
    }
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Text-to-Speech features will be disabled.');
    }
  }

  /**
   * Generate speech audio from text using ElevenLabs API
   */
  async generateSpeech(
    text: string, 
    voiceId: VoiceId = 'rachel',
    options: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    } = {}
  ): Promise<TTSResponse> {
    if (!this.apiKey) {
      throw new TTSError(
        'ElevenLabs API key not configured. Please add VITE_ELEVENLABS_API_KEY to your environment variables.',
        'API_KEY_MISSING'
      );
    }

    if (!text.trim()) {
      throw new TTSError('No text provided for speech generation.', 'INVALID_INPUT');
    }

    // Clean and prepare text for TTS
    const cleanText = this.prepareTextForTTS(text);
    
    // Check cache first
    const cacheKey = `${voiceId}-${cleanText}`;
    if (this.audioCache.has(cacheKey)) {
      const cachedAudio = this.audioCache.get(cacheKey)!;
      
      // Track cached TTS
      trackTTSEvent('generate', {
        voiceId,
        textLength: cleanText.length,
        cached: true,
      });
      
      return {
        audioBlob: cachedAudio,
        voiceId,
        text: cleanText,
        cached: true
      };
    }

    try {
      const voice = this.voices[voiceId];
      if (!voice) {
        throw new TTSError(`Voice '${voiceId}' not found.`, 'INVALID_VOICE');
      }

      // Track TTS generation start
      trackTTSEvent('generate', {
        voiceId,
        textLength: cleanText.length,
        cached: false,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Prepare request body with optimized settings for emergency communication
      const requestBody = {
        text: cleanText,
        model_id: 'eleven_multilingual_v2', // Best quality model
        voice_settings: {
          stability: options.stability ?? 0.75, // Balanced stability
          similarity_boost: options.similarity_boost ?? 0.85, // High similarity
          style: options.style ?? 0.2, // Slight style enhancement
          use_speaker_boost: options.use_speaker_boost ?? true // Enhanced clarity
        }
      };

      console.log(`Generating TTS audio for emergency report (${cleanText.length} characters)`);

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleAPIError(response);
      }

      const audioBlob = await response.blob();
      
      // Validate audio blob
      if (audioBlob.size === 0) {
        throw new TTSError('Generated audio is empty.', 'EMPTY_AUDIO');
      }

      // Cache the audio for this session
      this.audioCache.set(cacheKey, audioBlob);

      console.log(`✅ TTS audio generated successfully (${audioBlob.size} bytes)`);

      return {
        audioBlob,
        voiceId,
        text: cleanText,
        cached: false
      };

    } catch (error) {
      console.error('TTS generation failed:', error);
      
      // Track TTS error
      trackTTSEvent('error', {
        voiceId,
        textLength: cleanText.length,
        errorType: error instanceof TTSError ? error.code : 'unknown',
      });
      
      // Capture TTS error with Sentry
      Sentry.withScope((scope) => {
        scope.setTag('operation', 'tts_generation');
        scope.setTag('voice_id', voiceId);
        scope.setLevel('error');
        scope.setContext('tts', {
          voiceId,
          textLength: cleanText.length,
          cached: false,
        });
        Sentry.captureException(error);
      });
      
      if (error instanceof TTSError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TTSError(
            'Speech generation timed out. Please check your connection and try again.',
            'TIMEOUT'
          );
        }
        throw new TTSError(`Speech generation failed: ${error.message}`, 'UNKNOWN_ERROR');
      }
      
      throw new TTSError('Speech generation failed due to an unknown error.', 'UNKNOWN_ERROR');
    }
  }

  /**
   * Play audio blob using HTML5 Audio API
   */
  async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Track TTS play start
        trackTTSEvent('play', {
          cached: false, // We don't know if it was cached at this level
        });
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          
          // Track TTS play error
          trackTTSEvent('error', {
            errorType: 'playback_error',
          });
          
          reject(new TTSError('Audio playback failed.', 'PLAYBACK_ERROR'));
        };
        
        audio.oncanplaythrough = () => {
          audio.play().catch(reject);
        };
        
        audio.load();
      } catch (error) {
        // Track TTS play error
        trackTTSEvent('error', {
          errorType: 'audio_creation_error',
        });
        
        reject(new TTSError('Failed to create audio player.', 'PLAYBACK_ERROR'));
      }
    });
  }

  /**
   * Prepare text for optimal TTS output
   */
  private prepareTextForTTS(text: string): string {
    return text
      .trim()
      // Add pauses for better emergency communication clarity
      .replace(/\./g, '. ') // Pause after periods
      .replace(/,/g, ', ') // Pause after commas
      .replace(/:/g, ': ') // Pause after colons
      .replace(/;/g, '; ') // Pause after semicolons
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Handle API error responses
   */
  private async handleAPIError(response: Response): Promise<never> {
    let errorMessage = `TTS API error: ${response.status} ${response.statusText}`;
    let errorCode = 'API_ERROR';

    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }

    // Handle specific error codes
    switch (response.status) {
      case 400:
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Invalid text for speech generation. Please try again.';
        break;
      case 401:
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'TTS API access denied. Please check your API key.';
        break;
      case 403:
        errorCode = 'FORBIDDEN';
        errorMessage = 'TTS API access forbidden. Please verify your subscription.';
        break;
      case 429:
        errorCode = 'RATE_LIMITED';
        errorMessage = 'TTS service temporarily unavailable due to high demand. Please try again in a moment.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorCode = 'SERVER_ERROR';
        errorMessage = 'TTS service temporarily unavailable. Please try again.';
        break;
    }

    throw new TTSError(errorMessage, errorCode);
  }

  /**
   * Check if TTS service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    return Object.entries(this.voices).map(([id, voice]) => ({
      id: id as VoiceId,
      ...voice
    }));
  }

  /**
   * Clear audio cache (useful for memory management)
   */
  clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.audioCache.size;
  }
}

export const ttsService = new TTSService();
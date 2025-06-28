import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2, AlertCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { TTSState, TTSError, VoiceId } from '../types/tts';

interface TTSPlayerProps {
  text: string;
  voiceId?: VoiceId;
  className?: string;
  disabled?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
}

export default function TTSPlayer({ 
  text, 
  voiceId = 'rachel', 
  className = '',
  disabled = false,
  onPlayStart,
  onPlayEnd,
  onError
}: TTSPlayerProps) {
  const [ttsState, setTTSState] = useState<TTSState>({
    isGenerating: false,
    isPlaying: false,
    error: null,
    audioBlob: null,
    voiceId
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  // Preload audio when text changes
  useEffect(() => {
    if (text && text.trim() && ttsService.isAvailable()) {
      preloadAudio();
    }
  }, [text, voiceId]);

  const preloadAudio = async () => {
    if (!text.trim() || ttsState.isGenerating) return;

    try {
      setTTSState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null 
      }));

      const response = await ttsService.generateSpeech(text, voiceId);
      
      setTTSState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        audioBlob: response.audioBlob,
        error: null
      }));

      console.log(`TTS audio preloaded for emergency report (${response.cached ? 'cached' : 'generated'})`);
    } catch (error) {
      const errorMessage = error instanceof TTSError 
        ? error.message 
        : 'Failed to prepare audio. Please try again.';
      
      setTTSState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage 
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handlePlay = async () => {
    if (disabled || ttsState.isPlaying) return;

    try {
      let audioBlob = ttsState.audioBlob;

      // Generate audio if not already available
      if (!audioBlob) {
        setTTSState(prev => ({ 
          ...prev, 
          isGenerating: true, 
          error: null 
        }));

        const response = await ttsService.generateSpeech(text, voiceId);
        audioBlob = response.audioBlob;
        
        setTTSState(prev => ({ 
          ...prev, 
          audioBlob: response.audioBlob,
          isGenerating: false
        }));
      }

      // Clean up previous audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      // Create new audio URL and player
      audioUrlRef.current = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrlRef.current);

      setTTSState(prev => ({ ...prev, isPlaying: true, error: null }));

      if (onPlayStart) {
        onPlayStart();
      }

      // Set up audio event listeners
      audioRef.current.onended = () => {
        setTTSState(prev => ({ ...prev, isPlaying: false }));
        if (onPlayEnd) {
          onPlayEnd();
        }
      };

      audioRef.current.onerror = () => {
        const errorMsg = 'Audio playback failed. Please try again.';
        setTTSState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          error: errorMsg 
        }));
        if (onError) {
          onError(errorMsg);
        }
      };

      // Start playback
      await audioRef.current.play();

    } catch (error) {
      const errorMessage = error instanceof TTSError 
        ? error.message 
        : 'Failed to play audio. Please try again.';
      
      setTTSState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        isPlaying: false, 
        error: errorMessage 
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTTSState(prev => ({ ...prev, isPlaying: false }));
    if (onPlayEnd) {
      onPlayEnd();
    }
  };

  const handleRetry = () => {
    setTTSState(prev => ({ 
      ...prev, 
      error: null, 
      audioBlob: null 
    }));
    preloadAudio();
  };

  const getButtonContent = () => {
    if (ttsState.isGenerating) {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating audio...</span>
        </>
      );
    }

    if (ttsState.isPlaying) {
      return (
        <>
          <Pause className="w-5 h-5" />
          <span>Stop</span>
        </>
      );
    }

    if (ttsState.error) {
      return (
        <>
          <RotateCcw className="w-5 h-5" />
          <span>Retry</span>
        </>
      );
    }

    return (
      <>
        <Volume2 className="w-5 h-5" />
        <span>Listen</span>
      </>
    );
  };

  const getButtonClass = () => {
    const baseClass = `tts-button ${className}`;
    
    if (disabled || !ttsService.isAvailable()) {
      return `${baseClass} disabled`;
    }
    
    if (ttsState.error) {
      return `${baseClass} error`;
    }
    
    if (ttsState.isPlaying) {
      return `${baseClass} playing`;
    }
    
    if (ttsState.isGenerating) {
      return `${baseClass} generating`;
    }
    
    return `${baseClass} ready`;
  };

  const handleClick = () => {
    if (ttsState.error) {
      handleRetry();
    } else if (ttsState.isPlaying) {
      handleStop();
    } else {
      handlePlay();
    }
  };

  // Don't render if TTS is not available
  if (!ttsService.isAvailable()) {
    return (
      <div className="tts-unavailable">
        <div className="flex items-center space-x-2 text-gray-500">
          <VolumeX className="w-4 h-4" />
          <span className="text-sm">Audio playback unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tts-player">
      <button
        onClick={handleClick}
        disabled={disabled || ttsState.isGenerating}
        className={getButtonClass()}
        aria-label={
          ttsState.isPlaying 
            ? 'Stop listening to translated report'
            : 'Listen to translated report'
        }
      >
        {getButtonContent()}
      </button>

      {ttsState.error && (
        <div className="tts-error">
          <div className="flex items-start space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{ttsState.error}</span>
          </div>
        </div>
      )}

      {ttsState.audioBlob && !ttsState.error && (
        <div className="tts-info">
          <span className="text-xs text-green-600 font-medium">
            ✓ Audio ready for playback
          </span>
        </div>
      )}
    </div>
  );
}
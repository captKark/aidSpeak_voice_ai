import React from 'react';
import { Languages, CheckCircle, AlertCircle, Loader2, Globe } from 'lucide-react';
import { TranslationResult, TranslationStatus as TStatus } from '../types/emergency';

interface TranslationStatusProps {
  isTranslating: boolean;
  translationResult?: TranslationResult;
  originalText: string;
  error?: string;
  className?: string;
}

export default function TranslationStatus({ 
  isTranslating, 
  translationResult, 
  originalText, 
  error,
  className = '' 
}: TranslationStatusProps) {
  const getStatusIcon = () => {
    if (isTranslating) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
    
    if (error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (translationResult) {
      switch (translationResult.status) {
        case 'completed':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'not_required':
          return <Globe className="w-4 h-4 text-blue-600" />;
        case 'low_confidence':
          return <AlertCircle className="w-4 h-4 text-yellow-600" />;
        case 'failed':
          return <AlertCircle className="w-4 h-4 text-red-500" />;
        default:
          return <Languages className="w-4 h-4 text-gray-500" />;
      }
    }
    
    return <Languages className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isTranslating) {
      return 'Translating...';
    }
    
    if (error) {
      return 'Translation failed';
    }
    
    if (translationResult) {
      switch (translationResult.status) {
        case 'completed':
          return `Translated from ${getLanguageName(translationResult.sourceLanguage)}`;
        case 'not_required':
          return 'Already in English';
        case 'low_confidence':
          return `Translation uncertain (${getLanguageName(translationResult.sourceLanguage)})`;
        case 'failed':
          return 'Translation failed';
        default:
          return 'Translation pending';
      }
    }
    
    return 'Translation available';
  };

  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'hi': 'Hindi',
      'bn': 'Bengali',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'fr': 'French',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'de': 'German',
      'ja': 'Japanese',
      'ko': 'Korean',
      'it': 'Italian',
      'tr': 'Turkish',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish'
    };
    
    return languages[code] || code.toUpperCase();
  };

  const getBackgroundColor = () => {
    if (isTranslating) return 'bg-blue-50 border-blue-200';
    if (error) return 'bg-red-50 border-red-200';
    if (translationResult) {
      switch (translationResult.status) {
        case 'completed':
          return 'bg-green-50 border-green-200';
        case 'not_required':
          return 'bg-blue-50 border-blue-200';
        case 'low_confidence':
          return 'bg-yellow-50 border-yellow-200';
        case 'failed':
          return 'bg-red-50 border-red-200';
        default:
          return 'bg-gray-50 border-gray-200';
      }
    }
    return 'bg-gray-50 border-gray-200';
  };

  const getTextColor = () => {
    if (isTranslating) return 'text-blue-800';
    if (error) return 'text-red-800';
    if (translationResult) {
      switch (translationResult.status) {
        case 'completed':
          return 'text-green-800';
        case 'not_required':
          return 'text-blue-800';
        case 'low_confidence':
          return 'text-yellow-800';
        case 'failed':
          return 'text-red-800';
        default:
          return 'text-gray-800';
      }
    }
    return 'text-gray-800';
  };

  if (!isTranslating && !translationResult && !error) {
    return null;
  }

  return (
    <div className={`mt-4 p-4 border rounded-lg ${getBackgroundColor()} ${className}`}>
      {/* Status Header */}
      <div className="flex items-center space-x-2 mb-3">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getTextColor()}`}>
          {getStatusText()}
        </span>
        {translationResult && translationResult.confidence > 0 && (
          <span className="text-xs text-gray-500">
            ({Math.round(translationResult.confidence * 100)}% confidence)
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 mb-2">
          {error}
        </div>
      )}

      {/* Original Text */}
      {originalText && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Original:</p>
          <p className="text-sm text-gray-700 bg-white p-2 rounded border">
            {originalText}
          </p>
        </div>
      )}

      {/* Translated Text */}
      {translationResult && translationResult.status !== 'not_required' && translationResult.translatedText !== originalText && (
        <div>
          <p className="text-xs text-gray-500 mb-1">English Translation:</p>
          <p className="text-sm text-gray-800 bg-white p-2 rounded border font-medium">
            {translationResult.translatedText}
          </p>
        </div>
      )}

      {/* Low Confidence Warning */}
      {translationResult && translationResult.status === 'low_confidence' && (
        <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
          ⚠️ Translation confidence is low. The original message will be preserved for emergency responders.
        </div>
      )}
    </div>
  );
}
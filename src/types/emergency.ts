export type EmergencyType = 'medical' | 'fire' | 'natural-disaster' | 'crime' | 'accident' | 'other';

export type TranslationStatus = 'pending' | 'completed' | 'failed' | 'not_required' | 'low_confidence';

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  confidence: number;
  status: TranslationStatus;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  script?: string;
  isReliable: boolean;
}

export interface EnhancedDetectionResult {
  primary: LanguageDetectionResult;
  alternatives: LanguageDetectionResult[];
  textAnalysis: {
    length: number;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    scriptType: string;
    unicodeBlocks: string[];
  };
}

export interface EmergencyReport {
  id: string;
  audioBlob?: Blob;
  originalText: string;
  translatedText?: string;
  sourceLanguage?: string;
  translationStatus?: TranslationStatus;
  translationConfidence?: number;
  emergencyType: EmergencyType;
  locationData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: Date;
  confidence: number;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  countdown: number;
  duration: number;
  audioBlob?: Blob;
  transcription: string;
  confidence: number;
  error?: string;
  isTranslating?: boolean;
  translationResult?: TranslationResult;
}

// Comprehensive language database with script information
export const SUPPORTED_LANGUAGES = [
  // Latin Script Languages
  { code: 'en', name: 'English', script: 'Latin', family: 'Germanic' },
  { code: 'es', name: 'Spanish', script: 'Latin', family: 'Romance' },
  { code: 'fr', name: 'French', script: 'Latin', family: 'Romance' },
  { code: 'de', name: 'German', script: 'Latin', family: 'Germanic' },
  { code: 'it', name: 'Italian', script: 'Latin', family: 'Romance' },
  { code: 'pt', name: 'Portuguese', script: 'Latin', family: 'Romance' },
  { code: 'nl', name: 'Dutch', script: 'Latin', family: 'Germanic' },
  { code: 'sv', name: 'Swedish', script: 'Latin', family: 'Germanic' },
  { code: 'da', name: 'Danish', script: 'Latin', family: 'Germanic' },
  { code: 'no', name: 'Norwegian', script: 'Latin', family: 'Germanic' },
  { code: 'fi', name: 'Finnish', script: 'Latin', family: 'Finno-Ugric' },
  { code: 'pl', name: 'Polish', script: 'Latin', family: 'Slavic' },
  { code: 'cs', name: 'Czech', script: 'Latin', family: 'Slavic' },
  { code: 'sk', name: 'Slovak', script: 'Latin', family: 'Slavic' },
  { code: 'hu', name: 'Hungarian', script: 'Latin', family: 'Finno-Ugric' },
  { code: 'ro', name: 'Romanian', script: 'Latin', family: 'Romance' },
  { code: 'hr', name: 'Croatian', script: 'Latin', family: 'Slavic' },
  { code: 'sl', name: 'Slovenian', script: 'Latin', family: 'Slavic' },
  { code: 'et', name: 'Estonian', script: 'Latin', family: 'Finno-Ugric' },
  { code: 'lv', name: 'Latvian', script: 'Latin', family: 'Baltic' },
  { code: 'lt', name: 'Lithuanian', script: 'Latin', family: 'Baltic' },
  { code: 'tr', name: 'Turkish', script: 'Latin', family: 'Turkic' },
  { code: 'id', name: 'Indonesian', script: 'Latin', family: 'Austronesian' },
  { code: 'ms', name: 'Malay', script: 'Latin', family: 'Austronesian' },
  { code: 'vi', name: 'Vietnamese', script: 'Latin', family: 'Austroasiatic' },
  { code: 'sw', name: 'Swahili', script: 'Latin', family: 'Niger-Congo' },
  { code: 'af', name: 'Afrikaans', script: 'Latin', family: 'Germanic' },
  
  // Cyrillic Script Languages
  { code: 'ru', name: 'Russian', script: 'Cyrillic', family: 'Slavic' },
  { code: 'uk', name: 'Ukrainian', script: 'Cyrillic', family: 'Slavic' },
  { code: 'be', name: 'Belarusian', script: 'Cyrillic', family: 'Slavic' },
  { code: 'bg', name: 'Bulgarian', script: 'Cyrillic', family: 'Slavic' },
  { code: 'sr', name: 'Serbian', script: 'Cyrillic', family: 'Slavic' },
  { code: 'mk', name: 'Macedonian', script: 'Cyrillic', family: 'Slavic' },
  { code: 'mn', name: 'Mongolian', script: 'Cyrillic', family: 'Mongolic' },
  
  // Arabic Script Languages
  { code: 'ar', name: 'Arabic', script: 'Arabic', family: 'Semitic' },
  { code: 'fa', name: 'Persian', script: 'Arabic', family: 'Indo-Iranian' },
  { code: 'ur', name: 'Urdu', script: 'Arabic', family: 'Indo-Iranian' },
  { code: 'ps', name: 'Pashto', script: 'Arabic', family: 'Indo-Iranian' },
  { code: 'ku', name: 'Kurdish', script: 'Arabic', family: 'Indo-Iranian' },
  
  // Devanagari Script Languages
  { code: 'hi', name: 'Hindi', script: 'Devanagari', family: 'Indo-Iranian' },
  { code: 'ne', name: 'Nepali', script: 'Devanagari', family: 'Indo-Iranian' },
  { code: 'mr', name: 'Marathi', script: 'Devanagari', family: 'Indo-Iranian' },
  
  // Bengali Script Languages
  { code: 'bn', name: 'Bengali', script: 'Bengali', family: 'Indo-Iranian' },
  { code: 'as', name: 'Assamese', script: 'Bengali', family: 'Indo-Iranian' },
  
  // Other Indic Scripts
  { code: 'gu', name: 'Gujarati', script: 'Gujarati', family: 'Indo-Iranian' },
  { code: 'pa', name: 'Punjabi', script: 'Gurmukhi', family: 'Indo-Iranian' },
  { code: 'ta', name: 'Tamil', script: 'Tamil', family: 'Dravidian' },
  { code: 'te', name: 'Telugu', script: 'Telugu', family: 'Dravidian' },
  { code: 'kn', name: 'Kannada', script: 'Kannada', family: 'Dravidian' },
  { code: 'ml', name: 'Malayalam', script: 'Malayalam', family: 'Dravidian' },
  { code: 'or', name: 'Odia', script: 'Odia', family: 'Indo-Iranian' },
  { code: 'si', name: 'Sinhala', script: 'Sinhala', family: 'Indo-Iranian' },
  
  // CJK Languages
  { code: 'zh', name: 'Chinese', script: 'Han', family: 'Sino-Tibetan' },
  { code: 'ja', name: 'Japanese', script: 'Mixed', family: 'Japonic' },
  { code: 'ko', name: 'Korean', script: 'Hangul', family: 'Koreanic' },
  
  // Other Scripts
  { code: 'th', name: 'Thai', script: 'Thai', family: 'Tai-Kadai' },
  { code: 'lo', name: 'Lao', script: 'Lao', family: 'Tai-Kadai' },
  { code: 'my', name: 'Myanmar', script: 'Myanmar', family: 'Sino-Tibetan' },
  { code: 'km', name: 'Khmer', script: 'Khmer', family: 'Austroasiatic' },
  { code: 'ka', name: 'Georgian', script: 'Georgian', family: 'Kartvelian' },
  { code: 'hy', name: 'Armenian', script: 'Armenian', family: 'Indo-European' },
  { code: 'he', name: 'Hebrew', script: 'Hebrew', family: 'Semitic' },
  { code: 'am', name: 'Amharic', script: 'Ethiopic', family: 'Semitic' }
];

// Priority languages for emergency scenarios
export const PRIORITY_LANGUAGES = [
  { code: 'en', name: 'English', script: 'Latin' },
  { code: 'es', name: 'Spanish', script: 'Latin' },
  { code: 'hi', name: 'Hindi', script: 'Devanagari' },
  { code: 'bn', name: 'Bengali', script: 'Bengali' },
  { code: 'zh', name: 'Chinese', script: 'Han' },
  { code: 'ar', name: 'Arabic', script: 'Arabic' },
  { code: 'fr', name: 'French', script: 'Latin' },
  { code: 'ru', name: 'Russian', script: 'Cyrillic' },
  { code: 'pt', name: 'Portuguese', script: 'Latin' },
  { code: 'de', name: 'German', script: 'Latin' },
  { code: 'ja', name: 'Japanese', script: 'Mixed' },
  { code: 'ko', name: 'Korean', script: 'Hangul' },
  { code: 'it', name: 'Italian', script: 'Latin' },
  { code: 'tr', name: 'Turkish', script: 'Latin' },
  { code: 'ur', name: 'Urdu', script: 'Arabic' },
  { code: 'fa', name: 'Persian', script: 'Arabic' },
  { code: 'th', name: 'Thai', script: 'Thai' },
  { code: 'vi', name: 'Vietnamese', script: 'Latin' },
  { code: 'ta', name: 'Tamil', script: 'Tamil' },
  { code: 'te', name: 'Telugu', script: 'Telugu' }
];
import { TranslationResult, TranslationStatus } from '../types/emergency';

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

interface GoogleDetectResponse {
  data: {
    detections: Array<Array<{
      language: string;
      confidence: number;
    }>>;
  };
}

interface LanguageDetectionResult {
  language: string;
  confidence: number;
  script?: string;
  isReliable: boolean;
}

interface EnhancedDetectionResult {
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

class TranslationService {
  private apiKey: string;
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2';
  private detectUrl = 'https://translation.googleapis.com/language/translate/v2/detect';
  private timeout = 15000;
  private confidenceThreshold = 0.85;
  
  // Enhanced language mappings with script information
  private languageDatabase = {
    // Latin Script Languages
    'en': { name: 'English', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'es': { name: 'Spanish', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'fr': { name: 'French', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'de': { name: 'German', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'it': { name: 'Italian', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'pt': { name: 'Portuguese', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'nl': { name: 'Dutch', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'sv': { name: 'Swedish', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'da': { name: 'Danish', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'no': { name: 'Norwegian', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'fi': { name: 'Finnish', script: 'Latin', family: 'Finno-Ugric', confidence: 0.95 },
    'pl': { name: 'Polish', script: 'Latin', family: 'Slavic', confidence: 0.95 },
    'cs': { name: 'Czech', script: 'Latin', family: 'Slavic', confidence: 0.95 },
    'sk': { name: 'Slovak', script: 'Latin', family: 'Slavic', confidence: 0.95 },
    'hu': { name: 'Hungarian', script: 'Latin', family: 'Finno-Ugric', confidence: 0.95 },
    'ro': { name: 'Romanian', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'hr': { name: 'Croatian', script: 'Latin', family: 'Slavic', confidence: 0.95 },
    'sl': { name: 'Slovenian', script: 'Latin', family: 'Slavic', confidence: 0.95 },
    'et': { name: 'Estonian', script: 'Latin', family: 'Finno-Ugric', confidence: 0.95 },
    'lv': { name: 'Latvian', script: 'Latin', family: 'Baltic', confidence: 0.95 },
    'lt': { name: 'Lithuanian', script: 'Latin', family: 'Baltic', confidence: 0.95 },
    'mt': { name: 'Maltese', script: 'Latin', family: 'Semitic', confidence: 0.95 },
    'ga': { name: 'Irish', script: 'Latin', family: 'Celtic', confidence: 0.95 },
    'cy': { name: 'Welsh', script: 'Latin', family: 'Celtic', confidence: 0.95 },
    'eu': { name: 'Basque', script: 'Latin', family: 'Isolate', confidence: 0.95 },
    'ca': { name: 'Catalan', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'gl': { name: 'Galician', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'is': { name: 'Icelandic', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'tr': { name: 'Turkish', script: 'Latin', family: 'Turkic', confidence: 0.95 },
    'az': { name: 'Azerbaijani', script: 'Latin', family: 'Turkic', confidence: 0.95 },
    'uz': { name: 'Uzbek', script: 'Latin', family: 'Turkic', confidence: 0.95 },
    'tk': { name: 'Turkmen', script: 'Latin', family: 'Turkic', confidence: 0.95 },
    'kk': { name: 'Kazakh', script: 'Latin', family: 'Turkic', confidence: 0.95 },
    'ky': { name: 'Kyrgyz', script: 'Latin', family: 'Turkic', confidence: 0.95 },
    'id': { name: 'Indonesian', script: 'Latin', family: 'Austronesian', confidence: 0.95 },
    'ms': { name: 'Malay', script: 'Latin', family: 'Austronesian', confidence: 0.95 },
    'tl': { name: 'Filipino', script: 'Latin', family: 'Austronesian', confidence: 0.95 },
    'vi': { name: 'Vietnamese', script: 'Latin', family: 'Austroasiatic', confidence: 0.95 },
    'sw': { name: 'Swahili', script: 'Latin', family: 'Niger-Congo', confidence: 0.95 },
    'zu': { name: 'Zulu', script: 'Latin', family: 'Niger-Congo', confidence: 0.95 },
    'xh': { name: 'Xhosa', script: 'Latin', family: 'Niger-Congo', confidence: 0.95 },
    'af': { name: 'Afrikaans', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    
    // Cyrillic Script Languages
    'ru': { name: 'Russian', script: 'Cyrillic', family: 'Slavic', confidence: 0.95 },
    'uk': { name: 'Ukrainian', script: 'Cyrillic', family: 'Slavic', confidence: 0.95 },
    'be': { name: 'Belarusian', script: 'Cyrillic', family: 'Slavic', confidence: 0.95 },
    'bg': { name: 'Bulgarian', script: 'Cyrillic', family: 'Slavic', confidence: 0.95 },
    'sr': { name: 'Serbian', script: 'Cyrillic', family: 'Slavic', confidence: 0.95 },
    'mk': { name: 'Macedonian', script: 'Cyrillic', family: 'Slavic', confidence: 0.95 },
    'mn': { name: 'Mongolian', script: 'Cyrillic', family: 'Mongolic', confidence: 0.95 },
    
    // Arabic Script Languages
    'ar': { name: 'Arabic', script: 'Arabic', family: 'Semitic', confidence: 0.95 },
    'fa': { name: 'Persian', script: 'Arabic', family: 'Indo-Iranian', confidence: 0.95 },
    'ur': { name: 'Urdu', script: 'Arabic', family: 'Indo-Iranian', confidence: 0.95 },
    'ps': { name: 'Pashto', script: 'Arabic', family: 'Indo-Iranian', confidence: 0.95 },
    'ku': { name: 'Kurdish', script: 'Arabic', family: 'Indo-Iranian', confidence: 0.95 },
    'sd': { name: 'Sindhi', script: 'Arabic', family: 'Indo-Iranian', confidence: 0.95 },
    
    // Devanagari Script Languages
    'hi': { name: 'Hindi', script: 'Devanagari', family: 'Indo-Iranian', confidence: 0.95 },
    'ne': { name: 'Nepali', script: 'Devanagari', family: 'Indo-Iranian', confidence: 0.95 },
    'mr': { name: 'Marathi', script: 'Devanagari', family: 'Indo-Iranian', confidence: 0.95 },
    'sa': { name: 'Sanskrit', script: 'Devanagari', family: 'Indo-Iranian', confidence: 0.95 },
    
    // Bengali Script Languages
    'bn': { name: 'Bengali', script: 'Bengali', family: 'Indo-Iranian', confidence: 0.95 },
    'as': { name: 'Assamese', script: 'Bengali', family: 'Indo-Iranian', confidence: 0.95 },
    
    // Other Indic Scripts
    'gu': { name: 'Gujarati', script: 'Gujarati', family: 'Indo-Iranian', confidence: 0.95 },
    'pa': { name: 'Punjabi', script: 'Gurmukhi', family: 'Indo-Iranian', confidence: 0.95 },
    'ta': { name: 'Tamil', script: 'Tamil', family: 'Dravidian', confidence: 0.95 },
    'te': { name: 'Telugu', script: 'Telugu', family: 'Dravidian', confidence: 0.95 },
    'kn': { name: 'Kannada', script: 'Kannada', family: 'Dravidian', confidence: 0.95 },
    'ml': { name: 'Malayalam', script: 'Malayalam', family: 'Dravidian', confidence: 0.95 },
    'or': { name: 'Odia', script: 'Odia', family: 'Indo-Iranian', confidence: 0.95 },
    'si': { name: 'Sinhala', script: 'Sinhala', family: 'Indo-Iranian', confidence: 0.95 },
    
    // CJK Languages
    'zh': { name: 'Chinese', script: 'Han', family: 'Sino-Tibetan', confidence: 0.95 },
    'ja': { name: 'Japanese', script: 'Mixed', family: 'Japonic', confidence: 0.95 },
    'ko': { name: 'Korean', script: 'Hangul', family: 'Koreanic', confidence: 0.95 },
    
    // Other Scripts
    'th': { name: 'Thai', script: 'Thai', family: 'Tai-Kadai', confidence: 0.95 },
    'lo': { name: 'Lao', script: 'Lao', family: 'Tai-Kadai', confidence: 0.95 },
    'my': { name: 'Myanmar', script: 'Myanmar', family: 'Sino-Tibetan', confidence: 0.95 },
    'km': { name: 'Khmer', script: 'Khmer', family: 'Austroasiatic', confidence: 0.95 },
    'ka': { name: 'Georgian', script: 'Georgian', family: 'Kartvelian', confidence: 0.95 },
    'hy': { name: 'Armenian', script: 'Armenian', family: 'Indo-European', confidence: 0.95 },
    'he': { name: 'Hebrew', script: 'Hebrew', family: 'Semitic', confidence: 0.95 },
    'yi': { name: 'Yiddish', script: 'Hebrew', family: 'Germanic', confidence: 0.95 },
    'am': { name: 'Amharic', script: 'Ethiopic', family: 'Semitic', confidence: 0.95 },
    'ti': { name: 'Tigrinya', script: 'Ethiopic', family: 'Semitic', confidence: 0.95 },
    
    // Additional Languages
    'sq': { name: 'Albanian', script: 'Latin', family: 'Indo-European', confidence: 0.95 },
    'bs': { name: 'Bosnian', script: 'Latin', family: 'Slavic', confidence: 0.95 },
    'lb': { name: 'Luxembourgish', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'fo': { name: 'Faroese', script: 'Latin', family: 'Germanic', confidence: 0.95 },
    'gd': { name: 'Scottish Gaelic', script: 'Latin', family: 'Celtic', confidence: 0.95 },
    'br': { name: 'Breton', script: 'Latin', family: 'Celtic', confidence: 0.95 },
    'co': { name: 'Corsican', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'sc': { name: 'Sardinian', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'rm': { name: 'Romansh', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'fur': { name: 'Friulian', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'lad': { name: 'Ladino', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'vec': { name: 'Venetian', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'nap': { name: 'Neapolitan', script: 'Latin', family: 'Romance', confidence: 0.95 },
    'scn': { name: 'Sicilian', script: 'Latin', family: 'Romance', confidence: 0.95 }
  };

  // Unicode block ranges for script detection
  private unicodeBlocks = {
    'Latin': [
      [0x0000, 0x007F], // Basic Latin
      [0x0080, 0x00FF], // Latin-1 Supplement
      [0x0100, 0x017F], // Latin Extended-A
      [0x0180, 0x024F], // Latin Extended-B
      [0x1E00, 0x1EFF], // Latin Extended Additional
      [0x2C60, 0x2C7F], // Latin Extended-C
      [0xA720, 0xA7FF]  // Latin Extended-D
    ],
    'Cyrillic': [
      [0x0400, 0x04FF], // Cyrillic
      [0x0500, 0x052F], // Cyrillic Supplement
      [0x2DE0, 0x2DFF], // Cyrillic Extended-A
      [0xA640, 0xA69F]  // Cyrillic Extended-B
    ],
    'Arabic': [
      [0x0600, 0x06FF], // Arabic
      [0x0750, 0x077F], // Arabic Supplement
      [0x08A0, 0x08FF], // Arabic Extended-A
      [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
      [0xFE70, 0xFEFF]  // Arabic Presentation Forms-B
    ],
    'Devanagari': [
      [0x0900, 0x097F], // Devanagari
      [0xA8E0, 0xA8FF]  // Devanagari Extended
    ],
    'Bengali': [
      [0x0980, 0x09FF]  // Bengali
    ],
    'Gujarati': [
      [0x0A80, 0x0AFF]  // Gujarati
    ],
    'Gurmukhi': [
      [0x0A00, 0x0A7F]  // Gurmukhi
    ],
    'Tamil': [
      [0x0B80, 0x0BFF]  // Tamil
    ],
    'Telugu': [
      [0x0C00, 0x0C7F]  // Telugu
    ],
    'Kannada': [
      [0x0C80, 0x0CFF]  // Kannada
    ],
    'Malayalam': [
      [0x0D00, 0x0D7F]  // Malayalam
    ],
    'Odia': [
      [0x0B00, 0x0B7F]  // Odia
    ],
    'Sinhala': [
      [0x0D80, 0x0DFF]  // Sinhala
    ],
    'Thai': [
      [0x0E00, 0x0E7F]  // Thai
    ],
    'Lao': [
      [0x0E80, 0x0EFF]  // Lao
    ],
    'Myanmar': [
      [0x1000, 0x109F]  // Myanmar
    ],
    'Khmer': [
      [0x1780, 0x17FF]  // Khmer
    ],
    'Georgian': [
      [0x10A0, 0x10FF], // Georgian
      [0x2D00, 0x2D2F]  // Georgian Supplement
    ],
    'Armenian': [
      [0x0530, 0x058F]  // Armenian
    ],
    'Hebrew': [
      [0x0590, 0x05FF], // Hebrew
      [0xFB1D, 0xFB4F]  // Hebrew Presentation Forms
    ],
    'Ethiopic': [
      [0x1200, 0x137F], // Ethiopic
      [0x1380, 0x139F], // Ethiopic Supplement
      [0x2D80, 0x2DDF]  // Ethiopic Extended
    ],
    'Han': [
      [0x4E00, 0x9FFF], // CJK Unified Ideographs
      [0x3400, 0x4DBF], // CJK Extension A
      [0x20000, 0x2A6DF], // CJK Extension B
      [0x2A700, 0x2B73F], // CJK Extension C
      [0x2B740, 0x2B81F], // CJK Extension D
      [0x2B820, 0x2CEAF]  // CJK Extension E
    ],
    'Hiragana': [
      [0x3040, 0x309F]  // Hiragana
    ],
    'Katakana': [
      [0x30A0, 0x30FF], // Katakana
      [0x31F0, 0x31FF]  // Katakana Phonetic Extensions
    ],
    'Hangul': [
      [0xAC00, 0xD7AF], // Hangul Syllables
      [0x1100, 0x11FF], // Hangul Jamo
      [0x3130, 0x318F], // Hangul Compatibility Jamo
      [0xA960, 0xA97F]  // Hangul Jamo Extended-A
    ]
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Translate API key not found. Language detection and translation features will be disabled.');
    }
  }

  /**
   * Analyze text to determine script types and Unicode blocks
   */
  private analyzeTextScript(text: string): {
    scriptType: string;
    unicodeBlocks: string[];
    confidence: number;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  } {
    const scriptCounts: Record<string, number> = {};
    const detectedBlocks: Set<string> = new Set();
    let totalChars = 0;
    let hasNumbers = false;
    let hasSpecialChars = false;

    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (!codePoint) continue;

      totalChars++;

      // Check for numbers
      if (/\d/.test(char)) {
        hasNumbers = true;
        continue;
      }

      // Check for special characters
      if (/[^\p{L}\p{N}\s]/u.test(char)) {
        hasSpecialChars = true;
      }

      // Skip whitespace and punctuation for script detection
      if (/\s/.test(char) || /\p{P}/u.test(char)) {
        continue;
      }

      // Detect Unicode blocks
      for (const [scriptName, ranges] of Object.entries(this.unicodeBlocks)) {
        for (const [start, end] of ranges) {
          if (codePoint >= start && codePoint <= end) {
            scriptCounts[scriptName] = (scriptCounts[scriptName] || 0) + 1;
            detectedBlocks.add(scriptName);
            break;
          }
        }
      }
    }

    // Determine primary script
    let primaryScript = 'Latin'; // Default
    let maxCount = 0;
    
    for (const [script, count] of Object.entries(scriptCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryScript = script;
      }
    }

    // Calculate confidence based on script consistency
    const confidence = totalChars > 0 ? maxCount / totalChars : 0;

    return {
      scriptType: primaryScript,
      unicodeBlocks: Array.from(detectedBlocks),
      confidence: Math.min(confidence, 1.0),
      hasNumbers,
      hasSpecialChars
    };
  }

  /**
   * Enhanced language detection with script analysis
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult | null> {
    if (!this.apiKey || !text.trim()) {
      return null;
    }

    const cleanText = text.trim();
    
    // Perform script analysis first
    const scriptAnalysis = this.analyzeTextScript(cleanText);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.detectUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: cleanText
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Detection API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: GoogleDetectResponse = await response.json();
      
      if (data.data?.detections?.[0]?.[0]) {
        const detection = data.data.detections[0][0];
        const normalizedLang = this.normalizeLanguageCode(detection.language);
        
        // Enhance confidence based on script analysis
        let enhancedConfidence = detection.confidence;
        const langInfo = this.languageDatabase[normalizedLang];
        
        if (langInfo && scriptAnalysis.scriptType === langInfo.script) {
          // Boost confidence if script matches expected script for language
          enhancedConfidence = Math.min(enhancedConfidence * 1.1, 1.0);
        } else if (langInfo && scriptAnalysis.scriptType !== langInfo.script) {
          // Reduce confidence if script doesn't match
          enhancedConfidence = enhancedConfidence * 0.8;
        }

        // Additional confidence boost for longer, more reliable text
        if (cleanText.length > 50) {
          enhancedConfidence = Math.min(enhancedConfidence * 1.05, 1.0);
        }

        return {
          language: normalizedLang,
          confidence: enhancedConfidence,
          script: scriptAnalysis.scriptType,
          isReliable: enhancedConfidence >= 0.8 && scriptAnalysis.confidence >= 0.7
        };
      }

      return null;
    } catch (error) {
      console.error('Enhanced language detection failed:', error);
      
      // Fallback: Try to detect language based on script alone
      return this.fallbackScriptBasedDetection(text, scriptAnalysis);
    }
  }

  /**
   * Fallback language detection based on script analysis
   */
  private fallbackScriptBasedDetection(
    text: string, 
    scriptAnalysis: ReturnType<typeof TranslationService.prototype.analyzeTextScript>
  ): LanguageDetectionResult | null {
    const { scriptType, confidence } = scriptAnalysis;
    
    // Map scripts to most likely languages
    const scriptToLanguage: Record<string, string> = {
      'Latin': 'en', // Default to English for Latin script
      'Cyrillic': 'ru', // Default to Russian for Cyrillic
      'Arabic': 'ar', // Default to Arabic for Arabic script
      'Devanagari': 'hi', // Default to Hindi for Devanagari
      'Bengali': 'bn', // Bengali script
      'Gujarati': 'gu', // Gujarati script
      'Gurmukhi': 'pa', // Punjabi script
      'Tamil': 'ta', // Tamil script
      'Telugu': 'te', // Telugu script
      'Kannada': 'kn', // Kannada script
      'Malayalam': 'ml', // Malayalam script
      'Odia': 'or', // Odia script
      'Sinhala': 'si', // Sinhala script
      'Thai': 'th', // Thai script
      'Lao': 'lo', // Lao script
      'Myanmar': 'my', // Myanmar script
      'Khmer': 'km', // Khmer script
      'Georgian': 'ka', // Georgian script
      'Armenian': 'hy', // Armenian script
      'Hebrew': 'he', // Hebrew script
      'Ethiopic': 'am', // Amharic script
      'Han': 'zh', // Chinese script
      'Hangul': 'ko' // Korean script
    };

    const detectedLang = scriptToLanguage[scriptType];
    
    if (detectedLang && confidence >= 0.5) {
      return {
        language: detectedLang,
        confidence: confidence * 0.7, // Lower confidence for fallback detection
        script: scriptType,
        isReliable: confidence >= 0.8
      };
    }

    return null;
  }

  /**
   * Enhanced language detection with multiple alternatives
   */
  async detectLanguageEnhanced(text: string): Promise<EnhancedDetectionResult | null> {
    if (!text.trim()) {
      return null;
    }

    const cleanText = text.trim();
    const textAnalysis = this.analyzeTextScript(cleanText);
    
    try {
      // Get primary detection
      const primaryDetection = await this.detectLanguage(cleanText);
      
      if (!primaryDetection) {
        return null;
      }

      // For now, we'll use the primary detection as the main result
      // In a production system, you might want to call multiple detection APIs
      // or use additional heuristics to get alternative language suggestions
      
      return {
        primary: primaryDetection,
        alternatives: [], // Could be populated with additional detection methods
        textAnalysis: {
          length: cleanText.length,
          hasNumbers: textAnalysis.hasNumbers,
          hasSpecialChars: textAnalysis.hasSpecialChars,
          scriptType: textAnalysis.scriptType,
          unicodeBlocks: textAnalysis.unicodeBlocks
        }
      };
    } catch (error) {
      console.error('Enhanced language detection failed:', error);
      return null;
    }
  }

  /**
   * Normalize language code to base ISO 639-1 format
   */
  private normalizeLanguageCode(languageCode: string): string {
    if (!languageCode || languageCode === 'auto') {
      return languageCode;
    }
    
    // Extract only the base language code (first part before any dash)
    const baseCode = languageCode.split('-')[0].toLowerCase();
    
    // Handle special cases and variants
    const codeMapping: Record<string, string> = {
      'zh-cn': 'zh',
      'zh-tw': 'zh',
      'zh-hk': 'zh',
      'pt-br': 'pt',
      'pt-pt': 'pt',
      'en-us': 'en',
      'en-gb': 'en',
      'es-es': 'es',
      'es-mx': 'es',
      'fr-fr': 'fr',
      'fr-ca': 'fr',
      'de-de': 'de',
      'de-at': 'de',
      'it-it': 'it',
      'ru-ru': 'ru',
      'ja-jp': 'ja',
      'ko-kr': 'ko',
      'ar-sa': 'ar',
      'hi-in': 'hi',
      'bn-bd': 'bn',
      'bn-in': 'bn'
    };
    
    return codeMapping[languageCode.toLowerCase()] || baseCode;
  }

  /**
   * Translate text to English with enhanced language detection
   */
  async translateToEnglish(text: string, sourceLanguage?: string): Promise<TranslationResult> {
    if (!this.apiKey) {
      throw new Error('Google Translate API key not configured. Please add VITE_GOOGLE_TRANSLATE_API_KEY to your environment variables.');
    }

    if (!text.trim()) {
      throw new Error('No text provided for translation.');
    }

    const cleanText = text.trim();
    
    // Skip translation for very short text or placeholder text
    if (cleanText.length < 3 || 
        cleanText === 'Audio recorded' || 
        cleanText === 'Audio recorded - speech detected') {
      return {
        translatedText: cleanText,
        sourceLanguage: 'unknown',
        confidence: 0,
        status: 'not_required'
      };
    }

    try {
      // Use enhanced detection if no source language provided
      let detectedLanguage = sourceLanguage;
      let languageConfidence = 1.0;
      let isReliable = true;

      if (!sourceLanguage) {
        const enhancedDetection = await this.detectLanguageEnhanced(cleanText);
        if (enhancedDetection?.primary) {
          detectedLanguage = enhancedDetection.primary.language;
          languageConfidence = enhancedDetection.primary.confidence;
          isReliable = enhancedDetection.primary.isReliable;
          
          console.log(`Enhanced language detection: ${detectedLanguage} (${Math.round(languageConfidence * 100)}% confidence, script: ${enhancedDetection.primary.script})`);
        } else {
          // Fallback: assume it's not English and try to translate anyway
          detectedLanguage = 'auto';
          languageConfidence = 0.5;
          isReliable = false;
        }
      }

      // Normalize the detected language code
      const normalizedLanguage = this.normalizeLanguageCode(detectedLanguage || 'auto');

      // If detected language is English, no translation needed
      if (normalizedLanguage === 'en') {
        return {
          translatedText: cleanText,
          sourceLanguage: 'en',
          confidence: 1.0,
          status: 'not_required'
        };
      }

      // Perform translation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const requestBody: any = {
        q: cleanText,
        target: 'en',
        format: 'text'
      };

      // Only add source language if it's not 'auto' and is normalized
      if (normalizedLanguage && normalizedLanguage !== 'auto') {
        requestBody.source = normalizedLanguage;
      }

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Translation API error:', errorText);
        
        // Handle specific API errors
        if (response.status === 400) {
          throw new Error('Invalid text for translation. Please try recording again.');
        } else if (response.status === 403) {
          throw new Error('Translation API access denied. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('Translation service temporarily unavailable. Please try again.');
        } else {
          throw new Error(`Translation service error (${response.status}). Please try again.`);
        }
      }

      const data: GoogleTranslateResponse = await response.json();
      
      if (!data.data?.translations?.[0]) {
        throw new Error('Invalid response from translation service.');
      }

      const translation = data.data.translations[0];
      const finalSourceLanguage = this.normalizeLanguageCode(translation.detectedSourceLanguage || detectedLanguage || 'unknown');
      
      // Calculate overall confidence (combination of detection and translation confidence)
      let translationConfidence = languageConfidence * 0.95; // Cap at 95%
      
      // Boost confidence for reliable detections
      if (isReliable && languageConfidence >= 0.9) {
        translationConfidence = Math.min(translationConfidence * 1.05, 0.98);
      }
      
      // Determine status based on confidence and reliability
      let status: TranslationStatus;
      if (translationConfidence >= this.confidenceThreshold && isReliable) {
        status = 'completed';
      } else if (translationConfidence >= 0.6) {
        status = 'low_confidence';
      } else {
        status = 'failed';
      }

      // If translation is the same as original, it might already be in English
      if (translation.translatedText.toLowerCase().trim() === cleanText.toLowerCase().trim()) {
        return {
          translatedText: cleanText,
          sourceLanguage: finalSourceLanguage,
          confidence: 1.0,
          status: 'not_required'
        };
      }

      console.log(`Translation completed: ${finalSourceLanguage} -> en (${Math.round(translationConfidence * 100)}% confidence)`);

      return {
        translatedText: translation.translatedText,
        sourceLanguage: finalSourceLanguage,
        confidence: translationConfidence,
        status
      };

    } catch (error) {
      console.error('Enhanced translation failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Translation timed out. Please check your connection and try again.');
        }
        throw error;
      }
      
      throw new Error('Translation failed due to an unknown error.');
    }
  }

  /**
   * Check if translation service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get comprehensive language information
   */
  getLanguageInfo(languageCode: string) {
    const normalizedCode = this.normalizeLanguageCode(languageCode);
    return this.languageDatabase[normalizedCode] || null;
  }

  /**
   * Get all supported languages with enhanced metadata
   */
  getSupportedLanguages() {
    return Object.entries(this.languageDatabase).map(([code, info]) => ({
      code,
      ...info
    }));
  }

  /**
   * Get languages by script type
   */
  getLanguagesByScript(scriptType: string) {
    return Object.entries(this.languageDatabase)
      .filter(([_, info]) => info.script === scriptType)
      .map(([code, info]) => ({ code, ...info }));
  }

  /**
   * Validate if a language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    const normalizedCode = this.normalizeLanguageCode(languageCode);
    return normalizedCode in this.languageDatabase;
  }

  /**
   * Get script type for a given text
   */
  async getTextScript(text: string): Promise<string> {
    const analysis = this.analyzeTextScript(text);
    return analysis.scriptType;
  }

  /**
   * Batch language detection for multiple texts
   */
  async detectLanguagesBatch(texts: string[]): Promise<(LanguageDetectionResult | null)[]> {
    const promises = texts.map(text => this.detectLanguage(text));
    return Promise.all(promises);
  }
}

export const translationService = new TranslationService();
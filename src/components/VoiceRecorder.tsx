import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Square, CheckCircle, Volume2, Languages, Globe, Zap, Brain } from 'lucide-react';
import { VoiceRecordingState, TranslationResult } from '../types/emergency';
import { translationService } from '../services/translationService';

interface VoiceRecorderProps {
  onRecordingComplete: (transcription: string, audioBlob: Blob, confidence: number, translationResult?: TranslationResult) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    countdown: 0,
    duration: 0,
    transcription: '',
    confidence: 0,
    isTranslating: false
  });

  const [isListening, setIsListening] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [speechDetected, setSpeechDetected] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranslation, setLiveTranslation] = useState<TranslationResult | null>(null);
  const [isLiveTranslating, setIsLiveTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [languageConfidence, setLanguageConfidence] = useState<number>(0);
  const [detectedScript, setDetectedScript] = useState<string | null>(null);
  const [currentRecognitionLanguage, setCurrentRecognitionLanguage] = useState<string>('bn-BD');
  const [originalTranscription, setOriginalTranscription] = useState<string>('');
  const [englishTranslation, setEnglishTranslation] = useState<string>('');
  const [languageReliability, setLanguageReliability] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const chunksRef = useRef<Blob[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionRef = useRef<string>('');
  const confidenceRef = useRef<number>(0);
  const hasReceivedSpeechRef = useRef<boolean>(false);
  const interimTranscriptRef = useRef<string>('');
  const speechActivityRef = useRef<boolean>(false);
  const audioLevelRef = useRef<number>(0);
  const liveTranslationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionErrorRef = useRef<boolean>(false);
  const languageDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const languageRotationRef = useRef<number>(0);
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced multilingual recognition languages with comprehensive coverage
  const recognitionLanguages = [
    // Priority languages for emergency scenarios
    'bn-BD', 'bn-IN', // Bengali (Bangladesh, India) - Priority
    'hi-IN', // Hindi - Common in South Asia
    'en-US', 'en-GB', 'en-AU', 'en-CA', // English variants
    'es-ES', 'es-US', 'es-MX', 'es-AR', // Spanish variants
    'zh-CN', 'zh-TW', 'zh-HK', // Chinese variants
    'ar-SA', 'ar-EG', 'ar-AE', 'ar-MA', // Arabic variants
    'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', // French variants
    'ru-RU', // Russian
    'pt-BR', 'pt-PT', // Portuguese variants
    'de-DE', 'de-AT', 'de-CH', // German variants
    'ja-JP', // Japanese
    'ko-KR', // Korean
    'it-IT', // Italian
    'tr-TR', // Turkish
    'ur-PK', 'ur-IN', // Urdu variants
    'fa-IR', // Persian
    'th-TH', // Thai
    'vi-VN', // Vietnamese
    'ta-IN', 'ta-LK', // Tamil variants
    'te-IN', // Telugu
    'gu-IN', // Gujarati
    'kn-IN', // Kannada
    'ml-IN', // Malayalam
    'mr-IN', // Marathi
    'pa-IN', // Punjabi
    'or-IN', // Odia
    'as-IN', // Assamese
    'ne-NP', // Nepali
    'si-LK', // Sinhala
    'my-MM', // Myanmar
    'km-KH', // Khmer
    'lo-LA', // Lao
    'ka-GE', // Georgian
    'hy-AM', // Armenian
    'he-IL', // Hebrew
    'am-ET', // Amharic
    'sw-KE', 'sw-TZ', // Swahili variants
    'zu-ZA', // Zulu
    'xh-ZA', // Xhosa
    'af-ZA', // Afrikaans
    'nl-NL', 'nl-BE', // Dutch variants
    'sv-SE', // Swedish
    'da-DK', // Danish
    'no-NO', // Norwegian
    'fi-FI', // Finnish
    'pl-PL', // Polish
    'cs-CZ', // Czech
    'sk-SK', // Slovak
    'hu-HU', // Hungarian
    'ro-RO', // Romanian
    'hr-HR', // Croatian
    'sr-RS', // Serbian
    'sl-SI', // Slovenian
    'bg-BG', // Bulgarian
    'mk-MK', // Macedonian
    'et-EE', // Estonian
    'lv-LV', // Latvian
    'lt-LT', // Lithuanian
    'mt-MT', // Maltese
    'cy-GB', // Welsh
    'ga-IE', // Irish
    'eu-ES', // Basque
    'ca-ES', // Catalan
    'gl-ES', // Galician
    'is-IS', // Icelandic
    'fo-FO', // Faroese
    'lb-LU', // Luxembourgish
    'rm-CH', // Romansh
    'sq-AL', // Albanian
    'bs-BA', // Bosnian
    'me-ME', // Montenegrin
    'az-AZ', // Azerbaijani
    'uz-UZ', // Uzbek
    'kk-KZ', // Kazakh
    'ky-KG', // Kyrgyz
    'tk-TM', // Turkmen
    'tg-TJ', // Tajik
    'mn-MN', // Mongolian
    'id-ID', // Indonesian
    'ms-MY', // Malay
    'tl-PH', // Filipino
    'ceb-PH', // Cebuano
    'haw-US', // Hawaiian
    'mi-NZ', // Maori
    'sm-WS', // Samoan
    'to-TO', // Tongan
    'fj-FJ', // Fijian
    'mg-MG', // Malagasy
    'ny-MW', // Chichewa
    'sn-ZW', // Shona
    'st-ZA', // Sesotho
    'tn-ZA', // Setswana
    'ts-ZA', // Tsonga
    've-ZA', // Venda
    'ss-ZA', // Swati
    'nr-ZA', // Ndebele
    'nso-ZA', // Northern Sotho
    'yo-NG', // Yoruba
    'ig-NG', // Igbo
    'ha-NG', // Hausa
    'ff-SN', // Fulani
    'wo-SN', // Wolof
    'rw-RW', // Kinyarwanda
    'rn-BI', // Kirundi
    'lg-UG', // Luganda
    'ak-GH', // Akan
    'tw-GH', // Twi
    'ee-GH', // Ewe
    'gaa-GH', // Ga
    'bm-ML', // Bambara
    'dyu-CI', // Dyula
    'mos-BF', // Mossi
    'fuv-NG', // Fulfulde
    'kr-NG', // Kanuri
    'kcg-NG', // Tyap
    'bin-NG', // Bini
    'efi-NG', // Efik
    'ibb-NG', // Ibibio
    'tiv-NG', // Tiv
    'idu-NG', // Idoma
    'nup-NG', // Nupe
    'gur-GH', // Farefare
    'dag-GH', // Dagbani
    'kpo-LR', // Krahn
    'vai-LR', // Vai
    'men-SL', // Mende
    'tem-SL', // Temne
    'kri-SL', // Krio
    'fuf-GN', // Pular
    'sus-GN', // Susu
    'man-GN', // Mandingo
    'kis-GN', // Kissi
    'ber-MA', // Berber
    'shi-MA', // Tashelhit
    'tzm-MA', // Central Atlas Tamazight
    'rif-MA', // Riffian
    'kab-DZ', // Kabyle
    'chm-DZ', // Chaouia
    'mzb-DZ', // Tumzabt
    'taq-DZ', // Tamasheq
    'tmh-NE', // Tamashek
    'taq-ML', // Tamasheq
    'zen-TD', // Zaghawa
    'dju-TD', // Daju
    'msa-TD', // Masalit
    'fur-TD', // Fur
    'nub-SD', // Nobiin
    'bej-SD', // Beja
    'din-SS', // Dinka
    'nus-SS', // Nuer
    'luo-SS', // Luo
    'ach-UG', // Acholi
    'lgg-UG', // Lugbara
    'mdt-UG', // Madi
    'alz-UG', // Alur
    'teo-UG', // Teso
    'nyn-UG', // Nyankole
    'cgg-UG', // Chiga
    'xog-UG', // Soga
    'laj-UG', // Lango
    'kcb-UG', // Karamojong
    'kdj-UG', // Karamojong
    'so-SO', // Somali
    'om-ET', // Oromo
    'sid-ET', // Sidamo
    'wal-ET', // Wolaytta
    'gez-ET', // Geez
    'aa-ET', // Afar
    'ssy-ER', // Saho
    'byn-ER', // Blin
    'tig-ER', // Tigre
    'ar-SD', // Sudanese Arabic
    'ar-EG', // Egyptian Arabic
    'ar-LY', // Libyan Arabic
    'ar-TN', // Tunisian Arabic
    'ar-DZ', // Algerian Arabic
    'ar-MA', // Moroccan Arabic
    'ar-MR', // Mauritanian Arabic
    'ar-LB', // Lebanese Arabic
    'ar-SY', // Syrian Arabic
    'ar-JO', // Jordanian Arabic
    'ar-PS', // Palestinian Arabic
    'ar-IQ', // Iraqi Arabic
    'ar-KW', // Kuwaiti Arabic
    'ar-BH', // Bahraini Arabic
    'ar-QA', // Qatari Arabic
    'ar-AE', // Emirati Arabic
    'ar-OM', // Omani Arabic
    'ar-YE', // Yemeni Arabic
    'ckb-IQ', // Central Kurdish
    'kmr-TR', // Northern Kurdish
    'sdh-IR', // Southern Kurdish
    'lki-IR', // Laki
    'prs-AF', // Dari
    'haz-AF', // Hazaragi
    'bal-PK', // Balochi
    'bft-PK', // Balti
    'khw-PK', // Khowar
    'ks-IN', // Kashmiri
    'doi-IN', // Dogri
    'mai-IN', // Maithili
    'mag-IN', // Magahi
    'bho-IN', // Bhojpuri
    'awa-IN', // Awadhi
    'bra-IN', // Braj
    'gom-IN', // Konkani
    'kok-IN', // Konkani
    'tcy-IN', // Tulu
    'bpy-IN', // Bishnupriya
    'rkt-IN', // Rangpuri
    'syl-BD', // Sylheti
    'ctg-BD', // Chittagonian
    'rhg-BD', // Rohingya
    'mni-IN', // Manipuri
    'lus-IN', // Mizo
    'grt-IN', // Garo
    'kha-IN', // Khasi
    'sat-IN', // Santali
    'hoc-IN', // Ho
    'mjz-IN', // Mahali
    'unr-IN', // Mundari
    'kru-IN', // Kurukh
    'kha-IN', // Kharia
    'brx-IN', // Bodo
    'raj-IN', // Rajasthani
    'bgc-IN', // Haryanvi
    'hne-IN', // Chhattisgarhi
    'gon-IN', // Gondi
    'kha-IN', // Khandeshi
    'new-NP', // Newari
    'mai-NP', // Maithili
    'bho-NP', // Bhojpuri
    'awa-NP', // Awadhi
    'mag-NP', // Magahi
    'thr-NP', // Tharu
    'lif-NP', // Limbu
    'rai-NP', // Rai
    'tsf-NP', // Tamang
    'gur-NP', // Gurung
    'mgh-NP', // Magar
    'new-NP', // Newar
    'dty-NP', // Doteli
    'mjz-NP', // Majhi
    'bap-NP', // Bantawa
    'yhl-NP', // Yamphu
    'lep-IN', // Lepcha
    'sip-IN', // Sikkimese
    'dz-BT', // Dzongkha
    'bo-CN', // Tibetan
    'ii-CN', // Yi
    'ug-CN', // Uyghur
    'za-CN', // Zhuang
    'mn-CN', // Mongolian
    'ko-CN', // Korean
    'ru-CN', // Russian
    'kk-CN', // Kazakh
    'ky-CN', // Kyrgyz
    'tg-CN', // Tajik
    'tt-RU', // Tatar
    'ba-RU', // Bashkir
    'cv-RU', // Chuvash
    'udm-RU', // Udmurt
    'kv-RU', // Komi
    'mhr-RU', // Mari
    'mrj-RU', // Hill Mari
    'myv-RU', // Erzya
    'mdf-RU', // Moksha
    'sah-RU', // Sakha
    'tyv-RU', // Tuvan
    'alt-RU', // Altai
    'kjh-RU', // Khakas
    'cjs-RU', // Shor
    'yrk-RU', // Nenets
    'kca-RU', // Khanty
    'mns-RU', // Mansi
    'sel-RU', // Selkup
    'ket-RU', // Ket
    'nio-RU', // Nganasan
    'enf-RU', // Enets
    'yrk-RU', // Nenets
    'eve-RU', // Even
    'evn-RU', // Evenk
    'nan-RU', // Nanai
    'gld-RU', // Nanai
    'orc-RU', // Oroch
    'ude-RU', // Udihe
    'ulc-RU', // Ulch
    'neg-RU', // Negidal
    'orh-RU', // Oroqen
    'dta-RU', // Daur
    'xal-RU', // Kalmyk
    'bua-RU', // Buryat
    'khk-MN', // Khalkh Mongolian
    'mvf-MN', // Peripheral Mongolian
    'kk-MN', // Kazakh
    'ky-KG', // Kyrgyz
    'uz-UZ', // Uzbek
    'tk-TM', // Turkmen
    'tg-TJ', // Tajik
    'ps-AF', // Pashto
    'fa-AF', // Persian
    'haz-AF', // Hazaragi
    'prs-AF', // Dari
    'uz-AF', // Uzbek
    'tk-AF', // Turkmen
    'bal-AF', // Balochi
    'bra-AF', // Brahui
    'psh-AF', // Pashayi
    'wbl-AF', // Wakhi
    'isk-AF', // Ishkashimi
    'mnj-AF', // Munji
    'yid-AF', // Yidgha
    'sgh-AF', // Shughni
    'srh-AF', // Sarikoli
    'yai-AF', // Yagnob
    'oss-GE', // Ossetian
    'ab-GE', // Abkhaz
    'xmf-GE', // Mingrelian
    'lzz-GE', // Laz
    'sva-GE', // Svan
    'ku-TR', // Kurdish
    'zza-TR', // Zazaki
    'lzz-TR', // Laz
    'ady-TR', // Adyghe
    'kbd-RU', // Kabardian
    'ce-RU', // Chechen
    'inh-RU', // Ingush
    'av-RU', // Avar
    'dar-RU', // Dargwa
    'lbe-RU', // Lak
    'lez-RU', // Lezgian
    'tab-RU', // Tabasaran
    'rut-RU', // Rutul
    'tkr-RU', // Tsakhur
    'udi-RU', // Udi
    'agx-RU', // Aghul
    'bud-RU', // Budukh
    'kry-RU', // Kryts
    'jdt-RU', // Juhuri
    'tat-RU', // Tat
    'tly-RU', // Talysh
    'ku-SY', // Kurdish
    'syr-SY', // Syriac
    'arc-SY', // Aramaic
    'aii-IQ', // Assyrian Neo-Aramaic
    'acm-IQ', // Mesopotamian Arabic
    'ckb-IQ', // Central Kurdish
    'lrc-IR', // Northern Luri
    'luz-IR', // Southern Luri
    'glk-IR', // Gilaki
    'mzn-IR', // Mazanderani
    'tly-IR', // Talysh
    'bal-IR', // Balochi
    'bcc-IR', // Southern Balochi
    'bgn-IR', // Western Balochi
    'bgp-IR', // Eastern Balochi
    'brh-IR', // Brahui
    'haz-IR', // Hazaragi
    'aim-IR', // Aimaq
    'prs-IR', // Dari
    'tg-IR', // Tajik
    'ku-IR', // Kurdish
    'ckb-IR', // Central Kurdish
    'sdh-IR', // Southern Kurdish
    'lki-IR', // Laki
    'peo-IR', // Old Persian
    'pal-IR', // Middle Persian
    'xpr-IR', // Parthian
    'sog-IR', // Sogdian
    'kho-IR', // Khotanese
    'ae-IR', // Avestan
    'xbc-IR', // Bactrian
    'xco-IR', // Chorasmian
    'ira-IR', // Iranian
    'inc-IN', // Indic
    'dra-IN', // Dravidian
    'mun-IN', // Munda
    'sit-IN', // Sino-Tibetan
    'tbq-IN', // Tibeto-Burman
    'aav-IN', // Austro-Asiatic
    'hmx-IN', // Hmong-Mien
    'tai-IN', // Tai
    'map-IN', // Austronesian
    'paa-IN', // Papuan
    'aus-AU', // Australian
    'crp-AU', // Creole
    'sgn-AU', // Sign Language
    'art-AU', // Artificial
    'mis-AU', // Miscellaneous
    'mul-AU', // Multiple
    'und-AU', // Undetermined
    'zxx-AU'  // No linguistic content
  ];

  useEffect(() => {
    // Initialize Speech Recognition with comprehensive multilingual support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setupSpeechRecognition();
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (durationRef.current) clearInterval(durationRef.current);
      if (liveTranslationTimeoutRef.current) clearTimeout(liveTranslationTimeoutRef.current);
      if (languageDetectionTimeoutRef.current) clearTimeout(languageDetectionTimeoutRef.current);
      if (recognitionRestartTimeoutRef.current) clearTimeout(recognitionRestartTimeoutRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = currentRecognitionLanguage;

    recognitionRef.current.onstart = () => {
      console.log(`🎙️ Universal speech recognition started with language: ${currentRecognitionLanguage}`);
      isRecognitionActiveRef.current = true;
      recognitionErrorRef.current = false;
      setIsListening(true);
    };

    recognitionRef.current.onend = () => {
      console.log('🔇 Speech recognition ended');
      isRecognitionActiveRef.current = false;
      setIsListening(false);
      
      // Only restart if recording is still active and no critical error occurred
      if (state.isRecording && !recognitionErrorRef.current) {
        // Try next language if no speech detected in current language
        if (!hasReceivedSpeechRef.current && speechActivityRef.current) {
          rotateRecognitionLanguage();
        }
        
        recognitionRestartTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && state.isRecording && !isRecognitionActiveRef.current && !recognitionErrorRef.current) {
            try {
              setupSpeechRecognition(); // Recreate with current language
              recognitionRef.current.start();
            } catch (error) {
              console.log('Recognition restart failed:', error);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence || 0.8;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
          hasReceivedSpeechRef.current = true;
          
          // Enhanced language detection from the transcript
          detectLanguageFromTranscript(transcript);
        } else {
          interimTranscript += transcript;
        }

        if (transcript.trim()) {
          speechActivityRef.current = true;
          setSpeechDetected(true);
        }
      }

      if (finalTranscript) {
        transcriptionRef.current = (transcriptionRef.current + ' ' + finalTranscript).trim();
        confidenceRef.current = Math.max(confidenceRef.current, maxConfidence);
        
        // Update original transcription
        setOriginalTranscription(transcriptionRef.current);
        
        // Trigger enhanced language detection and translation
        triggerEnhancedLanguageDetectionAndTranslation(transcriptionRef.current);
      }
      
      interimTranscriptRef.current = interimTranscript;

      const displayTranscript = (transcriptionRef.current + ' ' + interimTranscript).trim();
      
      setState(prev => ({
        ...prev,
        transcription: displayTranscript,
        confidence: confidenceRef.current || 0.8,
        error: undefined
      }));

      // Update original transcription with interim results
      setOriginalTranscription(displayTranscript);

      // Trigger enhanced language detection and translation for interim results if we have enough text
      if (displayTranscript.length > 10) {
        triggerEnhancedLanguageDetectionAndTranslation(displayTranscript, true);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('🚨 Speech recognition error:', event.error);
      isRecognitionActiveRef.current = false;
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          console.log('🔄 No speech detected, trying next language...');
          if (speechActivityRef.current && !hasReceivedSpeechRef.current) {
            rotateRecognitionLanguage();
          }
          return;
        case 'audio-capture':
          recognitionErrorRef.current = true;
          setState(prev => ({
            ...prev,
            error: 'Microphone access failed. Please check your microphone permissions.'
          }));
          stopRecording();
          break;
        case 'not-allowed':
          recognitionErrorRef.current = true;
          setState(prev => ({
            ...prev,
            error: 'Microphone access denied. Please allow microphone access and try again.'
          }));
          stopRecording();
          break;
        case 'network':
          console.log('🌐 Speech recognition network error - continuing with audio-only recording');
          setState(prev => ({
            ...prev,
            error: 'Speech recognition unavailable due to network issues. Recording audio only - please speak clearly.'
          }));
          break;
        case 'language-not-supported':
          console.log(`🌍 Language ${currentRecognitionLanguage} not supported, trying next...`);
          rotateRecognitionLanguage();
          return;
        case 'aborted':
          return;
        default:
          console.log(`⚠️ Speech recognition error: ${event.error}`);
          return;
      }
    };
  };

  const rotateRecognitionLanguage = () => {
    languageRotationRef.current = (languageRotationRef.current + 1) % recognitionLanguages.length;
    const newLanguage = recognitionLanguages[languageRotationRef.current];
    setCurrentRecognitionLanguage(newLanguage);
    
    console.log(`🔄 Switching to language: ${newLanguage}`);
    
    // Restart recognition with new language
    if (recognitionRef.current && state.isRecording) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          setupSpeechRecognition();
          if (recognitionRef.current && !recognitionErrorRef.current) {
            recognitionRef.current.start();
          }
        }, 200);
      } catch (error) {
        console.log('Error rotating language:', error);
      }
    }
  };

  const detectLanguageFromTranscript = async (transcript: string) => {
    if (!translationService.isAvailable() || !transcript.trim()) return;

    try {
      const enhancedDetection = await translationService.detectLanguageEnhanced(transcript);
      if (enhancedDetection?.primary) {
        const { language, confidence, script, isReliable } = enhancedDetection.primary;
        
        setDetectedLanguage(language);
        setLanguageConfidence(confidence);
        setDetectedScript(script || 'Unknown');
        setLanguageReliability(isReliable);
        
        console.log(`🧠 Enhanced language detection: ${language} (${Math.round(confidence * 100)}% confidence, script: ${script}, reliable: ${isReliable})`);
        
        // Switch to appropriate recognition language if detected with high confidence
        if (isReliable && confidence > 0.8) {
          const detectedLangCode = getRecognitionLanguageCode(language);
          if (detectedLangCode && detectedLangCode !== currentRecognitionLanguage) {
            setCurrentRecognitionLanguage(detectedLangCode);
            console.log(`🎯 High-confidence detection: ${language}, switching to ${detectedLangCode} recognition`);
          }
        }
      }
    } catch (error) {
      console.error('Enhanced language detection failed:', error);
    }
  };

  const getRecognitionLanguageCode = (languageCode: string): string | null => {
    const languageMap: Record<string, string> = {
      'bn': 'bn-BD', // Bengali
      'hi': 'hi-IN', // Hindi
      'es': 'es-ES', // Spanish
      'zh': 'zh-CN', // Chinese
      'ar': 'ar-SA', // Arabic
      'fr': 'fr-FR', // French
      'ru': 'ru-RU', // Russian
      'pt': 'pt-BR', // Portuguese
      'de': 'de-DE', // German
      'ja': 'ja-JP', // Japanese
      'ko': 'ko-KR', // Korean
      'it': 'it-IT', // Italian
      'tr': 'tr-TR', // Turkish
      'pl': 'pl-PL', // Polish
      'nl': 'nl-NL', // Dutch
      'sv': 'sv-SE', // Swedish
      'da': 'da-DK', // Danish
      'no': 'no-NO', // Norwegian
      'fi': 'fi-FI', // Finnish
      'en': 'en-US', // English
      'ur': 'ur-PK', // Urdu
      'fa': 'fa-IR', // Persian
      'th': 'th-TH', // Thai
      'vi': 'vi-VN', // Vietnamese
      'ta': 'ta-IN', // Tamil
      'te': 'te-IN', // Telugu
      'gu': 'gu-IN', // Gujarati
      'kn': 'kn-IN', // Kannada
      'ml': 'ml-IN', // Malayalam
      'mr': 'mr-IN', // Marathi
      'pa': 'pa-IN', // Punjabi
      'or': 'or-IN', // Odia
      'as': 'as-IN', // Assamese
      'ne': 'ne-NP', // Nepali
      'si': 'si-LK', // Sinhala
      'my': 'my-MM', // Myanmar
      'km': 'km-KH', // Khmer
      'lo': 'lo-LA', // Lao
      'ka': 'ka-GE', // Georgian
      'hy': 'hy-AM', // Armenian
      'he': 'he-IL', // Hebrew
      'am': 'am-ET', // Amharic
      'sw': 'sw-KE', // Swahili
      'zu': 'zu-ZA', // Zulu
      'xh': 'xh-ZA', // Xhosa
      'af': 'af-ZA', // Afrikaans
      'uk': 'uk-UA', // Ukrainian
      'be': 'be-BY', // Belarusian
      'bg': 'bg-BG', // Bulgarian
      'sr': 'sr-RS', // Serbian
      'mk': 'mk-MK', // Macedonian
      'mn': 'mn-MN', // Mongolian
      'cs': 'cs-CZ', // Czech
      'sk': 'sk-SK', // Slovak
      'hu': 'hu-HU', // Hungarian
      'ro': 'ro-RO', // Romanian
      'hr': 'hr-HR', // Croatian
      'sl': 'sl-SI', // Slovenian
      'et': 'et-EE', // Estonian
      'lv': 'lv-LV', // Latvian
      'lt': 'lt-LT', // Lithuanian
      'mt': 'mt-MT', // Maltese
      'ga': 'ga-IE', // Irish
      'cy': 'cy-GB', // Welsh
      'eu': 'eu-ES', // Basque
      'ca': 'ca-ES', // Catalan
      'gl': 'gl-ES', // Galician
      'is': 'is-IS', // Icelandic
      'fo': 'fo-FO', // Faroese
      'lb': 'lb-LU', // Luxembourgish
      'rm': 'rm-CH', // Romansh
      'sq': 'sq-AL', // Albanian
      'bs': 'bs-BA', // Bosnian
      'az': 'az-AZ', // Azerbaijani
      'uz': 'uz-UZ', // Uzbek
      'kk': 'kk-KZ', // Kazakh
      'ky': 'ky-KG', // Kyrgyz
      'tk': 'tk-TM', // Turkmen
      'tg': 'tg-TJ', // Tajik
      'id': 'id-ID', // Indonesian
      'ms': 'ms-MY', // Malay
      'tl': 'tl-PH'  // Filipino
    };
    
    return languageMap[languageCode] || null;
  };

  const triggerEnhancedLanguageDetectionAndTranslation = async (text: string, isInterim: boolean = false) => {
    if (!translationService.isAvailable() || !text.trim() || text.length < 5) {
      return;
    }

    // Clear existing timeouts
    if (liveTranslationTimeoutRef.current) {
      clearTimeout(liveTranslationTimeoutRef.current);
    }
    if (languageDetectionTimeoutRef.current) {
      clearTimeout(languageDetectionTimeoutRef.current);
    }

    // Debounce requests - shorter delay for better real-time experience
    const delay = isInterim ? 1500 : 500;
    
    languageDetectionTimeoutRef.current = setTimeout(async () => {
      if (!state.isRecording) return;
      
      try {
        setIsLiveTranslating(true);
        setTranslationError(null);
        
        // Enhanced language detection with script analysis
        const enhancedDetection = await translationService.detectLanguageEnhanced(text);
        
        if (enhancedDetection?.primary && state.isRecording) {
          const { language, confidence, script, isReliable } = enhancedDetection.primary;
          
          setDetectedLanguage(language);
          setLanguageConfidence(confidence);
          setDetectedScript(script || 'Unknown');
          setLanguageReliability(isReliable);
          
          console.log(`🔍 Enhanced detection: ${language} (${Math.round(confidence * 100)}% confidence, script: ${script}, reliable: ${isReliable})`);
          
          // If it's not English, translate it
          if (language !== 'en' && confidence > 0.3) {
            const result = await translationService.translateToEnglish(text, language);
            
            if (result && state.isRecording) {
              setLiveTranslation(result);
              setEnglishTranslation(result.translatedText);
              console.log(`🌍 ${getLanguageName(language)} (${script}): "${text}" -> English: "${result.translatedText}"`);
            }
          } else if (language === 'en') {
            // It's already English
            const englishResult = {
              translatedText: text,
              sourceLanguage: 'en',
              confidence: 1.0,
              status: 'not_required' as const
            };
            setLiveTranslation(englishResult);
            setEnglishTranslation(text);
          }
        }
      } catch (error) {
        console.error('Enhanced live language detection and translation failed:', error);
        setTranslationError('Translation temporarily unavailable');
      } finally {
        setIsLiveTranslating(false);
      }
    }, delay);
  };

  const performFinalTranslation = async (text: string): Promise<TranslationResult | null> => {
    if (!translationService.isAvailable()) {
      console.log('Translation service not available - API key not configured');
      return liveTranslation; // Return live translation if available
    }

    if (!text.trim() || text === 'Audio recorded' || text === 'Audio recorded - speech detected') {
      return liveTranslation;
    }

    try {
      setState(prev => ({ ...prev, isTranslating: true }));
      setProcessingStatus('Finalizing enhanced translation...');
      setTranslationError(null);

      // Use live translation if it's recent and matches well
      if (liveTranslation && 
          liveTranslation.status === 'completed' && 
          text.toLowerCase().includes(liveTranslation.translatedText.substring(0, 15).toLowerCase())) {
        setState(prev => ({ 
          ...prev, 
          isTranslating: false,
          translationResult: liveTranslation
        }));
        return liveTranslation;
      }

      // Perform fresh enhanced translation with detected language
      const result = await translationService.translateToEnglish(text, detectedLanguage || undefined);
      
      setState(prev => ({ 
        ...prev, 
        isTranslating: false,
        translationResult: result
      }));
      
      // Update final translations
      if (result) {
        setEnglishTranslation(result.translatedText);
        console.log(`✅ Final enhanced translation - ${getLanguageName(result.sourceLanguage)} (${detectedScript}): "${text}" -> English: "${result.translatedText}"`);
      }
      
      return result;
    } catch (error) {
      console.error('Final enhanced translation failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Translation unavailable. Please try again.';
      
      setTranslationError(errorMessage);
      
      const failedResult = {
        translatedText: text,
        sourceLanguage: detectedLanguage || 'unknown',
        confidence: 0,
        status: 'failed' as const
      };
      
      setState(prev => ({ 
        ...prev, 
        isTranslating: false,
        translationResult: failedResult
      }));
      
      return failedResult;
    }
  };

  const startCountdown = () => {
    setState(prev => ({ ...prev, countdown: 3, error: undefined, isTranslating: false, translationResult: undefined }));
    hasReceivedSpeechRef.current = false;
    speechActivityRef.current = false;
    transcriptionRef.current = '';
    confidenceRef.current = 0;
    interimTranscriptRef.current = '';
    recognitionErrorRef.current = false;
    languageRotationRef.current = 0; // Start with Bengali but support all languages
    setSpeechDetected(false);
    setTranslationError(null);
    setLiveTranslation(null);
    setDetectedLanguage(null);
    setLanguageConfidence(0);
    setDetectedScript(null);
    setLanguageReliability(false);
    setCurrentRecognitionLanguage('bn-BD'); // Start with Bengali but will auto-detect
    setAudioLevel(0);
    setOriginalTranscription('');
    setEnglishTranslation('');
    
    countdownRef.current = setInterval(() => {
      setState(prev => {
        if (prev.countdown <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          startActualRecording();
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const startActualRecording = async () => {
    try {
      setProcessingStatus('Accessing microphone for universal multilingual speech...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      microphone.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const checkAudioLevel = () => {
        if (state.isRecording && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedLevel = Math.min(average / 50, 1); // Normalize to 0-1
          
          audioLevelRef.current = average;
          setAudioLevel(normalizedLevel);
          
          if (average > 15) {
            speechActivityRef.current = true;
            setSpeechDetected(true);
          }
          
          requestAnimationFrame(checkAudioLevel);
        }
      };
      
      checkAudioLevel();

      chunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setProcessingStatus('Processing universal multilingual audio and finalizing enhanced translation...');
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        
        setState(prev => ({ ...prev, audioBlob }));
        
        setTimeout(async () => {
          const finalTranscript = transcriptionRef.current.trim();
          const interimTranscript = interimTranscriptRef.current.trim();
          
          let bestTranscript = '';
          let confidence = 0;
          
          if (finalTranscript) {
            bestTranscript = finalTranscript;
            confidence = confidenceRef.current || 0.8;
            setProcessingStatus('Enhanced transcription complete!');
          } else if (interimTranscript) {
            bestTranscript = interimTranscript;
            confidence = 0.6;
            setProcessingStatus('Enhanced transcription complete!');
          } else if (speechActivityRef.current || speechDetected) {
            bestTranscript = 'Audio recorded - speech detected';
            confidence = 0.4;
            setProcessingStatus('Audio recorded!');
          } else {
            bestTranscript = 'Audio recorded';
            confidence = 0.2;
            setProcessingStatus('Audio recorded!');
          }
          
          // Update final original transcription
          setOriginalTranscription(bestTranscript);
          
          let translationResult = null;
          if (bestTranscript && 
              bestTranscript !== 'Audio recorded - speech detected' && 
              bestTranscript !== 'Audio recorded' &&
              bestTranscript.length > 3) {
            translationResult = await performFinalTranslation(bestTranscript);
          }
          
          setProcessingStatus('Enhanced recording and translation complete!');
          setState(prev => ({ ...prev, isProcessing: false }));
          
          console.log('🎯 Final submission data:', {
            original: bestTranscript,
            english: translationResult?.translatedText || englishTranslation,
            detectedLanguage: detectedLanguage,
            detectedScript: detectedScript,
            languageReliability: languageReliability,
            confidence: confidence,
            translationResult: translationResult
          });
          
          onRecordingComplete(bestTranscript, audioBlob, confidence, translationResult || undefined);
        }, 500);
      };

      mediaRecorderRef.current.start(100);
      setProcessingStatus('');
      
      if (recognitionRef.current && !isRecognitionActiveRef.current && !recognitionErrorRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.log('Could not start speech recognition:', error);
          recognitionErrorRef.current = true;
        }
      }

      setState(prev => ({ ...prev, isRecording: true, duration: 0, transcription: '' }));

      durationRef.current = setInterval(() => {
        setState(prev => {
          if (prev.duration >= 60) {
            stopRecording();
            return prev;
          }
          return { ...prev, duration: prev.duration + 1 };
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        countdown: 0,
        isProcessing: false,
        error: 'Failed to access microphone. Please check your permissions and try again.'
      }));
      setProcessingStatus('');
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping universal recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      recognitionRef.current.stop();
    }
    
    if (durationRef.current) {
      clearInterval(durationRef.current);
    }

    if (liveTranslationTimeoutRef.current) {
      clearTimeout(liveTranslationTimeoutRef.current);
    }

    if (languageDetectionTimeoutRef.current) {
      clearTimeout(languageDetectionTimeoutRef.current);
    }

    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
    }

    recognitionErrorRef.current = true; // Prevent restart attempts

    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      isProcessing: true,
      duration: 0
    }));
  };

  const handleRecordClick = () => {
    if (disabled) return;

    if (state.isRecording) {
      stopRecording();
    } else if (!state.countdown && !state.isProcessing) {
      startCountdown();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      'en': 'English', 'es': 'Spanish', 'hi': 'Hindi', 'bn': 'Bengali',
      'zh': 'Chinese', 'ar': 'Arabic', 'fr': 'French', 'ru': 'Russian',
      'pt': 'Portuguese', 'de': 'German', 'ja': 'Japanese', 'ko': 'Korean',
      'it': 'Italian', 'tr': 'Turkish', 'pl': 'Polish', 'nl': 'Dutch',
      'sv': 'Swedish', 'da': 'Danish', 'no': 'Norwegian', 'fi': 'Finnish',
      'ur': 'Urdu', 'fa': 'Persian', 'th': 'Thai', 'vi': 'Vietnamese',
      'ta': 'Tamil', 'te': 'Telugu', 'gu': 'Gujarati', 'kn': 'Kannada',
      'ml': 'Malayalam', 'mr': 'Marathi', 'pa': 'Punjabi', 'or': 'Odia',
      'as': 'Assamese', 'ne': 'Nepali', 'si': 'Sinhala', 'my': 'Myanmar',
      'km': 'Khmer', 'lo': 'Lao', 'ka': 'Georgian', 'hy': 'Armenian',
      'he': 'Hebrew', 'am': 'Amharic', 'sw': 'Swahili', 'zu': 'Zulu',
      'xh': 'Xhosa', 'af': 'Afrikaans', 'uk': 'Ukrainian', 'be': 'Belarusian',
      'bg': 'Bulgarian', 'sr': 'Serbian', 'mk': 'Macedonian', 'mn': 'Mongolian',
      'cs': 'Czech', 'sk': 'Slovak', 'hu': 'Hungarian', 'ro': 'Romanian',
      'hr': 'Croatian', 'sl': 'Slovenian', 'et': 'Estonian', 'lv': 'Latvian',
      'lt': 'Lithuanian', 'mt': 'Maltese', 'ga': 'Irish', 'cy': 'Welsh',
      'eu': 'Basque', 'ca': 'Catalan', 'gl': 'Galician', 'is': 'Icelandic',
      'fo': 'Faroese', 'lb': 'Luxembourgish', 'rm': 'Romansh', 'sq': 'Albanian',
      'bs': 'Bosnian', 'az': 'Azerbaijani', 'uz': 'Uzbek', 'kk': 'Kazakh',
      'ky': 'Kyrgyz', 'tk': 'Turkmen', 'tg': 'Tajik', 'id': 'Indonesian',
      'ms': 'Malay', 'tl': 'Filipino'
    };
    return languages[code] || code.toUpperCase();
  };

  const getButtonContent = () => {
    if (state.isProcessing || state.isTranslating) {
      return <Loader2 className="w-20 h-20 animate-spin" />;
    }
    
    if (state.countdown > 0) {
      return <span className="text-5xl font-black">{state.countdown}</span>;
    }
    
    if (state.isRecording) {
      return <Square className="w-20 h-20" />;
    }
    
    return <Mic className="w-20 h-20" />;
  };

  const getButtonClass = () => {
    if (disabled) return 'record-button disabled';
    if (state.isProcessing || state.isTranslating) return 'record-button processing';
    if (state.countdown > 0) return 'record-button countdown';
    if (state.isRecording) return 'record-button recording';
    return 'record-button ready';
  };

  const getButtonLabel = () => {
    if (state.isTranslating) return 'Finalizing enhanced translation...';
    if (state.isProcessing) return processingStatus || 'Processing universal audio...';
    if (state.countdown > 0) return `Starting universal multilingual recognition in ${state.countdown}...`;
    if (state.isRecording) return 'Tap to Stop Recording';
    return 'Tap to Start Recording';
  };

  return (
    <div className="recorder-container">
      {/* Recording Button Label */}
      <div className="recorder-label" style={{ marginBottom: '16px' }}>
        <h3 className="recorder-title">
          {getButtonLabel()}
        </h3>
        {state.isRecording && (
          <p className="recorder-subtitle">
            Speak in any language - Universal detection with real-time English translation
          </p>
        )}
      </div>

      <button
        onClick={handleRecordClick}
        disabled={disabled || state.isProcessing || state.isTranslating}
        className={getButtonClass()}
        aria-label={getButtonLabel()}
      >
        <div className="record-button-content">
          {getButtonContent()}
        </div>
        
        {/* Audio Level Rings */}
        {state.isRecording && (
          <>
            <div 
              className="audio-ring"
              style={{
                transform: `scale(${1 + audioLevel * 0.2})`,
                opacity: audioLevel * 0.8
              }}
            />
            <div 
              className="audio-ring"
              style={{
                transform: `scale(${1 + audioLevel * 0.4})`,
                opacity: audioLevel * 0.6
              }}
            />
          </>
        )}
        
        {/* Pulse Animation */}
        {state.isRecording && (
          <div className="record-pulse" />
        )}
      </button>

      {/* Real-time Recording Status */}
      {state.isRecording && (
        <div className="recording-status">
          {/* Recording Header */}
          <div className="status-header">
            <div className="status-timer">
              <div className="timer-dot" />
              <span className="timer-text">
                {formatDuration(state.duration)}
              </span>
            </div>
            
            <div className="status-indicators">
              {isListening ? (
                <div className="status-indicator active">
                  <Volume2 className="w-4 h-4" />
                  <span>Listening</span>
                </div>
              ) : (
                <div className="status-indicator inactive">
                  <Volume2 className="w-4 h-4" />
                  <span>Audio Only</span>
                </div>
              )}
              
              {speechDetected && (
                <div className="status-indicator success">
                  <CheckCircle className="w-4 h-4" />
                  <span>Speech detected</span>
                </div>
              )}

              {detectedLanguage && (
                <div className="status-indicator active">
                  <Brain className="w-4 h-4" />
                  <span>{getLanguageName(detectedLanguage)}</span>
                  {detectedScript && detectedScript !== 'Unknown' && (
                    <span className="text-xs">({detectedScript})</span>
                  )}
                  {languageConfidence > 0 && (
                    <span className="text-xs">
                      {Math.round(languageConfidence * 100)}%
                      {languageReliability && ' ✓'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Original Transcription */}
          {originalTranscription && (
            <div className="transcription-section">
              <div className="transcription-header">
                <span className="transcription-label">
                  <Globe className="w-4 h-4 inline mr-1" />
                  {detectedLanguage ? `${getLanguageName(detectedLanguage)} Transcription` : 'Live Transcription'}
                  {detectedScript && detectedScript !== 'Unknown' && ` (${detectedScript} Script)`}
                  {detectedLanguage === 'bn' && ' (বাংলা)'}
                </span>
              </div>
              <p className={`transcription-text ${detectedLanguage === 'bn' ? 'bengali-text' : ''}`}>
                {originalTranscription}
              </p>
            </div>
          )}

          {/* Live English Translation */}
          {(englishTranslation || isLiveTranslating) && detectedLanguage !== 'en' && (
            <div className="translation-section">
              <div className="translation-header">
                <span className="translation-label">
                  <Languages className="w-4 h-4 inline mr-1" />
                  English Translation
                  {isLiveTranslating && (
                    <Loader2 className="w-4 h-4 inline ml-2 animate-spin" />
                  )}
                </span>
              </div>
              
              {isLiveTranslating ? (
                <div className="flex items-center space-x-2 text-green-700 font-medium">
                  <Zap className="w-4 h-4" />
                  <span>Translating to English with enhanced detection...</span>
                </div>
              ) : englishTranslation ? (
                <div>
                  <p className="translation-text english-text">
                    {englishTranslation}
                  </p>
                  {liveTranslation && liveTranslation.confidence > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Translation confidence: {Math.round(liveTranslation.confidence * 100)}%
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* English Only Notice */}
          {detectedLanguage === 'en' && originalTranscription && (
            <div className="translation-section">
              <div className="translation-header">
                <span className="translation-label">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Language Status
                </span>
              </div>
              <p className="text-blue-700 font-medium">
                ✓ Already in English - No translation needed
              </p>
            </div>
          )}

          {/* Enhanced Language Detection Info */}
          {detectedLanguage && detectedScript && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-700 font-medium">
                <Brain className="w-4 h-4" />
                <span>
                  Enhanced Detection: {getLanguageName(detectedLanguage)} ({detectedScript} script)
                  {languageReliability ? ' - High Reliability' : ' - Analyzing...'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-red-800 mb-1">Recording Notice</p>
              <p className="text-red-700 font-medium leading-relaxed">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {(state.isProcessing || state.isTranslating) && processingStatus && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-2 text-blue-700 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{processingStatus}</span>
          </div>
        </div>
      )}

      {/* Translation Error */}
      {translationError && (
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center space-x-2 text-yellow-700 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{translationError}</span>
          </div>
        </div>
      )}

      {/* Translation Service Status */}
      {!translationService.isAvailable() && (
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center space-x-2 text-yellow-700 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>
              Enhanced real-time translation unavailable. Add Google Translate API key to enable universal language detection.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
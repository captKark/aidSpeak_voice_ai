import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Sentry configuration for AidSpeak Emergency Reporter
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE || 'development';
const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Initialize Sentry for comprehensive error monitoring and performance tracking
 * Critical for emergency applications where reliability is paramount
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error monitoring will be disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    
    // Performance monitoring
    integrations: [
      new BrowserTracing({
        // Track navigation and user interactions
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
        // Track specific emergency app interactions
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.supabase\.co/,
          /^https:\/\/api\.elevenlabs\.io/,
          /^https:\/\/translation\.googleapis\.com/,
        ],
      }),
    ],

    // Sample rates for production optimization
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Enhanced error filtering for emergency app context
    beforeSend(event, hint) {
      // Don't send errors for expected scenarios
      if (event.exception) {
        const error = hint.originalException;
        
        // Filter out expected microphone permission denials
        if (error instanceof Error && 
            error.message.includes('microphone access denied')) {
          return null;
        }
        
        // Filter out network timeouts (common in emergency situations)
        if (error instanceof Error && 
            error.message.includes('timeout')) {
          // Still log but with lower severity
          event.level = 'warning';
        }
      }
      
      return event;
    },

    // Enhanced user context for emergency scenarios
    initialScope: {
      tags: {
        component: 'emergency-reporter',
        feature: 'multilingual-voice',
      },
      contexts: {
        app: {
          name: 'AidSpeak',
          version: RELEASE,
          type: 'emergency-pwa',
        },
      },
    },

    // Privacy-conscious settings for emergency app
    sendDefaultPii: false,
    attachStacktrace: true,
    
    // Enhanced debugging in development
    debug: ENVIRONMENT === 'development',
  });

  console.log(`✅ Sentry initialized for ${ENVIRONMENT} environment`);
}

/**
 * Enhanced error boundary for emergency app components
 */
export const SentryErrorBoundary = Sentry.withErrorBoundary;

/**
 * Track emergency-specific events
 */
export function trackEmergencyEvent(
  eventName: string, 
  data: Record<string, any> = {},
  level: 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.addBreadcrumb({
    message: eventName,
    category: 'emergency',
    level,
    data: {
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
}

/**
 * Track voice recording events with privacy protection
 */
export function trackVoiceEvent(
  action: 'start' | 'stop' | 'success' | 'error',
  metadata: {
    duration?: number;
    language?: string;
    confidence?: number;
    hasTranslation?: boolean;
    errorType?: string;
  } = {}
) {
  trackEmergencyEvent(`voice_recording_${action}`, {
    action,
    duration: metadata.duration,
    detectedLanguage: metadata.language,
    confidence: metadata.confidence ? Math.round(metadata.confidence * 100) : undefined,
    hasTranslation: metadata.hasTranslation,
    errorType: metadata.errorType,
  });
}

/**
 * Track translation events
 */
export function trackTranslationEvent(
  action: 'start' | 'success' | 'error',
  metadata: {
    sourceLanguage?: string;
    targetLanguage?: string;
    confidence?: number;
    textLength?: number;
    errorType?: string;
  } = {}
) {
  trackEmergencyEvent(`translation_${action}`, {
    action,
    sourceLanguage: metadata.sourceLanguage,
    targetLanguage: metadata.targetLanguage,
    confidence: metadata.confidence ? Math.round(metadata.confidence * 100) : undefined,
    textLength: metadata.textLength,
    errorType: metadata.errorType,
  });
}

/**
 * Track emergency report submissions
 */
export function trackReportSubmission(
  status: 'success' | 'error',
  metadata: {
    emergencyType?: string;
    hasLocation?: boolean;
    hasTranslation?: boolean;
    processingTime?: number;
    errorType?: string;
  } = {}
) {
  trackEmergencyEvent(`report_submission_${status}`, {
    status,
    emergencyType: metadata.emergencyType,
    hasLocation: metadata.hasLocation,
    hasTranslation: metadata.hasTranslation,
    processingTime: metadata.processingTime,
    errorType: metadata.errorType,
  }, status === 'error' ? 'error' : 'info');
}

/**
 * Track TTS events
 */
export function trackTTSEvent(
  action: 'generate' | 'play' | 'error',
  metadata: {
    voiceId?: string;
    textLength?: number;
    cached?: boolean;
    errorType?: string;
  } = {}
) {
  trackEmergencyEvent(`tts_${action}`, {
    action,
    voiceId: metadata.voiceId,
    textLength: metadata.textLength,
    cached: metadata.cached,
    errorType: metadata.errorType,
  });
}

/**
 * Set user context for emergency scenarios (privacy-conscious)
 */
export function setEmergencyUserContext(context: {
  sessionId?: string;
  preferredLanguage?: string;
  hasLocationAccess?: boolean;
  hasMicrophoneAccess?: boolean;
}) {
  Sentry.setUser({
    id: context.sessionId,
  });
  
  Sentry.setTags({
    preferredLanguage: context.preferredLanguage,
    hasLocationAccess: context.hasLocationAccess,
    hasMicrophoneAccess: context.hasMicrophoneAccess,
  });
}

/**
 * Capture performance metrics for emergency app
 */
export function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name: operationName,
    op: 'emergency-operation',
  });

  return operation()
    .then((result) => {
      transaction.setStatus('ok');
      return result;
    })
    .catch((error) => {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
}

// Export Sentry for direct use when needed
export { Sentry };
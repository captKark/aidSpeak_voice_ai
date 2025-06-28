import React from 'react';
import { CheckCircle, Clock, MapPin, MessageSquare, Languages, Globe, Edit, Send } from 'lucide-react';
import { EmergencyReport } from '../types/emergency';
import TTSPlayer from './TTSPlayer';

interface ReportSummaryProps {
  report: EmergencyReport;
  onSubmit: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

const emergencyTypeLabels = {
  'medical': 'Medical Emergency',
  'fire': 'Fire Emergency',
  'natural-disaster': 'Natural Disaster',
  'crime': 'Crime in Progress',
  'accident': 'Accident',
  'other': 'Other Emergency'
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

export default function ReportSummary({ report, onSubmit, onEdit, isSubmitting }: ReportSummaryProps) {
  const hasTranslation = report.translatedText && 
                        report.translatedText !== report.originalText && 
                        report.translationStatus === 'completed';

  const showTranslationWarning = report.translationStatus === 'low_confidence' || 
                                report.translationStatus === 'failed';

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="neo-container bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Emergency Report Summary</h2>
          <div className="neo-circle w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Emergency Type */}
          <div className="neo-card p-6 rounded-2xl">
            <div className="flex items-start space-x-4">
              <div className="neo-circle w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">Emergency Type</p>
                <p className="text-xl font-bold text-gray-800">
                  {emergencyTypeLabels[report.emergencyType]}
                </p>
              </div>
            </div>
          </div>

          {/* Original Message */}
          <div className="neo-card p-6 rounded-2xl">
            <div className="flex items-start space-x-4">
              <MessageSquare className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {hasTranslation ? 'Original Message' : 'Voice Report'}
                  </p>
                  {report.sourceLanguage && report.sourceLanguage !== 'en' && (
                    <span className="neo-badge bg-blue-100 text-blue-800">
                      <Globe className="w-3 h-3" />
                      <span>{getLanguageName(report.sourceLanguage)}</span>
                    </span>
                  )}
                </div>
                <div className="neo-card-inset p-4 rounded-xl">
                  <p className="text-gray-800 font-medium leading-relaxed">
                    {report.originalText || 'No transcription available'}
                  </p>
                </div>
                {report.confidence > 0 && (
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    Speech confidence: {Math.round(report.confidence * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Translation with TTS */}
          {hasTranslation && (
            <div className="neo-card p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <div className="flex items-start space-x-4">
                <Languages className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">English Translation</p>
                      {report.translationConfidence && (
                        <span className="text-xs font-semibold text-green-600">
                          {Math.round(report.translationConfidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    
                    {/* TTS Player for English Translation */}
                    <TTSPlayer
                      text={report.translatedText}
                      voiceId="rachel"
                      className="ml-4"
                      onPlayStart={() => console.log('Started playing translated report')}
                      onPlayEnd={() => console.log('Finished playing translated report')}
                      onError={(error) => console.error('TTS Error:', error)}
                    />
                  </div>
                  
                  <div className="neo-card-inset p-4 rounded-xl bg-white/80">
                    <p className="text-gray-800 font-semibold leading-relaxed">
                      {report.translatedText}
                    </p>
                  </div>
                  
                  {/* TTS Accessibility Notice */}
                  <div className="mt-3 p-3 rounded-lg bg-green-100 border border-green-200">
                    <p className="text-xs text-green-700 font-medium">
                      🔊 <strong>Accessibility:</strong> Click "Listen" to hear this translation spoken aloud with natural voice synthesis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Translation Warning */}
          {showTranslationWarning && (
            <div className="neo-card-warning p-6 rounded-2xl">
              <div className="flex items-start space-x-4">
                <Languages className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800 mb-2">Translation Notice</p>
                  <p className="text-yellow-700 font-medium leading-relaxed">
                    {report.translationStatus === 'failed' 
                      ? 'Translation was not available. The original message will be sent to emergency responders.'
                      : 'Translation confidence is low. Both original and translated messages will be sent to ensure accuracy.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="neo-card p-6 rounded-2xl">
            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Location</p>
                {report.locationData ? (
                  <div className="space-y-1">
                    <p className="text-gray-800 font-mono text-sm">
                      {report.locationData.latitude.toFixed(6)}, {report.locationData.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      Accuracy: ±{Math.round(report.locationData.accuracy)}m
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 font-medium">Location not available</p>
                )}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="neo-card p-6 rounded-2xl">
            <div className="flex items-start space-x-4">
              <Clock className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Time</p>
                <p className="text-gray-800 font-medium">
                  {report.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons with Enhanced Design */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button
            onClick={onEdit}
            disabled={isSubmitting}
            className="gradient-button-edit flex-1 group"
          >
            <Edit className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span>Edit Report</span>
          </button>
          
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="gradient-button-submit flex-1 group"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <span>Submit Emergency Report</span>
              </>
            )}
          </button>
        </div>

        {/* Enhanced Accessibility Notice */}
        <div className="neo-card-info p-6 rounded-2xl mt-6">
          <p className="text-sm text-blue-800 font-medium leading-relaxed">
            <strong>Accessibility Features:</strong> This report includes voice synthesis for translated text to assist users with limited literacy. 
            {hasTranslation && ' Both original and English texts are included for emergency responders.'}
            {' '}Audio playback helps ensure you understand exactly what will be sent to emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}
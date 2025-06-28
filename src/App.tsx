import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw, FileText, Settings, Download, HelpCircle, X } from 'lucide-react';
import VoiceRecorder from './components/VoiceRecorder';
import EmergencySelector from './components/EmergencySelector';
import LocationHandler from './components/LocationHandler';
import ReportSummary from './components/ReportSummary';
import SupabaseStatus from './components/SupabaseStatus';
import { useEmergencyReport } from './hooks/useEmergencyReport';
import { EmergencyType, TranslationResult } from './types/emergency';

type AppState = 'recording' | 'selecting' | 'reviewing' | 'submitted' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('recording');
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<EmergencyType | null>(null);
  const [locationData, setLocationData] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [currentTranslationResult, setCurrentTranslationResult] = useState<TranslationResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  const { report, isSubmitting, createReport, submitReport, resetReport } = useEmergencyReport();

  const handleRecordingComplete = (
    transcription: string, 
    audioBlob: Blob, 
    confidence: number, 
    translationResult?: TranslationResult
  ) => {
    console.log('Recording completed:', {
      transcription: transcription,
      hasAudio: !!audioBlob,
      confidence: confidence,
      translationResult: translationResult
    });
    
    setCurrentTranscription(transcription);
    setCurrentAudioBlob(audioBlob);
    setCurrentConfidence(confidence);
    setCurrentTranslationResult(translationResult || null);
    setAppState('selecting');
  };

  const handleEmergencyTypeSelect = (type: EmergencyType) => {
    setSelectedEmergencyType(type);
    
    if (currentTranscription && currentAudioBlob) {
      console.log('Creating report with:', {
        originalText: currentTranscription,
        englishText: currentTranslationResult?.translatedText,
        sourceLanguage: currentTranslationResult?.sourceLanguage,
        emergencyType: type,
        hasLocation: !!locationData
      });
      
      const newReport = createReport(
        currentTranscription,
        currentAudioBlob,
        currentConfidence,
        type,
        locationData || undefined,
        currentTranslationResult || undefined
      );
      setAppState('reviewing');
    }
  };

  // Handle emergency type selection from first page
  const handleEmergencyTypeSelectFromFirstPage = (type: EmergencyType) => {
    setSelectedEmergencyType(type);
    // Don't advance to next step, just store the selection
  };

  const handleSubmitReport = async () => {
    if (!report) return;
    
    console.log('Submitting multilingual emergency report:', {
      originalText: report.originalText,
      translatedText: report.translatedText,
      sourceLanguage: report.sourceLanguage,
      emergencyType: report.emergencyType
    });
    
    const success = await submitReport(report);
    
    if (success) {
      console.log('✅ Multilingual emergency report submitted successfully to database');
      setAppState('submitted');
      setTimeout(() => {
        handleStartOver();
      }, 5000);
    } else {
      console.error('❌ Failed to submit multilingual emergency report');
      setAppState('error');
    }
  };

  const handleEditReport = () => {
    setAppState('recording');
  };

  const handleBackToRecording = () => {
    setAppState('recording');
  };

  const handleBackToSelection = () => {
    setSelectedEmergencyType(null);
    setAppState('selecting');
  };

  const handleStartOver = () => {
    setAppState('recording');
    setSelectedEmergencyType(null);
    setCurrentTranscription('');
    setCurrentAudioBlob(null);
    setCurrentConfidence(0);
    setCurrentTranslationResult(null);
    resetReport();
  };

  const getCurrentStep = () => {
    switch (appState) {
      case 'recording': return 1;
      case 'selecting': return 2;
      case 'reviewing': return 3;
      default: return 1;
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return FileText;
      case 2: return Settings;
      case 3: return Download;
      default: return FileText;
    }
  };

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1: return 'Record';
      case 2: return 'Select Type';
      case 3: return 'Review & Submit';
      default: return 'Record';
    }
  };

  const getNavigationButtons = () => {
    switch (appState) {
      case 'selecting':
        return (
          <div className="navigation-container">
            <button
              onClick={handleBackToRecording}
              className="nav-button nav-button-back group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Previous</span>
            </button>
            <div className="step-indicator">
              <span className="step-text">Step 2 of 3</span>
            </div>
            <div className="nav-spacer" />
          </div>
        );
      
      case 'reviewing':
        return (
          <div className="navigation-container">
            <button
              onClick={handleBackToSelection}
              className="nav-button nav-button-back group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Previous</span>
            </button>
            <div className="step-indicator">
              <span className="step-text">Step 3 of 3</span>
            </div>
            <div className="nav-spacer" />
          </div>
        );
      
      case 'error':
        return (
          <div className="navigation-container justify-center">
            <button
              onClick={handleStartOver}
              className="nav-button nav-button-back group"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Start Over</span>
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepIndicators = () => {
    if (appState === 'submitted' || appState === 'error') {
      return null;
    }

    const currentStep = getCurrentStep();

    return (
      <div className="step-indicators">
        {[1, 2, 3].map((step) => {
          const StepIcon = getStepIcon(step);
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          
          return (
            <React.Fragment key={step}>
              <div className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-circle">
                  <StepIcon className="w-5 h-5" />
                </div>
                <span className="step-label">{getStepLabel(step)}</span>
              </div>
              {step < 3 && (
                <div className={`step-connector ${step < currentStep ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (appState) {
      case 'recording':
        return (
          <div className="content-section">
            <div className="hero-section">
              <div className="hero-card">
                <div className="logo-container">
                  <div className="logo-icon">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                </div>
                <h1 className="hero-title">
                  AidSpeak
                </h1>
                <p className="hero-subtitle">
                  Multilingual Emergency Voice Reporter
                </p>
                <div className="hero-features">
                  <div className="feature-badge">
                    <span>Speak Any Language</span>
                  </div>
                  <div className="feature-badge">
                    <span>Real-time English Translation</span>
                  </div>
                </div>
              </div>
            </div>
            
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              disabled={false}
            />
            
            <div className="instruction-card">
              <div className="instruction-content">
                <h3 className="instruction-title">
                  Press and hold to record your emergency
                </h3>
                <p className="instruction-text">
                  Speak clearly in any language - automatic English translation will be provided
                </p>
              </div>
            </div>

            {/* Emergency Categories on First Page */}
            <div className="emergency-categories-first-page">
              <EmergencySelector
                selectedType={selectedEmergencyType}
                onTypeSelect={handleEmergencyTypeSelectFromFirstPage}
                disabled={false}
              />
            </div>
          </div>
        );

      case 'selecting':
        return (
          <div className="content-section">
            {getNavigationButtons()}
            
            <div className="completion-section">
              <div className="completion-card">
                <div className="completion-icon">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="completion-title">
                  Recording Complete
                </h2>
                {currentTranscription && (
                  <div className="transcription-display">
                    <div className="transcription-section">
                      <div className="transcription-header">
                        <span className="transcription-label">
                          {currentTranslationResult?.sourceLanguage && currentTranslationResult.sourceLanguage !== 'en' 
                            ? `Original (${currentTranslationResult.sourceLanguage.toUpperCase()})` 
                            : 'Transcription'
                          }
                          {currentTranslationResult?.sourceLanguage === 'bn' && ' (বাংলা)'}
                        </span>
                      </div>
                      <p className={`transcription-text ${currentTranslationResult?.sourceLanguage === 'bn' ? 'bengali-text' : ''}`}>
                        {currentTranscription}
                      </p>
                    </div>
                    
                    {currentTranslationResult && 
                     currentTranslationResult.status === 'completed' && 
                     currentTranslationResult.translatedText !== currentTranscription && (
                      <div className="translation-section">
                        <div className="translation-header">
                          <span className="translation-label">
                            English Translation
                          </span>
                        </div>
                        <p className="translation-text english-text">
                          {currentTranslationResult.translatedText}
                        </p>
                      </div>
                    )}
                    
                    <div className="confidence-display">
                      <div className="confidence-item">
                        <span>Speech: {Math.round(currentConfidence * 100)}%</span>
                      </div>
                      {currentTranslationResult && currentTranslationResult.confidence > 0 && (
                        <div className="confidence-item">
                          <span>Translation: {Math.round(currentTranslationResult.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <EmergencySelector
              selectedType={selectedEmergencyType}
              onTypeSelect={handleEmergencyTypeSelect}
              disabled={false}
            />
          </div>
        );

      case 'reviewing':
        return (
          <div className="content-section">
            {getNavigationButtons()}
            {report ? (
              <ReportSummary
                report={report}
                onSubmit={handleSubmitReport}
                onEdit={handleEditReport}
                isSubmitting={isSubmitting}
              />
            ) : null}
          </div>
        );

      case 'submitted':
        return (
          <div className="content-section">
            <div className="success-card">
              <div className="success-animation">
                <div className="success-icon">
                  <CheckCircle className="w-20 h-20" />
                </div>
                <div className="success-ripple" />
                <div className="success-ripple delay-1" />
                <div className="success-ripple delay-2" />
              </div>
              <div className="success-content">
                <h2 className="success-title">
                  Emergency Report Submitted Successfully
                </h2>
                <p className="success-message">
                  Your multilingual emergency report has been received with automatic translation.<br />
                  <strong>Help is on the way.</strong>
                </p>
                {report?.translatedText && report.translatedText !== report.originalText && (
                  <div className="success-feature">
                    <span>✓ Automatic translation to English included for emergency responders</span>
                  </div>
                )}
                <div className="report-id">
                  <span>Report ID: {report?.id}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleStartOver}
              className="button-primary-large group"
            >
              <span>Submit Another Report</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="content-section">
            {getNavigationButtons()}
            
            <div className="error-section">
              <div className="error-card">
                <div className="error-icon">
                  <XCircle className="w-20 h-20" />
                </div>
                <div className="error-content">
                  <h2 className="error-title">
                    Submission Failed
                  </h2>
                  <p className="error-message">
                    We couldn't submit your emergency report.<br />
                    Please try again or contact emergency services directly.
                  </p>
                </div>
              </div>
              
              <div className="error-actions">
                <button
                  onClick={() => setAppState('reviewing')}
                  className="button-primary group"
                >
                  <span>Try Again</span>
                  <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <button
                  onClick={handleStartOver}
                  className="button-secondary group"
                >
                  <span>Start Over</span>
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-icon">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="header-text">
              <h1 className="header-title">AidSpeak</h1>
              <p className="header-subtitle">Multilingual Emergency Reporting</p>
            </div>
          </div>
          
          <div className="header-controls">
            <SupabaseStatus className="hidden sm:flex" />
            <LocationHandler
              onLocationUpdate={setLocationData}
              className="hidden sm:flex"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="content-container">
          {getStepIndicators()}
          {renderContent()}
        </div>
      </main>

      {/* Floating Guide Button */}
      <button
        onClick={() => setShowGuide(true)}
        className="guide-fab"
        aria-label="Open multilingual guide"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Guide Modal */}
      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">How to Use AidSpeak for Multilingual Emergencies</h2>
              <button
                onClick={() => setShowGuide(false)}
                className="modal-close"
                aria-label="Close guide"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body">
              <div className="guide-step">
                <div className="guide-step-number">1</div>
                <div className="guide-step-content">
                  <h3>Record Your Emergency in Any Language</h3>
                  <p>Press and hold the red circle to record your emergency message in any language (Bengali, Hindi, Spanish, Arabic, Chinese, etc.). Speak clearly and describe your situation. The app will automatically detect your language and provide real-time English translation.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-number">2</div>
                <div className="guide-step-content">
                  <h3>Select Emergency Type</h3>
                  <p>Choose the category that best describes your emergency from the available options. This helps emergency responders understand the nature of your situation.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-number">3</div>
                <div className="guide-step-content">
                  <h3>Review and Submit</h3>
                  <p>Review your report in your original language and its English translation, then submit to emergency services. Both the original text and English translation will be stored in the database for emergency responders.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-mobile">
            <SupabaseStatus className="flex sm:hidden" />
            <LocationHandler
              onLocationUpdate={setLocationData}
              className="flex sm:hidden"
            />
          </div>
          
          <div className="footer-brand">
            <span>Built with</span>
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              Bolt.new
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
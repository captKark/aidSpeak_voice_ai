import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSentry, SentryErrorBoundary } from './lib/sentry';

// Initialize Sentry for production-ready error monitoring
initSentry();

// Enhanced error boundary for emergency app
const AppWithErrorBoundary = SentryErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Emergency App Error
        </h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          The emergency reporting app encountered an unexpected error. 
          Our team has been notified and is working to resolve this issue.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Reload App
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          For immediate emergency assistance, please call your local emergency number (911, 112, etc.)
        </p>
      </div>
    </div>
  ),
  showDialog: false,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithErrorBoundary />
  </StrictMode>
);
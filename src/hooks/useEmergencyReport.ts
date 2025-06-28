import { useState } from 'react';
import { EmergencyReport, EmergencyType, TranslationResult } from '../types/emergency';
import { supabase } from '../lib/supabase';

export function useEmergencyReport() {
  const [report, setReport] = useState<EmergencyReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReport = (
    transcription: string,
    audioBlob: Blob,
    confidence: number,
    emergencyType: EmergencyType,
    locationData?: { latitude: number; longitude: number; accuracy: number },
    translationResult?: TranslationResult
  ) => {
    const newReport: EmergencyReport = {
      id: crypto.randomUUID(),
      audioBlob,
      originalText: transcription,
      translatedText: translationResult?.translatedText,
      sourceLanguage: translationResult?.sourceLanguage,
      translationStatus: translationResult?.status,
      translationConfidence: translationResult?.confidence,
      emergencyType,
      locationData,
      timestamp: new Date(),
      confidence
    };

    setReport(newReport);
    return newReport;
  };

  const submitReport = async (reportToSubmit: EmergencyReport): Promise<boolean> => {
    setIsSubmitting(true);
    
    try {
      // Convert audio blob to array buffer for database storage
      const audioArrayBuffer = await reportToSubmit.audioBlob?.arrayBuffer();
      
      if (!audioArrayBuffer) {
        throw new Error('No audio data available');
      }

      console.log('Submitting multilingual emergency report:', {
        original_text: reportToSubmit.originalText,
        translated_text: reportToSubmit.translatedText,
        source_language: reportToSubmit.sourceLanguage,
        translation_status: reportToSubmit.translationStatus,
        emergency_type: reportToSubmit.emergencyType
      });

      // Insert the emergency report into Supabase with both original and translated text
      const { data, error } = await supabase
        .from('emergency_reports')
        .insert({
          report_id: reportToSubmit.id,
          audio_blob: audioArrayBuffer,
          original_text: reportToSubmit.originalText, // Original language text
          translated_text: reportToSubmit.translatedText || null, // English translation
          source_language: reportToSubmit.sourceLanguage || null, // Detected language
          translation_status: reportToSubmit.translationStatus || 'pending',
          translation_confidence: reportToSubmit.translationConfidence || null,
          emergency_type: reportToSubmit.emergencyType,
          location_data: reportToSubmit.locationData || null,
          timestamp: reportToSubmit.timestamp.toISOString(),
          blockchain_hash: null // Will be implemented later
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Multilingual emergency report submitted successfully:', {
        report_id: data.report_id,
        original_text_length: data.original_text?.length || 0,
        translated_text_length: data.translated_text?.length || 0,
        source_language: data.source_language,
        translation_status: data.translation_status,
        emergency_type: data.emergency_type,
        timestamp: data.timestamp
      });

      // Verify both texts were stored
      if (data.original_text && data.translated_text) {
        console.log('✅ Both original and English texts successfully stored in database');
      } else if (data.original_text) {
        console.log('✅ Original text stored, English translation may not be available');
      } else {
        console.warn('⚠️ No text data found in stored report');
      }

      return true;
    } catch (error) {
      console.error('Error submitting multilingual report:', error);
      
      // Check if it's a connection error
      if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
        console.error('Supabase is not properly configured. Please connect your Supabase project.');
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetReport = () => {
    setReport(null);
  };

  return {
    report,
    isSubmitting,
    createReport,
    submitReport,
    resetReport
  };
}
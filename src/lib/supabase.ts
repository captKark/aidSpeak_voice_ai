import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on your schema
export interface EmergencyReportDB {
  report_id: string;
  audio_blob: ArrayBuffer;
  original_text: string;
  translated_text?: string;
  source_language?: string;
  translation_status?: string;
  translation_confidence?: number;
  emergency_type: string;
  location_data?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp?: string;
  blockchain_hash?: string;
}
/*
  # Add Translation Support to Emergency Reports

  1. New Columns
    - `translated_text` (text, nullable) - English translation of the original message
    - `source_language` (varchar(10), nullable) - ISO language code of detected source language
    - `translation_status` (varchar(20), nullable) - Status of translation process
    - `translation_confidence` (decimal, nullable) - Confidence score of translation

  2. Security
    - No changes to existing RLS policies
    - New columns inherit existing table permissions

  3. Changes
    - Add translation-related columns to emergency_reports table
    - Set appropriate defaults and constraints
*/

-- Add translation support columns to emergency_reports table
DO $$
BEGIN
  -- Add translated_text column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emergency_reports' AND column_name = 'translated_text'
  ) THEN
    ALTER TABLE emergency_reports ADD COLUMN translated_text text;
  END IF;

  -- Add source_language column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emergency_reports' AND column_name = 'source_language'
  ) THEN
    ALTER TABLE emergency_reports ADD COLUMN source_language varchar(10);
  END IF;

  -- Add translation_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emergency_reports' AND column_name = 'translation_status'
  ) THEN
    ALTER TABLE emergency_reports ADD COLUMN translation_status varchar(20) DEFAULT 'pending';
  END IF;

  -- Add translation_confidence column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emergency_reports' AND column_name = 'translation_confidence'
  ) THEN
    ALTER TABLE emergency_reports ADD COLUMN translation_confidence decimal(3,2);
  END IF;
END $$;

-- Add check constraint for translation_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'emergency_reports_translation_status_check'
  ) THEN
    ALTER TABLE emergency_reports 
    ADD CONSTRAINT emergency_reports_translation_status_check 
    CHECK (translation_status IN ('pending', 'completed', 'failed', 'not_required', 'low_confidence'));
  END IF;
END $$;

-- Add check constraint for translation_confidence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'emergency_reports_translation_confidence_check'
  ) THEN
    ALTER TABLE emergency_reports 
    ADD CONSTRAINT emergency_reports_translation_confidence_check 
    CHECK (translation_confidence >= 0.0 AND translation_confidence <= 1.0);
  END IF;
END $$;

-- Create index for translation queries
CREATE INDEX IF NOT EXISTS idx_emergency_reports_translation_status 
ON emergency_reports(translation_status);

CREATE INDEX IF NOT EXISTS idx_emergency_reports_source_language 
ON emergency_reports(source_language);
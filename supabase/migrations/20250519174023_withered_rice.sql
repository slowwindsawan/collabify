/*
  # Add name column to documents table

  1. Changes
    - Add 'name' column to documents table
    - Set default value to file_name
    - Make it non-nullable
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE documents 
    ADD COLUMN name text NOT NULL DEFAULT '';

    -- Update existing records to use file_name as name
    UPDATE documents 
    SET name = file_name 
    WHERE name = '';
  END IF;
END $$;
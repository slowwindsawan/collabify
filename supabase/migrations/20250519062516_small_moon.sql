/*
  # Add description column to knowledge_bases table

  1. Changes
    - Add 'description' column to knowledge_bases table
    - Set default value to empty string
    - Make it non-nullable
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_bases' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE knowledge_bases 
    ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;
END $$;
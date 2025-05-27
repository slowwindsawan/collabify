/*
  # Update RLS policies for document vectors

  1. Changes
    - Drop existing RLS policies on document_vectors table
    - Add new policies to allow:
      - Users to create vectors for their documents
      - Users to delete their own document vectors
      - Users to view their own document vectors
    - Add policy for service role access

  2. Security
    - Enable RLS on document_vectors table
    - Add policies for authenticated users
    - Add policy for service role access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create vectors for their documents" ON document_vectors;
DROP POLICY IF EXISTS "Users can delete their own document vectors" ON document_vectors;
DROP POLICY IF EXISTS "Users can view their own document vectors" ON document_vectors;

-- Create new policies
CREATE POLICY "Users can create vectors for their documents"
ON document_vectors
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_id
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own document vectors"
ON document_vectors
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_id
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own document vectors"
ON document_vectors
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_id
    AND d.user_id = auth.uid()
  )
);

-- Add policy for service role access
CREATE POLICY "Service role has full access"
ON document_vectors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
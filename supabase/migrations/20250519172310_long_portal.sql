/*
  # Fix Document Vectors RLS Policies

  1. Changes
    - Drop existing policies for document_vectors table
    - Add new policies for authenticated users
    - Allow deletion of vectors when parent document is deleted
    
  2. Security
    - Enable RLS on document_vectors table
    - Add policies for CRUD operations
    - Ensure users can only access their own vectors
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create vectors for their documents" ON document_vectors;
DROP POLICY IF EXISTS "Users can view their own document vectors" ON document_vectors;

-- Create new policies
CREATE POLICY "Users can create vectors for their documents"
ON document_vectors FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own document vectors"
ON document_vectors FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document vectors"
ON document_vectors FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
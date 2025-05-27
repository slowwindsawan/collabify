/*
  # Fix Document RLS Policies

  1. Changes
    - Drop all existing document policies
    - Create new policies with proper ownership checks
    - Ensure users can only access documents in their knowledge bases
    
  2. Security
    - Verify knowledge base ownership for all operations
    - Link documents to authenticated users
    - Add proper USING and WITH CHECK clauses
*/

-- First drop all existing policies
DROP POLICY IF EXISTS "Users can create documents in their knowledge bases" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;

-- Create new policies with proper ownership checks
CREATE POLICY "Users can create documents in their knowledge bases" 
ON documents
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM knowledge_bases kb 
    WHERE kb.id = documents.kb_id 
    AND kb.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Users can view documents in their knowledge bases"
ON documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM knowledge_bases kb 
    WHERE kb.id = documents.kb_id 
    AND kb.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update documents in their knowledge bases"
ON documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM knowledge_bases kb 
    WHERE kb.id = documents.kb_id 
    AND kb.user_id = auth.uid()
  )
  AND auth.uid() = user_id
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM knowledge_bases kb 
    WHERE kb.id = documents.kb_id 
    AND kb.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Users can delete documents in their knowledge bases"
ON documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM knowledge_bases kb 
    WHERE kb.id = documents.kb_id 
    AND kb.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);
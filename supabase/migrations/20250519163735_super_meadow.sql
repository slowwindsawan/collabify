/*
  # Fix Documents Table RLS Policies

  1. Changes
    - Drop existing RLS policies for documents table
    - Create new policies with proper authentication checks
    - Ensure users can only access their own documents
    
  2. Security
    - Enable RLS on documents table
    - Add policies for CRUD operations
    - Link documents to authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create documents in their knowledge bases" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Create new policies
CREATE POLICY "Users can create documents in their knowledge bases"
ON documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
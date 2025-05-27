/*
  # Fix knowledge base RLS policies

  1. Changes
    - Enable RLS on knowledge_bases table
    - Add policies for CRUD operations
    - Ensure authenticated users can only access their own knowledge bases
    - Link knowledge bases to authenticated users

  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - Create knowledge bases (with their user_id)
      - Read their own knowledge bases
      - Update their own knowledge bases
      - Delete their own knowledge bases
*/

-- Enable RLS
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON knowledge_bases;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON knowledge_bases;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON knowledge_bases;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON knowledge_bases;

-- Create new policies
CREATE POLICY "Users can create knowledge bases"
ON knowledge_bases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their knowledge bases"
ON knowledge_bases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their knowledge bases"
ON knowledge_bases FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their knowledge bases"
ON knowledge_bases FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
/*
  # Fix Knowledge Base RLS Policies

  1. Changes
    - Drop existing RLS policies for knowledge_bases table
    - Create new policies with correct auth checks using auth.uid()
    
  2. Security
    - Enable RLS on knowledge_bases table
    - Add policies for CRUD operations
    - Ensure users can only access their own knowledge bases
    - Use auth.uid() for user verification
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own knowledge bases" ON knowledge_bases;
DROP POLICY IF EXISTS "Users can delete their own knowledge bases" ON knowledge_bases;
DROP POLICY IF EXISTS "Users can update their own knowledge bases" ON knowledge_bases;
DROP POLICY IF EXISTS "Users can view their own knowledge bases" ON knowledge_bases;

-- Create new policies using auth.uid()
CREATE POLICY "Enable insert for authenticated users only" 
ON knowledge_bases FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable select for users based on user_id" 
ON knowledge_bases FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable update for users based on user_id" 
ON knowledge_bases FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable delete for users based on user_id" 
ON knowledge_bases FOR DELETE 
TO authenticated 
USING (auth.uid()::text = user_id::text);
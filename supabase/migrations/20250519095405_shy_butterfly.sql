/*
  # Update Knowledge Base Policies for Anonymous Access
  
  1. Changes
    - Drop existing policies
    - Add new policies allowing anonymous access for select operations
    - Maintain insert/update/delete restrictions based on user existence
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow creation if user exists" ON knowledge_bases;
DROP POLICY IF EXISTS "Allow viewing knowledge bases if user exists" ON knowledge_bases;
DROP POLICY IF EXISTS "Allow updating own knowledge bases" ON knowledge_bases;
DROP POLICY IF EXISTS "Allow deleting own knowledge bases" ON knowledge_bases;

-- Create new policies
CREATE POLICY "Allow creation if user exists"
ON knowledge_bases FOR INSERT
TO public
WITH CHECK (check_user_exists(user_id));

CREATE POLICY "Allow viewing knowledge bases"
ON knowledge_bases FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow updating if user exists and owns"
ON knowledge_bases FOR UPDATE
TO public
USING (check_user_exists(user_id) AND user_id = auth.uid());

CREATE POLICY "Allow deleting if user exists and owns"
ON knowledge_bases FOR DELETE
TO public
USING (check_user_exists(user_id) AND user_id = auth.uid());
/*
  # Fix Knowledge Base Fetching

  1. Changes
    - Update RLS policies to allow fetching knowledge bases by user_id
    - Remove auth.uid() check from select policy
*/

-- Drop existing policies
drop policy if exists "Allow viewing own knowledge bases" on knowledge_bases;

-- Create new policy for fetching knowledge bases
create policy "Allow viewing knowledge bases if user exists"
on knowledge_bases for select
using (check_user_exists(user_id));
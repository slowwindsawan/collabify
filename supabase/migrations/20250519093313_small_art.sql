/*
  # Fix Knowledge Base Creation Policies

  1. Changes
    - Update RLS policies to allow creation based on user existence
    - Remove authentication requirements
    - Add function to verify user existence
*/

-- Create function to check if user exists
create or replace function public.check_user_exists(user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.users
    where id = user_id
  );
end;
$$;

-- Drop existing policies
drop policy if exists "Users can create knowledge bases" on knowledge_bases;
drop policy if exists "Users can view their knowledge bases" on knowledge_bases;
drop policy if exists "Users can update their knowledge bases" on knowledge_bases;
drop policy if exists "Users can delete their knowledge bases" on knowledge_bases;

-- Create new policies
create policy "Allow creation if user exists"
on knowledge_bases for insert
with check (
  check_user_exists(user_id)
);

create policy "Allow viewing own knowledge bases"
on knowledge_bases for select
using (
  check_user_exists(user_id) and
  user_id = auth.uid()
);

create policy "Allow updating own knowledge bases"
on knowledge_bases for update
using (
  check_user_exists(user_id) and
  user_id = auth.uid()
);

create policy "Allow deleting own knowledge bases"
on knowledge_bases for delete
using (
  check_user_exists(user_id) and
  user_id = auth.uid()
);
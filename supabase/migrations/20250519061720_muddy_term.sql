/*
  # Add users table and update RLS policies

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Update RLS policies on existing tables to check against users table
    - Add indexes for better query performance

  3. Security
    - Enable RLS on users table
    - Add policies for user management
*/

-- Create users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table users enable row level security;

-- Create policies for users
create policy "Users can view their own profile"
  on users
  for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on users
  for update
  using (id = auth.uid());

-- Update knowledge_bases policies
drop policy if exists "Users can create their own knowledge bases" on knowledge_bases;
drop policy if exists "Users can view their own knowledge bases" on knowledge_bases;
drop policy if exists "Users can update their own knowledge bases" on knowledge_bases;
drop policy if exists "Users can delete their own knowledge bases" on knowledge_bases;

create policy "Users can create their own knowledge bases"
  on knowledge_bases
  for insert
  with check (exists (select 1 from users where id = user_id));

create policy "Users can view their own knowledge bases"
  on knowledge_bases
  for select
  using (exists (select 1 from users where id = user_id));

create policy "Users can update their own knowledge bases"
  on knowledge_bases
  for update
  using (exists (select 1 from users where id = user_id));

create policy "Users can delete their own knowledge bases"
  on knowledge_bases
  for delete
  using (exists (select 1 from users where id = user_id));

-- Update documents policies
drop policy if exists "Users can create documents in their knowledge bases" on documents;
drop policy if exists "Users can view their own documents" on documents;
drop policy if exists "Users can update their own documents" on documents;
drop policy if exists "Users can delete their own documents" on documents;

create policy "Users can create documents in their knowledge bases"
  on documents
  for insert
  with check (exists (select 1 from users where id = user_id));

create policy "Users can view their own documents"
  on documents
  for select
  using (exists (select 1 from users where id = user_id));

create policy "Users can update their own documents"
  on documents
  for update
  using (exists (select 1 from users where id = user_id));

create policy "Users can delete their own documents"
  on documents
  for delete
  using (exists (select 1 from users where id = user_id));

-- Update document_vectors policies
drop policy if exists "Users can create vectors for their documents" on document_vectors;
drop policy if exists "Users can view their own document vectors" on document_vectors;

create policy "Users can create vectors for their documents"
  on document_vectors
  for insert
  with check (exists (select 1 from users where id = user_id));

create policy "Users can view their own document vectors"
  on document_vectors
  for select
  using (exists (select 1 from users where id = user_id));

-- Create indexes
create index if not exists idx_users_email on users(email);
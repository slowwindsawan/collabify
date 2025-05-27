/*
  # Knowledge Base System Schema

  1. New Tables
    - `knowledge_bases`: Stores user knowledge bases
    - `documents`: Stores document metadata and content
    - `document_vectors`: Stores document chunks and embeddings
    - `storage.buckets`: Creates required storage buckets

  2. Extensions
    - Enable `vector` extension for similarity search
    - Enable `http` extension for external API calls

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Set up storage bucket policies
*/

-- Enable required extensions
create extension if not exists "vector";
create extension if not exists "http";

-- Create storage buckets
insert into storage.buckets (id, name)
values ('kb-files', 'kb-files')
on conflict do nothing;

insert into storage.buckets (id, name)
values ('session-files', 'session-files')
on conflict do nothing;

-- Create knowledge_bases table
create table if not exists knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  kb_id uuid not null references knowledge_bases(id) on delete cascade,
  user_id uuid not null,
  file_path text not null,
  file_name text not null,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create document_vectors table with vector support
create table if not exists document_vectors (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null,
  kb_id uuid not null references knowledge_bases(id) on delete cascade,
  chunk_index integer not null,
  chunk_text text not null,
  vector vector(1536),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table knowledge_bases enable row level security;
alter table documents enable row level security;
alter table document_vectors enable row level security;

-- Create policies for knowledge_bases
create policy "Users can create their own knowledge bases"
  on knowledge_bases
  for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own knowledge bases"
  on knowledge_bases
  for select
  using (auth.uid() = user_id);

create policy "Users can update their own knowledge bases"
  on knowledge_bases
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own knowledge bases"
  on knowledge_bases
  for delete
  using (auth.uid() = user_id);

-- Create policies for documents
create policy "Users can create documents in their knowledge bases"
  on documents
  for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own documents"
  on documents
  for select
  using (auth.uid() = user_id);

create policy "Users can update their own documents"
  on documents
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on documents
  for delete
  using (auth.uid() = user_id);

-- Create policies for document_vectors
create policy "Users can create vectors for their documents"
  on document_vectors
  for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own document vectors"
  on document_vectors
  for select
  using (auth.uid() = user_id);

-- Create storage policies
create policy "Users can upload files"
  on storage.objects
  for insert
  with check (bucket_id in ('kb-files', 'session-files') and auth.uid() = owner);

create policy "Users can view their own files"
  on storage.objects
  for select
  using (bucket_id in ('kb-files', 'session-files') and auth.uid() = owner);

create policy "Users can update their own files"
  on storage.objects
  for update
  using (bucket_id in ('kb-files', 'session-files') and auth.uid() = owner);

create policy "Users can delete their own files"
  on storage.objects
  for delete
  using (bucket_id in ('kb-files', 'session-files') and auth.uid() = owner);

-- Create indexes for better query performance
create index if not exists idx_kb_user on knowledge_bases(user_id);
create index if not exists idx_doc_user_kb on documents(user_id, kb_id);
create index if not exists idx_vectors_user_kb on document_vectors(user_id, kb_id);
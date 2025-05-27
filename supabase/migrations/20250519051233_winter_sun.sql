/*
  # Vector Similarity Search Function
  
  Creates a stored procedure for finding similar document chunks
  using pgvector's cosine similarity.
*/

create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_kb_id uuid
)
returns table (
  chunk_text text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dv.chunk_text,
    1 - (dv.vector <=> query_embedding) as similarity
  from document_vectors dv
  where dv.user_id = p_user_id
    and dv.kb_id = p_kb_id
    and 1 - (dv.vector <=> query_embedding) > match_threshold
  order by dv.vector <=> query_embedding
  limit match_count;
end;
$$;
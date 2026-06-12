-- PL/pgSQL helper to drop any existing foreign key constraint and recreate it with ON DELETE CASCADE
CREATE OR REPLACE FUNCTION make_fkey_cascade(
  p_table_name text,
  p_column_name text,
  p_target_table text,
  p_target_column text
) RETURNS void AS $$
DECLARE
  v_constraint_name text;
BEGIN
  -- Find the foreign key constraint name
  SELECT tc.constraint_name INTO v_constraint_name
  FROM information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = p_table_name
    AND kcu.column_name = p_column_name;

  -- Drop constraint if it exists
  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', p_table_name, v_constraint_name);
  END IF;

  -- Recreate constraint with ON DELETE CASCADE
  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I) ON DELETE CASCADE',
    p_table_name,
    p_table_name || '_' || p_column_name || '_fkey',
    p_column_name,
    p_target_table,
    p_target_column
  );
END;
$$ LANGUAGE plpgsql;

-- Apply cascading deletes to processing_jobs
SELECT make_fkey_cascade('processing_jobs', 'wiki_id', 'wikis', 'id');

-- Apply cascading deletes to wiki_pages
SELECT make_fkey_cascade('wiki_pages', 'wiki_id', 'wikis', 'id');

-- Apply cascading deletes to wiki_page_aliases
SELECT make_fkey_cascade('wiki_page_aliases', 'page_id', 'wiki_pages', 'id');

-- Apply cascading deletes to document_chunks
SELECT make_fkey_cascade('document_chunks', 'document_id', 'documents', 'id');

-- Apply cascading deletes to chunk_embeddings
SELECT make_fkey_cascade('chunk_embeddings', 'chunk_id', 'document_chunks', 'id');

-- Apply cascading deletes to document_images
SELECT make_fkey_cascade('document_images', 'document_id', 'documents', 'id');

-- Apply cascading deletes to page_chunk_references
SELECT make_fkey_cascade('page_chunk_references', 'page_id', 'wiki_pages', 'id');
SELECT make_fkey_cascade('page_chunk_references', 'chunk_id', 'document_chunks', 'id');

-- Apply cascading deletes to wiki_page_citations
SELECT make_fkey_cascade('wiki_page_citations', 'page_id', 'wiki_pages', 'id');
SELECT make_fkey_cascade('wiki_page_citations', 'document_id', 'documents', 'id');

-- Apply cascading deletes to documents
SELECT make_fkey_cascade('documents', 'wiki_id', 'wikis', 'id');

-- Apply cascading deletes to wiki_page_hierarchy
SELECT make_fkey_cascade('wiki_page_hierarchy', 'wiki_id', 'wikis', 'id');
SELECT make_fkey_cascade('wiki_page_hierarchy', 'parent_id', 'wiki_pages', 'id');
SELECT make_fkey_cascade('wiki_page_hierarchy', 'child_id', 'wiki_pages', 'id');

-- Clean up helper function
DROP FUNCTION make_fkey_cascade(text, text, text, text);

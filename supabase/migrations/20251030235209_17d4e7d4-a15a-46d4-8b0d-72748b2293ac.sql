-- Add foreign key constraint for author_id in documents table

-- Add foreign key for author_id referencing personnel
ALTER TABLE public.documents
  ADD CONSTRAINT documents_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES public.personnel(id) 
  ON DELETE SET NULL;

-- Add index for author_id to optimize queries
CREATE INDEX IF NOT EXISTS idx_documents_author_id 
  ON public.documents(author_id);

-- Add index for template_id if it doesn't exist (FK already exists)
CREATE INDEX IF NOT EXISTS idx_documents_template_id 
  ON public.documents(template_id);
-- Add foreign key column for classe_therapeutique to DCI table
ALTER TABLE public.dci ADD COLUMN classe_therapeutique_id UUID;

-- Add foreign key constraint
ALTER TABLE public.dci 
ADD CONSTRAINT fk_dci_classe_therapeutique 
FOREIGN KEY (classe_therapeutique_id) 
REFERENCES public.classes_therapeutiques(id) 
ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_dci_classe_therapeutique_id ON public.dci(classe_therapeutique_id);

-- Drop the old text column
ALTER TABLE public.dci DROP COLUMN classe_therapeutique;
-- Create inventory lines table for detailed inventory records
CREATE TABLE IF NOT EXISTS public.inventaire_lignes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.inventaire_sessions(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL,
  lot_id UUID,
  code_barre TEXT,
  quantite_theorique INTEGER DEFAULT 0,
  quantite_comptee INTEGER,
  quantite_ecart INTEGER GENERATED ALWAYS AS (COALESCE(quantite_comptee, 0) - quantite_theorique) STORED,
  emplacement_theorique TEXT,
  emplacement_reel TEXT,
  unite TEXT DEFAULT 'Unité',
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'compte', 'valide', 'ecart', 'rejete')),
  date_comptage TIMESTAMP WITH TIME ZONE,
  operateur_id UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory entries table for barcode scanning entries
CREATE TABLE IF NOT EXISTS public.inventaire_saisies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.inventaire_sessions(id) ON DELETE CASCADE,
  code_barre TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  emplacement TEXT,
  operateur_id UUID NOT NULL,
  date_saisie TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  produit_trouve BOOLEAN DEFAULT false,
  lot_id UUID,
  produit_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory reports table
CREATE TABLE IF NOT EXISTS public.inventaire_rapports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID REFERENCES public.inventaire_sessions(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ecarts', 'complet', 'valorisation', 'synthese')),
  format TEXT DEFAULT 'PDF' CHECK (format IN ('PDF', 'Excel', 'CSV')),
  contenu JSONB DEFAULT '{}',
  fichier_url TEXT,
  taille_fichier INTEGER,
  statut TEXT DEFAULT 'genere' CHECK (statut IN ('genere', 'envoye', 'archive')),
  genere_par_id UUID,
  date_generation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parametres JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inventaire_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaire_saisies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaire_rapports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage inventory lines in their tenant" ON public.inventaire_lignes
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage inventory entries in their tenant" ON public.inventaire_saisies
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage inventory reports in their tenant" ON public.inventaire_rapports
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventaire_lignes_session ON public.inventaire_lignes(session_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_lignes_produit ON public.inventaire_lignes(produit_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_lignes_statut ON public.inventaire_lignes(statut);
CREATE INDEX IF NOT EXISTS idx_inventaire_saisies_session ON public.inventaire_saisies(session_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_saisies_code_barre ON public.inventaire_saisies(code_barre);
CREATE INDEX IF NOT EXISTS idx_inventaire_rapports_session ON public.inventaire_rapports(session_id);

-- Update inventory sessions table to add missing fields
ALTER TABLE public.inventaire_sessions 
ADD COLUMN IF NOT EXISTS nom TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS date_creation TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'complet' CHECK (type IN ('complet', 'partiel', 'cyclique')),
ADD COLUMN IF NOT EXISTS responsable TEXT,
ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS secteurs TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progression NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS produits_comptes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS produits_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ecarts INTEGER DEFAULT 0;

-- Update existing statut check constraint
ALTER TABLE public.inventaire_sessions DROP CONSTRAINT IF EXISTS inventaire_sessions_statut_check;
ALTER TABLE public.inventaire_sessions 
ADD CONSTRAINT inventaire_sessions_statut_check 
CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'suspendue'));

-- Update default statut
ALTER TABLE public.inventaire_sessions ALTER COLUMN statut SET DEFAULT 'planifiee';

-- Create trigger for inventaire_lignes updated_at
CREATE TRIGGER update_inventaire_lignes_updated_at BEFORE UPDATE ON public.inventaire_lignes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
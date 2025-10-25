-- Créer la table documents pour la gestion documentaire
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  file_path TEXT,
  file_url TEXT,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view documents from their tenant" 
ON public.documents 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert documents in their tenant" 
ON public.documents 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update documents from their tenant" 
ON public.documents 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete documents from their tenant" 
ON public.documents 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer un trigger pour la mise à jour automatique du timestamp
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter un index pour améliorer les performances
CREATE INDEX idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);

-- Créer la table pour les catégories de documents (référentiel)
CREATE TABLE public.document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS pour les catégories
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les catégories
CREATE POLICY "Users can view document categories from their tenant" 
ON public.document_categories 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert document categories in their tenant" 
ON public.document_categories 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update document categories from their tenant" 
ON public.document_categories 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete document categories from their tenant" 
ON public.document_categories 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id() AND is_system = false);

-- Trigger pour les catégories
CREATE TRIGGER update_document_categories_updated_at
  BEFORE UPDATE ON public.document_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les catégories
CREATE INDEX idx_document_categories_tenant_id ON public.document_categories(tenant_id);

-- Insérer les catégories par défaut (système)
INSERT INTO public.document_categories (tenant_id, name, description, color, is_system) VALUES
  (gen_random_uuid(), 'Manuel', 'Manuels d''utilisation et guides', '#10b981', true),
  (gen_random_uuid(), 'Procédure', 'Procédures internes et processus', '#3b82f6', true),
  (gen_random_uuid(), 'Rapport', 'Rapports et analyses', '#f59e0b', true),
  (gen_random_uuid(), 'Certification', 'Certificats et accréditations', '#8b5cf6', true),
  (gen_random_uuid(), 'Formation', 'Documents de formation', '#ef4444', true),
  (gen_random_uuid(), 'Réglementaire', 'Documents réglementaires', '#06b6d4', true);
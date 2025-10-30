-- ============================================================================
-- MIGRATION COMPLETE: RESTORATION DE LA SECTION RÉFÉRENTIEL
-- Source: Migrations backup + analyse frontend
-- ============================================================================

-- ============================================================================
-- PHASE 1: Table formes_galeniques (avec voie_administration)
-- Source: Migration 20250907202759 + ajout colonne voie_administration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.formes_galeniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  libelle_forme TEXT NOT NULL,
  description TEXT,
  voie_administration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index unique pour éviter doublons (insensible à la casse)
CREATE UNIQUE INDEX IF NOT EXISTS formes_galeniques_tenant_libelle_unique
  ON public.formes_galeniques (tenant_id, lower(libelle_forme));

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_formes_galeniques_tenant_id 
  ON public.formes_galeniques(tenant_id);

-- Activer RLS
ALTER TABLE public.formes_galeniques ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can view formes from their tenant" ON public.formes_galeniques;
CREATE POLICY "Users can view formes from their tenant"
  ON public.formes_galeniques FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert formes in their tenant" ON public.formes_galeniques;
CREATE POLICY "Users can insert formes in their tenant"
  ON public.formes_galeniques FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can update formes from their tenant" ON public.formes_galeniques;
CREATE POLICY "Users can update formes from their tenant"
  ON public.formes_galeniques FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete formes from their tenant" ON public.formes_galeniques;
CREATE POLICY "Users can delete formes from their tenant"
  ON public.formes_galeniques FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_formes_galeniques_updated_at ON public.formes_galeniques;
CREATE TRIGGER update_formes_galeniques_updated_at
  BEFORE UPDATE ON public.formes_galeniques
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PHASE 2: Table rayons_produits (avec description)
-- Source: Migration 20250731124044 + ajout colonne description
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rayons_produits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_rayon TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_rayons_tenant_id 
  ON public.rayons_produits(tenant_id);

-- Activer RLS
ALTER TABLE public.rayons_produits ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can view rayons from their tenant" ON public.rayons_produits;
CREATE POLICY "Users can view rayons from their tenant" 
  ON public.rayons_produits FOR SELECT 
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert rayons in their tenant" ON public.rayons_produits;
CREATE POLICY "Users can insert rayons in their tenant" 
  ON public.rayons_produits FOR INSERT 
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can update rayons from their tenant" ON public.rayons_produits;
CREATE POLICY "Users can update rayons from their tenant" 
  ON public.rayons_produits FOR UPDATE 
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete rayons from their tenant" ON public.rayons_produits;
CREATE POLICY "Users can delete rayons from their tenant" 
  ON public.rayons_produits FOR DELETE 
  USING (tenant_id = get_current_user_tenant_id());

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_rayons_updated_at ON public.rayons_produits;
CREATE TRIGGER update_rayons_updated_at
  BEFORE UPDATE ON public.rayons_produits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PHASE 3: Table classes_therapeutiques
-- Source: Migration 20250910221004
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.classes_therapeutiques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_classe TEXT NOT NULL,
  systeme_anatomique TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_classe_per_tenant UNIQUE (tenant_id, libelle_classe)
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_classes_therapeutiques_tenant_id 
  ON public.classes_therapeutiques (tenant_id);

CREATE INDEX IF NOT EXISTS idx_classes_therapeutiques_tenant_libelle 
  ON public.classes_therapeutiques (tenant_id, libelle_classe);

CREATE INDEX IF NOT EXISTS idx_classes_therapeutiques_tenant_systeme 
  ON public.classes_therapeutiques (tenant_id, systeme_anatomique);

-- Activer RLS
ALTER TABLE public.classes_therapeutiques ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can view therapeutic classes from their tenant" ON public.classes_therapeutiques;
CREATE POLICY "Users can view therapeutic classes from their tenant" 
  ON public.classes_therapeutiques FOR SELECT 
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert therapeutic classes in their tenant" ON public.classes_therapeutiques;
CREATE POLICY "Users can insert therapeutic classes in their tenant" 
  ON public.classes_therapeutiques FOR INSERT 
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can update therapeutic classes from their tenant" ON public.classes_therapeutiques;
CREATE POLICY "Users can update therapeutic classes from their tenant" 
  ON public.classes_therapeutiques FOR UPDATE 
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete therapeutic classes from their tenant" ON public.classes_therapeutiques;
CREATE POLICY "Users can delete therapeutic classes from their tenant" 
  ON public.classes_therapeutiques FOR DELETE 
  USING (tenant_id = get_current_user_tenant_id());

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_classes_therapeutiques_updated_at ON public.classes_therapeutiques;
CREATE TRIGGER update_classes_therapeutiques_updated_at
  BEFORE UPDATE ON public.classes_therapeutiques
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PHASE 4: Table dci (NOUVELLE - reconstruite depuis frontend)
-- Source: Analyse du composant DCIManager.tsx
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dci (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom_dci TEXT NOT NULL,
  description TEXT,
  classe_therapeutique_id UUID,
  contre_indications TEXT,
  effets_secondaires TEXT,
  posologie TEXT,
  produits_associes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_dci_per_tenant UNIQUE (tenant_id, nom_dci)
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_dci_tenant_id 
  ON public.dci(tenant_id);

CREATE INDEX IF NOT EXISTS idx_dci_classe_therapeutique_id 
  ON public.dci(classe_therapeutique_id);

CREATE INDEX IF NOT EXISTS idx_dci_tenant_nom 
  ON public.dci(tenant_id, nom_dci);

-- Activer RLS
ALTER TABLE public.dci ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can view dci from their tenant" ON public.dci;
CREATE POLICY "Users can view dci from their tenant" 
  ON public.dci FOR SELECT 
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert dci in their tenant" ON public.dci;
CREATE POLICY "Users can insert dci in their tenant" 
  ON public.dci FOR INSERT 
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can update dci from their tenant" ON public.dci;
CREATE POLICY "Users can update dci from their tenant" 
  ON public.dci FOR UPDATE 
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete dci from their tenant" ON public.dci;
CREATE POLICY "Users can delete dci from their tenant" 
  ON public.dci FOR DELETE 
  USING (tenant_id = get_current_user_tenant_id());

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_dci_updated_at ON public.dci;
CREATE TRIGGER update_dci_updated_at
  BEFORE UPDATE ON public.dci
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK vers classes_therapeutiques
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name = 'dci'
      AND constraint_name = 'fk_dci_classe_therapeutique'
  ) THEN
    ALTER TABLE public.dci 
      ADD CONSTRAINT fk_dci_classe_therapeutique 
      FOREIGN KEY (classe_therapeutique_id) 
      REFERENCES public.classes_therapeutiques(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- PHASE 5: Table reglementations
-- Source: Migration 20250801161227
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reglementations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom_reglementation TEXT NOT NULL,
  type_reglementation TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'Actif',
  description TEXT,
  date_application DATE NOT NULL,
  date_expiration DATE,
  autorite_competente TEXT NOT NULL,
  reference_legale TEXT NOT NULL,
  niveau_restriction TEXT NOT NULL,
  produits_concernes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_reglementations_tenant_id 
  ON public.reglementations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_reglementations_type 
  ON public.reglementations(type_reglementation);

CREATE INDEX IF NOT EXISTS idx_reglementations_statut 
  ON public.reglementations(statut);

-- Activer RLS
ALTER TABLE public.reglementations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can view regulations from their tenant" ON public.reglementations;
CREATE POLICY "Users can view regulations from their tenant"
  ON public.reglementations FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert regulations in their tenant" ON public.reglementations;
CREATE POLICY "Users can insert regulations in their tenant"
  ON public.reglementations FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can update regulations from their tenant" ON public.reglementations;
CREATE POLICY "Users can update regulations from their tenant"
  ON public.reglementations FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete regulations from their tenant" ON public.reglementations;
CREATE POLICY "Users can delete regulations from their tenant"
  ON public.reglementations FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_reglementations_updated_at ON public.reglementations;
CREATE TRIGGER update_reglementations_updated_at
  BEFORE UPDATE ON public.reglementations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PHASE 6: Contraintes FK depuis produits vers les tables de référence
-- ============================================================================

-- FK vers formes_galeniques
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name = 'produits'
      AND constraint_name = 'fk_produits_forme'
  ) THEN
    ALTER TABLE public.produits
      ADD CONSTRAINT fk_produits_forme
      FOREIGN KEY (forme_id)
      REFERENCES public.formes_galeniques(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- FK vers rayons_produits
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name = 'produits'
      AND constraint_name = 'fk_produits_rayon'
  ) THEN
    ALTER TABLE public.produits
      ADD CONSTRAINT fk_produits_rayon
      FOREIGN KEY (rayon_id)
      REFERENCES public.rayons_produits(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- FK vers dci
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name = 'produits'
      AND constraint_name = 'fk_produits_dci'
  ) THEN
    ALTER TABLE public.produits
      ADD CONSTRAINT fk_produits_dci
      FOREIGN KEY (dci_id)
      REFERENCES public.dci(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- FK vers classes_therapeutiques (vérifier si existe déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name = 'produits'
      AND constraint_name = 'fk_produits_classe_therapeutique'
  ) THEN
    ALTER TABLE public.produits
      ADD CONSTRAINT fk_produits_classe_therapeutique
      FOREIGN KEY (classe_therapeutique_id)
      REFERENCES public.classes_therapeutiques(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Index de performance sur les FK
CREATE INDEX IF NOT EXISTS idx_produits_forme_id 
  ON public.produits(forme_id);

CREATE INDEX IF NOT EXISTS idx_produits_rayon_id 
  ON public.produits(rayon_id);

CREATE INDEX IF NOT EXISTS idx_produits_dci_id 
  ON public.produits(dci_id);

CREATE INDEX IF NOT EXISTS idx_produits_classe_therapeutique_id 
  ON public.produits(classe_therapeutique_id);
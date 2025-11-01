-- =======================
-- MIGRATION: Fix ABC Analysis Relations and Data Integrity
-- =======================

-- 1. Ajouter les Foreign Keys pour les relations
-- Relation produits -> famille_produit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_produits_famille'
  ) THEN
    ALTER TABLE public.produits
    ADD CONSTRAINT fk_produits_famille 
    FOREIGN KEY (famille_id) 
    REFERENCES public.famille_produit(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Relation produits -> categorie_tarification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_produits_categorie_tarification'
  ) THEN
    ALTER TABLE public.produits
    ADD CONSTRAINT fk_produits_categorie_tarification
    FOREIGN KEY (categorie_tarification_id) 
    REFERENCES public.categorie_tarification(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Relation lignes_ventes -> produits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_lignes_ventes_produit'
  ) THEN
    ALTER TABLE public.lignes_ventes
    ADD CONSTRAINT fk_lignes_ventes_produit
    FOREIGN KEY (produit_id) 
    REFERENCES public.produits(id) 
    ON DELETE RESTRICT;
  END IF;
END $$;

-- Relation lignes_ventes -> ventes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_lignes_ventes_vente'
  ) THEN
    ALTER TABLE public.lignes_ventes
    ADD CONSTRAINT fk_lignes_ventes_vente
    FOREIGN KEY (vente_id) 
    REFERENCES public.ventes(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Créer les index pour optimiser les requêtes d'analyse ABC
CREATE INDEX IF NOT EXISTS idx_produits_famille_id 
ON public.produits(famille_id) 
WHERE famille_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_produits_categorie_tarification_id 
ON public.produits(categorie_tarification_id) 
WHERE categorie_tarification_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lignes_ventes_produit_id 
ON public.lignes_ventes(produit_id);

CREATE INDEX IF NOT EXISTS idx_lignes_ventes_vente_id 
ON public.lignes_ventes(vente_id);

CREATE INDEX IF NOT EXISTS idx_ventes_date_statut_tenant
ON public.ventes(date_vente, statut, tenant_id)
WHERE statut IS NOT NULL;

-- 3. Nettoyer la colonne famille_produit_id si elle est redondante
DO $$
BEGIN
  -- Vérifier si la colonne famille_produit_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'produits' 
    AND column_name = 'famille_produit_id'
  ) THEN
    -- Vérifier si elle contient des données différentes de famille_id
    IF NOT EXISTS (
      SELECT 1 FROM public.produits 
      WHERE famille_produit_id IS DISTINCT FROM famille_id
      LIMIT 1
    ) THEN
      -- Si les colonnes sont identiques ou famille_produit_id est toujours NULL, la supprimer
      ALTER TABLE public.produits DROP COLUMN famille_produit_id;
    ELSE
      -- Sinon, consolider les données vers famille_id
      UPDATE public.produits 
      SET famille_id = COALESCE(famille_id, famille_produit_id)
      WHERE famille_id IS NULL AND famille_produit_id IS NOT NULL;
      
      -- Puis supprimer famille_produit_id après consolidation
      ALTER TABLE public.produits DROP COLUMN famille_produit_id;
    END IF;
  END IF;
END $$;

-- 4. Vérifier et corriger l'enum statut_vente si nécessaire
DO $$
BEGIN
  -- Vérifier si l'enum statut_vente existe
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_vente') THEN
    -- Vérifier si 'Finalisée' existe dans l'enum
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'statut_vente'::regtype 
      AND enumlabel = 'Finalisée'
    ) THEN
      -- Ajouter 'Finalisée' si elle n'existe pas
      ALTER TYPE statut_vente ADD VALUE IF NOT EXISTS 'Finalisée';
    END IF;
  END IF;
END $$;

-- 5. Commentaires pour la documentation
COMMENT ON CONSTRAINT fk_produits_famille ON public.produits IS 
'Relation entre produit et sa famille pour l''analyse ABC et autres modules';

COMMENT ON CONSTRAINT fk_produits_categorie_tarification ON public.produits IS 
'Relation entre produit et sa catégorie de tarification pour l''analyse ABC';

COMMENT ON CONSTRAINT fk_lignes_ventes_produit ON public.lignes_ventes IS 
'Relation entre ligne de vente et produit pour garantir l''intégrité référentielle';

COMMENT ON CONSTRAINT fk_lignes_ventes_vente ON public.lignes_ventes IS 
'Relation entre ligne de vente et vente parente, suppression en cascade';

COMMENT ON INDEX idx_ventes_date_statut_tenant IS 
'Index optimisé pour les requêtes d''analyse ABC filtrant par date, statut et tenant';
-- Migration pour corriger les politiques RLS sur alertes_peremption et tables liées
-- Date: 2025-01-17
-- Description: Correction des politiques RLS pour résoudre les erreurs 400 sur les requêtes d'alertes de péremption

-- =====================================================
-- 1. CORRECTION DES POLITIQUES RLS POUR ALERTES_PEREMPTION
-- =====================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view alerts from their tenant" ON public.alertes_peremption;
DROP POLICY IF EXISTS "Users can insert alerts for their tenant" ON public.alertes_peremption;
DROP POLICY IF EXISTS "Users can update alerts from their tenant" ON public.alertes_peremption;
DROP POLICY IF EXISTS "Users can delete alerts from their tenant" ON public.alertes_peremption;

-- Activer RLS sur la table alertes_peremption
ALTER TABLE public.alertes_peremption ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : Autoriser la lecture pour le tenant de l'utilisateur
CREATE POLICY "Users can view alerts from their tenant"
ON public.alertes_peremption
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.personnel
    WHERE id = auth.uid()
  )
);

-- Politique INSERT : Autoriser la création pour le tenant de l'utilisateur
CREATE POLICY "Users can insert alerts for their tenant"
ON public.alertes_peremption
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id
    FROM public.personnel
    WHERE id = auth.uid()
  )
);

-- Politique UPDATE : Autoriser la modification pour le tenant de l'utilisateur
CREATE POLICY "Users can update alerts from their tenant"
ON public.alertes_peremption
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.personnel
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id
    FROM public.personnel
    WHERE id = auth.uid()
  )
);

-- Politique DELETE : Autoriser la suppression pour le tenant de l'utilisateur
CREATE POLICY "Users can delete alerts from their tenant"
ON public.alertes_peremption
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.personnel
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- 2. CORRECTION DES POLITIQUES RLS POUR LA TABLE LOTS
-- =====================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view lots from their tenant" ON public.lots;

-- Activer RLS sur la table lots si pas déjà fait
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

-- Politique SELECT pour lots
CREATE POLICY "Users can view lots from their tenant"
ON public.lots
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.personnel
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- 3. CORRECTION DES POLITIQUES RLS POUR LA TABLE PRODUITS
-- =====================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view produits from their tenant" ON public.produits;

-- Activer RLS sur la table produits si pas déjà fait
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

-- Politique SELECT pour produits
CREATE POLICY "Users can view produits from their tenant"
ON public.produits
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.personnel
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- 4. AJOUT DE LA CONTRAINTE FOREIGN KEY MANQUANTE
-- =====================================================

-- Ajouter la contrainte foreign key pour produit_id si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'alertes_peremption_produit_id_fkey'
        AND table_name = 'alertes_peremption'
    ) THEN
        ALTER TABLE public.alertes_peremption
        ADD CONSTRAINT alertes_peremption_produit_id_fkey
        FOREIGN KEY (produit_id)
        REFERENCES produits(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 5. VÉRIFICATION DES INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index sur tenant_id pour alertes_peremption (si pas déjà existant)
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_tenant_id 
ON public.alertes_peremption(tenant_id);

-- Index sur statut pour alertes_peremption (si pas déjà existant)
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_statut 
ON public.alertes_peremption(statut);

-- Index sur niveau_urgence pour alertes_peremption (si pas déjà existant)
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_niveau_urgence 
ON public.alertes_peremption(niveau_urgence);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_tenant_statut_urgence 
ON public.alertes_peremption(tenant_id, statut, niveau_urgence);

-- =====================================================
-- 6. COMMENTAIRES POUR LA DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Users can view alerts from their tenant" ON public.alertes_peremption IS 
'Permet aux utilisateurs de voir uniquement les alertes de péremption de leur tenant';

COMMENT ON POLICY "Users can insert alerts for their tenant" ON public.alertes_peremption IS 
'Permet aux utilisateurs de créer des alertes de péremption uniquement pour leur tenant';

COMMENT ON POLICY "Users can update alerts from their tenant" ON public.alertes_peremption IS 
'Permet aux utilisateurs de modifier uniquement les alertes de péremption de leur tenant';

COMMENT ON POLICY "Users can delete alerts from their tenant" ON public.alertes_peremption IS 
'Permet aux utilisateurs de supprimer uniquement les alertes de péremption de leur tenant';
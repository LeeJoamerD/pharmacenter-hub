-- Script SQL à exécuter dans l'éditeur SQL de Supabase
-- URL du projet: https://pzsoeapzuijhgemjzydo.supabase.co
-- Date: 2025-01-17
-- Description: Correction des politiques RLS pour résoudre les erreurs 400 sur les requêtes d'alertes de péremption

-- =====================================================
-- 1. VÉRIFICATION DES POLITIQUES EXISTANTES
-- =====================================================

-- Vérifier les politiques actuelles sur alertes_peremption
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'alertes_peremption';

-- =====================================================
-- 2. CORRECTION DES POLITIQUES RLS POUR ALERTES_PEREMPTION
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
-- 3. CORRECTION DES POLITIQUES RLS POUR LA TABLE LOTS
-- =====================================================

-- Vérifier les politiques existantes sur lots
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'lots';

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
-- 4. CORRECTION DES POLITIQUES RLS POUR LA TABLE PRODUITS
-- =====================================================

-- Vérifier les politiques existantes sur produits
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'produits';

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
-- 5. AJOUT DE LA CONTRAINTE FOREIGN KEY MANQUANTE
-- =====================================================

-- Vérifier si la contrainte existe déjà
SELECT kcu.constraint_name, kcu.table_name, kcu.column_name, ccu.table_name as foreign_table_name, ccu.column_name as foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE kcu.table_name = 'alertes_peremption' AND kcu.column_name = 'produit_id';

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
-- 6. VÉRIFICATION DES INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Vérifier les index existants
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'alertes_peremption';

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
-- 7. TEST DE VÉRIFICATION
-- =====================================================

-- Tester une requête similaire à celle utilisée par l'application
-- REMPLACEZ 'votre-tenant-id-ici' par votre vrai tenant_id
/*
SELECT 
  ap.*, 
  l.id as lot_id, 
  l.numero_lot, 
  l.date_peremption, 
  p.id as produit_id, 
  p.libelle_produit, 
  p.code_cip 
FROM alertes_peremption ap 
LEFT JOIN lots l ON ap.lot_id = l.id 
LEFT JOIN produits p ON ap.produit_id = p.id 
WHERE ap.tenant_id = 'votre-tenant-id-ici'
  AND ap.statut = 'active'
  AND ap.niveau_urgence = 'critique';
*/

-- =====================================================
-- 8. VÉRIFICATION FINALE DES POLITIQUES
-- =====================================================

-- Vérifier que toutes les politiques ont été créées correctement
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename IN ('alertes_peremption', 'lots', 'produits')
ORDER BY tablename, policyname;
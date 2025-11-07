-- =====================================================
-- FIX: Contrainte CHECK commandes_fournisseurs
-- Aligner les statuts avec le frontend (OrderStatusValidationService)
-- =====================================================

-- 1. Supprimer l'ancienne contrainte CHECK incorrecte
ALTER TABLE public.commandes_fournisseurs 
  DROP CONSTRAINT IF EXISTS commandes_fournisseurs_statut_check;

-- 2. Ajouter la nouvelle contrainte avec les 7 statuts corrects
ALTER TABLE public.commandes_fournisseurs 
  ADD CONSTRAINT commandes_fournisseurs_statut_check 
  CHECK (statut IN (
    'Brouillon',    -- Draft initial
    'En cours',     -- Work in progress
    'Confirmé',     -- Confirmed by user
    'Expédié',      -- Shipped by supplier
    'Livré',        -- Delivered to pharmacy
    'Réceptionné',  -- Received and verified
    'Annulé'        -- Cancelled
  ));

-- 3. Ajouter un index de performance sur tenant_id et statut
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseurs_tenant_statut 
  ON public.commandes_fournisseurs(tenant_id, statut);

-- 4. Documenter la colonne statut
COMMENT ON COLUMN public.commandes_fournisseurs.statut IS 
  'Statut de la commande: Brouillon → En cours → Confirmé → Expédié → Livré → Réceptionné (ou Annulé)';

-- 5. Vérification des données existantes (script informatif)
DO $$
DECLARE
  v_commandes_count INTEGER;
  v_statuts_uniques TEXT[];
BEGIN
  -- Compter les commandes existantes
  SELECT COUNT(*), array_agg(DISTINCT statut)
  INTO v_commandes_count, v_statuts_uniques
  FROM public.commandes_fournisseurs;
  
  RAISE NOTICE 'Commandes existantes: % | Statuts: %', v_commandes_count, v_statuts_uniques;
  
  -- Vérifier qu'aucune commande n'a un statut invalide
  IF EXISTS (
    SELECT 1 FROM public.commandes_fournisseurs
    WHERE statut NOT IN ('Brouillon', 'En cours', 'Confirmé', 'Expédié', 'Livré', 'Réceptionné', 'Annulé')
  ) THEN
    RAISE WARNING 'ATTENTION: Des commandes ont des statuts invalides qui doivent être corrigés!';
  ELSE
    RAISE NOTICE 'Toutes les commandes ont des statuts valides ✓';
  END IF;
END $$;
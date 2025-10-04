-- ============================================
-- PHASE 5: VERIFICATION ET CORRECTION DES POLITIQUES RLS
-- Module: Stock Faible
-- ============================================

-- 1. Ajouter les politiques manquantes pour low_stock_actions_log
-- Cette table doit permettre les mises à jour et suppressions
DROP POLICY IF EXISTS "Users can update actions log from their tenant" ON public.low_stock_actions_log;
DROP POLICY IF EXISTS "Users can delete actions log from their tenant" ON public.low_stock_actions_log;

CREATE POLICY "Users can update actions log from their tenant"
ON public.low_stock_actions_log
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete actions log from their tenant"
ON public.low_stock_actions_log
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- 2. CORRECTION CRITIQUE: Réparer la politique bloquante de pharmacy_sessions
-- La politique actuelle bloque tout accès avec qual:false
DROP POLICY IF EXISTS "Pharmacy sessions are private" ON public.pharmacy_sessions;

-- Nouvelle politique permettant aux pharmacies d'accéder à leurs propres sessions
CREATE POLICY "Pharmacies can manage their own sessions"
ON public.pharmacy_sessions
FOR ALL
USING (pharmacy_id IN (
  SELECT id FROM public.pharmacies 
  WHERE tenant_id = get_current_user_tenant_id()
))
WITH CHECK (pharmacy_id IN (
  SELECT id FROM public.pharmacies 
  WHERE tenant_id = get_current_user_tenant_id()
));

-- 3. Index pour optimiser les performances des requêtes de stock faible
-- Index pour les recherches par statut dans low_stock_actions_log
CREATE INDEX IF NOT EXISTS idx_low_stock_actions_log_status 
ON public.low_stock_actions_log(result_status);

-- Index pour les recherches par date d'exécution
CREATE INDEX IF NOT EXISTS idx_low_stock_actions_log_executed_at 
ON public.low_stock_actions_log(executed_at DESC);

-- Index composé pour tenant + produit (optimisation des requêtes fréquentes)
CREATE INDEX IF NOT EXISTS idx_low_stock_actions_log_tenant_product 
ON public.low_stock_actions_log(tenant_id, produit_id);

-- Commentaires pour documentation
COMMENT ON POLICY "Users can update actions log from their tenant" ON public.low_stock_actions_log IS 
'Permet aux utilisateurs de mettre à jour l''historique des actions sur leur stock faible';

COMMENT ON POLICY "Users can delete actions log from their tenant" ON public.low_stock_actions_log IS 
'Permet aux utilisateurs de supprimer l''historique des actions sur leur stock faible';

COMMENT ON POLICY "Pharmacies can manage their own sessions" ON public.pharmacy_sessions IS 
'Permet aux pharmacies de gérer leurs propres sessions d''authentification';
-- ============================================
-- PHASE 5: COMPLETION DES POLITIQUES RLS
-- Module: Stock Faible - Ajout des politiques manquantes
-- ============================================

-- Ajouter les politiques UPDATE et DELETE pour low_stock_actions_log
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

-- Index pour optimiser les performances des requêtes de stock faible
CREATE INDEX IF NOT EXISTS idx_low_stock_actions_log_status 
ON public.low_stock_actions_log(result_status);

CREATE INDEX IF NOT EXISTS idx_low_stock_actions_log_executed_at 
ON public.low_stock_actions_log(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_low_stock_actions_log_tenant_product 
ON public.low_stock_actions_log(tenant_id, produit_id);

-- Commentaires pour documentation
COMMENT ON POLICY "Users can update actions log from their tenant" ON public.low_stock_actions_log IS 
'Permet aux utilisateurs de mettre à jour l''historique des actions sur leur stock faible';

COMMENT ON POLICY "Users can delete actions log from their tenant" ON public.low_stock_actions_log IS 
'Permet aux utilisateurs de supprimer l''historique des actions sur leur stock faible';
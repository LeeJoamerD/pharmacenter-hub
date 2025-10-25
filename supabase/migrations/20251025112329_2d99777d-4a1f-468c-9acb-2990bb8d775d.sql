-- ========================================
-- PARTIE 1: CORRECTIFS DE SÉCURITÉ
-- ========================================
-- Harden SECURITY DEFINER functions by adding SET search_path
-- Inspiré de: 20250819221722_047638df-6b89-458b-ae74-b8619bf5a178.sql

CREATE OR REPLACE FUNCTION public.rpc_stock_record_movement(
  p_tenant_id UUID,
  p_lot_id UUID,
  p_produit_id UUID,
  p_type_mouvement TEXT,
  p_quantite INTEGER,
  p_motif TEXT DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lot_record RECORD;
  v_quantite_avant INTEGER;
  v_quantite_apres INTEGER;
  v_mouvement_id UUID;
BEGIN
  -- Récupérer l'état actuel du lot
  SELECT * INTO v_lot_record FROM public.lots WHERE id = p_lot_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;
  
  v_quantite_avant := v_lot_record.quantite_restante;
  
  -- Calculer la quantité après
  IF p_type_mouvement IN ('sortie', 'peremption') THEN
    v_quantite_apres := v_quantite_avant - p_quantite;
  ELSIF p_type_mouvement IN ('entree', 'retour') THEN
    v_quantite_apres := v_quantite_avant + p_quantite;
  ELSIF p_type_mouvement = 'ajustement' THEN
    v_quantite_apres := p_quantite;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Type de mouvement invalide');
  END IF;
  
  -- Vérifier que la quantité ne devient pas négative
  IF v_quantite_apres < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Stock insuffisant');
  END IF;
  
  -- Insérer le mouvement
  INSERT INTO public.mouvements_lots (
    tenant_id, lot_id, produit_id, type_mouvement,
    quantite_avant, quantite_mouvement, quantite_apres,
    motif, agent_id
  ) VALUES (
    p_tenant_id, p_lot_id, p_produit_id, p_type_mouvement,
    v_quantite_avant, p_quantite, v_quantite_apres,
    p_motif, p_agent_id
  ) RETURNING id INTO v_mouvement_id;
  
  -- Mettre à jour le lot
  UPDATE public.lots 
  SET quantite_restante = v_quantite_apres,
      updated_at = NOW()
  WHERE id = p_lot_id;
  
  RETURN json_build_object(
    'success', true,
    'mouvement_id', v_mouvement_id,
    'quantite_avant', v_quantite_avant,
    'quantite_apres', v_quantite_apres
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_stock_update_movement(
  p_tenant_id UUID,
  p_mouvement_id UUID,
  p_quantite INTEGER,
  p_motif TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mouvement_record RECORD;
  v_lot_record RECORD;
  v_quantite_avant INTEGER;
  v_quantite_apres INTEGER;
  v_diff INTEGER;
BEGIN
  -- Get existing movement record
  SELECT * INTO v_mouvement_record 
  FROM public.mouvements_lots 
  WHERE id = p_mouvement_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;
  
  -- Get current lot state
  SELECT * INTO v_lot_record 
  FROM public.lots 
  WHERE id = v_mouvement_record.lot_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;
  
  -- Calculate difference
  v_diff := p_quantite - v_mouvement_record.quantite_mouvement;
  
  -- Calculate new quantity
  IF v_mouvement_record.type_mouvement IN ('sortie', 'peremption') THEN
    v_quantite_apres := v_lot_record.quantite_restante - v_diff;
  ELSIF v_mouvement_record.type_mouvement IN ('entree', 'retour') THEN
    v_quantite_apres := v_lot_record.quantite_restante + v_diff;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Type de mouvement invalide');
  END IF;
  
  -- Check for negative stock
  IF v_quantite_apres < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Stock insuffisant');
  END IF;
  
  -- Update movement record
  UPDATE public.mouvements_lots
  SET quantite_mouvement = p_quantite,
      quantite_apres = v_quantite_apres,
      motif = COALESCE(p_motif, motif)
  WHERE id = p_mouvement_id;
  
  -- Update lot
  UPDATE public.lots
  SET quantite_restante = v_quantite_apres,
      updated_at = NOW()
  WHERE id = v_mouvement_record.lot_id;
  
  RETURN json_build_object(
    'success', true,
    'quantite_apres', v_quantite_apres
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_stock_delete_movement(
  p_tenant_id UUID,
  p_mouvement_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mouvement_record RECORD;
  v_lot_record RECORD;
  v_quantite_apres INTEGER;
BEGIN
  -- Get movement record
  SELECT * INTO v_mouvement_record 
  FROM public.mouvements_lots 
  WHERE id = p_mouvement_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;
  
  -- Get lot record
  SELECT * INTO v_lot_record 
  FROM public.lots 
  WHERE id = v_mouvement_record.lot_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;
  
  -- Reverse the movement
  IF v_mouvement_record.type_mouvement IN ('sortie', 'peremption') THEN
    v_quantite_apres := v_lot_record.quantite_restante + v_mouvement_record.quantite_mouvement;
  ELSIF v_mouvement_record.type_mouvement IN ('entree', 'retour') THEN
    v_quantite_apres := v_lot_record.quantite_restante - v_mouvement_record.quantite_mouvement;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Type de mouvement invalide');
  END IF;
  
  -- Update lot
  UPDATE public.lots
  SET quantite_restante = v_quantite_apres,
      updated_at = NOW()
  WHERE id = v_mouvement_record.lot_id;
  
  -- Delete movement
  DELETE FROM public.mouvements_lots
  WHERE id = p_mouvement_id;
  
  RETURN json_build_object(
    'success', true,
    'quantite_apres', v_quantite_apres
  );
END;
$$;

-- ========================================
-- PARTIE 2: COLONNES MANQUANTES - PRODUITS
-- ========================================
ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS taux_centime_additionnel NUMERIC(5,2) DEFAULT 0.00;

-- ========================================
-- PARTIE 3: COLONNES MANQUANTES - PARAMETRES_SYSTEME
-- ========================================
-- Colonnes pour la configuration des rapports
ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS retention_days INTEGER DEFAULT 90;

ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS purge_enabled BOOLEAN DEFAULT false;

-- Colonnes pour la configuration des alertes de stock
ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS low_stock_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS low_stock_threshold NUMERIC DEFAULT 10;

ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS critical_stock_threshold NUMERIC DEFAULT 5;

ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS maximum_stock_threshold NUMERIC DEFAULT 1000;

ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS expiration_alert_days INTEGER DEFAULT 30;

ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS near_expiration_days INTEGER DEFAULT 90;

ALTER TABLE public.parametres_systeme 
ADD COLUMN IF NOT EXISTS overdue_inventory_days INTEGER DEFAULT 180;

-- ========================================
-- PARTIE 4: TABLE METRIQUES_PERFORMANCE_LOTS
-- ========================================
-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.metriques_performance_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_suggestions_generated INTEGER DEFAULT 0,
  suggestions_applied INTEGER DEFAULT 0,
  suggestions_ignored INTEGER DEFAULT 0,
  expirations_avoided INTEGER DEFAULT 0,
  expirations_avoided_value NUMERIC DEFAULT 0,
  stock_reorders_suggested INTEGER DEFAULT 0,
  fifo_corrections INTEGER DEFAULT 0,
  total_savings NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter RLS si pas déjà activé
ALTER TABLE public.metriques_performance_lots ENABLE ROW LEVEL SECURITY;

-- Créer les policies RLS
DROP POLICY IF EXISTS tenant_access_metriques_performance_lots ON public.metriques_performance_lots;
CREATE POLICY tenant_access_metriques_performance_lots 
ON public.metriques_performance_lots
FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Ajouter les colonnes si la table existe déjà
ALTER TABLE public.metriques_performance_lots 
ADD COLUMN IF NOT EXISTS suggestions_applied INTEGER DEFAULT 0;

ALTER TABLE public.metriques_performance_lots 
ADD COLUMN IF NOT EXISTS suggestions_ignored INTEGER DEFAULT 0;

ALTER TABLE public.metriques_performance_lots 
ADD COLUMN IF NOT EXISTS stock_reorders_suggested INTEGER DEFAULT 0;
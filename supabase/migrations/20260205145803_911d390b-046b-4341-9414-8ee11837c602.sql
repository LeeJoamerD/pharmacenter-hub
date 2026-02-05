-- Table pour stocker les métriques de qualité des données
CREATE TABLE public.ai_data_quality_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('completude', 'coherence', 'fraicheur', 'precision')),
  metric_value NUMERIC(5,2) NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les recherches par tenant
CREATE INDEX idx_ai_data_quality_metrics_tenant ON public.ai_data_quality_metrics(tenant_id);
CREATE INDEX idx_ai_data_quality_metrics_type ON public.ai_data_quality_metrics(metric_type);
CREATE INDEX idx_ai_data_quality_metrics_calculated ON public.ai_data_quality_metrics(calculated_at DESC);

-- Enable RLS
ALTER TABLE public.ai_data_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenant can view own data quality metrics"
ON public.ai_data_quality_metrics FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Tenant can insert own data quality metrics"
ON public.ai_data_quality_metrics FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Tenant can update own data quality metrics"
ON public.ai_data_quality_metrics FOR UPDATE
USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Tenant can delete own data quality metrics"
ON public.ai_data_quality_metrics FOR DELETE
USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

-- Fonction RPC pour calculer les métriques de qualité des données
CREATE OR REPLACE FUNCTION public.calculate_data_quality_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_products INTEGER;
  v_complete_products INTEGER;
  v_coherent_products INTEGER;
  v_fresh_products INTEGER;
  v_precision_score NUMERIC;
  v_completude NUMERIC(5,2);
  v_coherence NUMERIC(5,2);
  v_fraicheur NUMERIC(5,2);
  v_precision NUMERIC(5,2);
BEGIN
  -- Compter les produits totaux
  SELECT COUNT(*) INTO v_total_products
  FROM public.produits
  WHERE tenant_id = p_tenant_id AND statut = 'Actif';
  
  IF v_total_products = 0 THEN
    v_total_products := 1;
  END IF;
  
  -- Complétude: % de produits avec libelle, prix_vente, et categorie_id
  SELECT COUNT(*) INTO v_complete_products
  FROM public.produits
  WHERE tenant_id = p_tenant_id 
    AND statut = 'Actif'
    AND libelle_produit IS NOT NULL 
    AND libelle_produit != ''
    AND prix_vente IS NOT NULL
    AND prix_vente > 0
    AND categorie_id IS NOT NULL;
  
  v_completude := (v_complete_products::NUMERIC / v_total_products::NUMERIC) * 100;
  
  -- Cohérence: % de produits avec prix cohérents (prix_vente >= prix_achat)
  SELECT COUNT(*) INTO v_coherent_products
  FROM public.produits
  WHERE tenant_id = p_tenant_id 
    AND statut = 'Actif'
    AND (prix_achat IS NULL OR prix_vente >= prix_achat);
  
  v_coherence := (v_coherent_products::NUMERIC / v_total_products::NUMERIC) * 100;
  
  -- Fraîcheur: % de produits mis à jour dans les 30 derniers jours
  SELECT COUNT(*) INTO v_fresh_products
  FROM public.produits
  WHERE tenant_id = p_tenant_id 
    AND statut = 'Actif'
    AND updated_at >= now() - INTERVAL '30 days';
  
  v_fraicheur := (v_fresh_products::NUMERIC / v_total_products::NUMERIC) * 100;
  
  -- Précision: score moyen des contrôles qualité (si disponible) ou estimation
  SELECT COALESCE(AVG(quality_score), 90)::NUMERIC INTO v_precision
  FROM public.ai_training_datasets
  WHERE tenant_id = p_tenant_id AND is_active = true;
  
  v_precision := COALESCE(v_precision, 90);
  
  -- Insérer ou mettre à jour les métriques
  INSERT INTO public.ai_data_quality_metrics (tenant_id, metric_type, metric_value, details)
  VALUES 
    (p_tenant_id, 'completude', v_completude, jsonb_build_object('total', v_total_products, 'complete', v_complete_products)),
    (p_tenant_id, 'coherence', v_coherence, jsonb_build_object('total', v_total_products, 'coherent', v_coherent_products)),
    (p_tenant_id, 'fraicheur', v_fraicheur, jsonb_build_object('total', v_total_products, 'fresh', v_fresh_products)),
    (p_tenant_id, 'precision', v_precision, jsonb_build_object('source', 'training_datasets'))
  ON CONFLICT DO NOTHING;
  
  RETURN jsonb_build_object(
    'completude', ROUND(v_completude, 2),
    'coherence', ROUND(v_coherence, 2),
    'fraicheur', ROUND(v_fraicheur, 2),
    'precision', ROUND(v_precision, 2),
    'total_products', v_total_products,
    'calculated_at', now()
  );
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.calculate_data_quality_metrics TO authenticated;

-- Table pour stocker la configuration AI globale par tenant (si pas déjà existante)
-- Vérification via DO block
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_reports_config') THEN
    CREATE TABLE public.ai_reports_config (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE UNIQUE,
      auto_training_enabled BOOLEAN NOT NULL DEFAULT true,
      training_frequency TEXT NOT NULL DEFAULT 'weekly',
      min_accuracy_threshold NUMERIC(5,2) NOT NULL DEFAULT 85,
      max_epochs INTEGER NOT NULL DEFAULT 100,
      data_retention_days INTEGER NOT NULL DEFAULT 365,
      notification_enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.ai_reports_config ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Tenant can view own AI config"
    ON public.ai_reports_config FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));
    
    CREATE POLICY "Tenant can insert own AI config"
    ON public.ai_reports_config FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));
    
    CREATE POLICY "Tenant can update own AI config"
    ON public.ai_reports_config FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));
  END IF;
END $$;
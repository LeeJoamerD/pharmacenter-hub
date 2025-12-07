-- =====================================================
-- Tables pour le module Vision par Ordinateur
-- =====================================================

-- 1. Table de configuration du module Vision
CREATE TABLE public.ai_vision_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  auto_detection_enabled BOOLEAN DEFAULT true,
  min_confidence_threshold INTEGER DEFAULT 80,
  save_processed_images BOOLEAN DEFAULT false,
  enable_shelf_monitoring BOOLEAN DEFAULT true,
  shelf_scan_interval_hours INTEGER DEFAULT 6,
  quality_control_types JSONB DEFAULT '["expiry_date","packaging","barcode","price_label"]',
  notification_settings JSONB DEFAULT '{"alerts_enabled": true, "email": false, "push": true}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- 2. Table des détections de produits
CREATE TABLE public.ai_vision_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  detected_name TEXT NOT NULL,
  detected_barcode TEXT,
  confidence NUMERIC(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('verified', 'pending', 'failed', 'rejected')),
  image_url TEXT,
  detected_price NUMERIC(15,2),
  detected_stock INTEGER,
  detected_expiry_date DATE,
  packaging_status VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL
);

-- 3. Table des analyses d'étagères
CREATE TABLE public.ai_shelf_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  shelf_name TEXT NOT NULL,
  shelf_location TEXT,
  rayon_id UUID REFERENCES public.rayons_produits(id) ON DELETE SET NULL,
  total_products INTEGER DEFAULT 0,
  stockouts_detected INTEGER DEFAULT 0,
  misplacements_detected INTEGER DEFAULT 0,
  compliance_score NUMERIC(5,2) DEFAULT 100,
  issues JSONB DEFAULT '[]',
  image_url TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scanned_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL
);

-- 4. Table des contrôles qualité visuels
CREATE TABLE public.ai_quality_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  control_type VARCHAR(50) NOT NULL CHECK (control_type IN ('expiry_date', 'packaging', 'barcode', 'price_label')),
  product_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  checked_items INTEGER DEFAULT 0,
  alerts_generated INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'warning', 'error')),
  details JSONB DEFAULT '{}',
  image_url TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL
);

-- 5. Table des reconnaissances par lots
CREATE TABLE public.ai_batch_recognitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  total_items INTEGER DEFAULT 0,
  recognized_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  duplicates_count INTEGER DEFAULT 0,
  new_products_count INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  accuracy NUMERIC(5,2),
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  items JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  started_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL
);

-- =====================================================
-- Activer RLS sur toutes les tables
-- =====================================================
ALTER TABLE public.ai_vision_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_vision_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_shelf_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_quality_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_batch_recognitions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Politiques RLS pour ai_vision_config
-- =====================================================
CREATE POLICY "Users can view vision config from their tenant"
ON public.ai_vision_config FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert vision config in their tenant"
ON public.ai_vision_config FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update vision config from their tenant"
ON public.ai_vision_config FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete vision config from their tenant"
ON public.ai_vision_config FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- Politiques RLS pour ai_vision_detections
-- =====================================================
CREATE POLICY "Users can view vision detections from their tenant"
ON public.ai_vision_detections FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert vision detections in their tenant"
ON public.ai_vision_detections FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update vision detections from their tenant"
ON public.ai_vision_detections FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete vision detections from their tenant"
ON public.ai_vision_detections FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- Politiques RLS pour ai_shelf_analyses
-- =====================================================
CREATE POLICY "Users can view shelf analyses from their tenant"
ON public.ai_shelf_analyses FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert shelf analyses in their tenant"
ON public.ai_shelf_analyses FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update shelf analyses from their tenant"
ON public.ai_shelf_analyses FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete shelf analyses from their tenant"
ON public.ai_shelf_analyses FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- Politiques RLS pour ai_quality_controls
-- =====================================================
CREATE POLICY "Users can view quality controls from their tenant"
ON public.ai_quality_controls FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert quality controls in their tenant"
ON public.ai_quality_controls FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update quality controls from their tenant"
ON public.ai_quality_controls FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete quality controls from their tenant"
ON public.ai_quality_controls FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- Politiques RLS pour ai_batch_recognitions
-- =====================================================
CREATE POLICY "Users can view batch recognitions from their tenant"
ON public.ai_batch_recognitions FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert batch recognitions in their tenant"
ON public.ai_batch_recognitions FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update batch recognitions from their tenant"
ON public.ai_batch_recognitions FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete batch recognitions from their tenant"
ON public.ai_batch_recognitions FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- Indexes pour performance
-- =====================================================
CREATE INDEX idx_ai_vision_config_tenant ON public.ai_vision_config(tenant_id);
CREATE INDEX idx_ai_vision_detections_tenant ON public.ai_vision_detections(tenant_id);
CREATE INDEX idx_ai_vision_detections_status ON public.ai_vision_detections(status);
CREATE INDEX idx_ai_vision_detections_created ON public.ai_vision_detections(created_at DESC);
CREATE INDEX idx_ai_shelf_analyses_tenant ON public.ai_shelf_analyses(tenant_id);
CREATE INDEX idx_ai_shelf_analyses_scanned ON public.ai_shelf_analyses(scanned_at DESC);
CREATE INDEX idx_ai_quality_controls_tenant ON public.ai_quality_controls(tenant_id);
CREATE INDEX idx_ai_quality_controls_type ON public.ai_quality_controls(control_type);
CREATE INDEX idx_ai_batch_recognitions_tenant ON public.ai_batch_recognitions(tenant_id);
CREATE INDEX idx_ai_batch_recognitions_status ON public.ai_batch_recognitions(status);

-- =====================================================
-- Triggers pour updated_at
-- =====================================================
CREATE TRIGGER update_ai_vision_config_updated_at
  BEFORE UPDATE ON public.ai_vision_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lots_timestamp();

-- =====================================================
-- RPC Functions
-- =====================================================

-- Fonction pour calculer les métriques Vision
CREATE OR REPLACE FUNCTION calculate_vision_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  total_images INTEGER;
  avg_accuracy NUMERIC;
  avg_processing_time INTEGER;
  today_detections INTEGER;
  pending_verifications INTEGER;
  total_shelf_scans INTEGER;
  avg_compliance NUMERIC;
  quality_alerts INTEGER;
BEGIN
  -- Images traitées total
  SELECT COUNT(*) INTO total_images
  FROM ai_vision_detections
  WHERE tenant_id = p_tenant_id;

  -- Précision moyenne
  SELECT COALESCE(AVG(confidence), 0) INTO avg_accuracy
  FROM ai_vision_detections
  WHERE tenant_id = p_tenant_id AND status = 'verified';

  -- Temps de traitement moyen
  SELECT COALESCE(AVG(processing_time_ms), 0) INTO avg_processing_time
  FROM ai_vision_detections
  WHERE tenant_id = p_tenant_id AND processing_time_ms IS NOT NULL;

  -- Détections aujourd'hui
  SELECT COUNT(*) INTO today_detections
  FROM ai_vision_detections
  WHERE tenant_id = p_tenant_id 
    AND created_at >= CURRENT_DATE;

  -- Vérifications en attente
  SELECT COUNT(*) INTO pending_verifications
  FROM ai_vision_detections
  WHERE tenant_id = p_tenant_id AND status = 'pending';

  -- Scans d'étagères total
  SELECT COUNT(*) INTO total_shelf_scans
  FROM ai_shelf_analyses
  WHERE tenant_id = p_tenant_id;

  -- Conformité moyenne
  SELECT COALESCE(AVG(compliance_score), 0) INTO avg_compliance
  FROM ai_shelf_analyses
  WHERE tenant_id = p_tenant_id;

  -- Alertes qualité
  SELECT COALESCE(SUM(alerts_generated), 0) INTO quality_alerts
  FROM ai_quality_controls
  WHERE tenant_id = p_tenant_id;

  result := json_build_object(
    'images_processed', COALESCE(total_images, 0),
    'average_accuracy', ROUND(COALESCE(avg_accuracy, 0), 1),
    'avg_processing_time_ms', COALESCE(avg_processing_time, 0),
    'detections_today', COALESCE(today_detections, 0),
    'pending_verifications', COALESCE(pending_verifications, 0),
    'total_shelf_scans', COALESCE(total_shelf_scans, 0),
    'avg_compliance', ROUND(COALESCE(avg_compliance, 0), 1),
    'quality_alerts', COALESCE(quality_alerts, 0)
  );

  RETURN result;
END;
$$;

-- Fonction pour créer une détection après analyse IA
CREATE OR REPLACE FUNCTION process_vision_detection(
  p_tenant_id UUID,
  p_detected_name TEXT,
  p_detected_barcode TEXT DEFAULT NULL,
  p_confidence NUMERIC DEFAULT 0,
  p_image_url TEXT DEFAULT NULL,
  p_detected_price NUMERIC DEFAULT NULL,
  p_detected_expiry_date DATE DEFAULT NULL,
  p_packaging_status TEXT DEFAULT NULL,
  p_processing_time_ms INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_product_id UUID;
  new_detection_id UUID;
  detection_status TEXT;
BEGIN
  -- Essayer de matcher avec un produit existant par code-barres
  IF p_detected_barcode IS NOT NULL THEN
    SELECT id INTO matched_product_id
    FROM produits
    WHERE tenant_id = p_tenant_id 
      AND (code_cip = p_detected_barcode OR code_barre_externe = p_detected_barcode)
    LIMIT 1;
  END IF;

  -- Si pas trouvé par code-barres, chercher par nom (similitude)
  IF matched_product_id IS NULL AND p_detected_name IS NOT NULL THEN
    SELECT id INTO matched_product_id
    FROM produits
    WHERE tenant_id = p_tenant_id 
      AND LOWER(libelle_produit) LIKE '%' || LOWER(p_detected_name) || '%'
    LIMIT 1;
  END IF;

  -- Déterminer le statut initial
  IF matched_product_id IS NOT NULL AND p_confidence >= 90 THEN
    detection_status := 'verified';
  ELSIF p_confidence < 50 THEN
    detection_status := 'failed';
  ELSE
    detection_status := 'pending';
  END IF;

  -- Insérer la détection
  INSERT INTO ai_vision_detections (
    tenant_id, product_id, detected_name, detected_barcode, confidence,
    status, image_url, detected_price, detected_expiry_date, packaging_status,
    processing_time_ms, metadata
  ) VALUES (
    p_tenant_id, matched_product_id, p_detected_name, p_detected_barcode, p_confidence,
    detection_status, p_image_url, p_detected_price, p_detected_expiry_date, p_packaging_status,
    p_processing_time_ms, p_metadata
  )
  RETURNING id INTO new_detection_id;

  RETURN new_detection_id;
END;
$$;

-- Fonction pour créer une analyse d'étagère
CREATE OR REPLACE FUNCTION create_shelf_analysis(
  p_tenant_id UUID,
  p_shelf_name TEXT,
  p_shelf_location TEXT DEFAULT NULL,
  p_rayon_id UUID DEFAULT NULL,
  p_total_products INTEGER DEFAULT 0,
  p_stockouts_detected INTEGER DEFAULT 0,
  p_misplacements_detected INTEGER DEFAULT 0,
  p_issues JSONB DEFAULT '[]',
  p_image_url TEXT DEFAULT NULL,
  p_scanned_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  compliance NUMERIC;
  new_analysis_id UUID;
BEGIN
  -- Calculer le score de conformité
  IF p_total_products > 0 THEN
    compliance := ((p_total_products - p_stockouts_detected - p_misplacements_detected)::NUMERIC / p_total_products) * 100;
  ELSE
    compliance := 100;
  END IF;

  -- Insérer l'analyse
  INSERT INTO ai_shelf_analyses (
    tenant_id, shelf_name, shelf_location, rayon_id, total_products,
    stockouts_detected, misplacements_detected, compliance_score, issues,
    image_url, scanned_by
  ) VALUES (
    p_tenant_id, p_shelf_name, p_shelf_location, p_rayon_id, p_total_products,
    p_stockouts_detected, p_misplacements_detected, compliance, p_issues,
    p_image_url, p_scanned_by
  )
  RETURNING id INTO new_analysis_id;

  RETURN new_analysis_id;
END;
$$;

-- Fonction pour obtenir les statistiques Vision
CREATE OR REPLACE FUNCTION get_vision_statistics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  detections_by_status JSON;
  quality_by_type JSON;
  daily_detections JSON;
BEGIN
  -- Détections par statut
  SELECT json_agg(row_to_json(t)) INTO detections_by_status
  FROM (
    SELECT status, COUNT(*) as count
    FROM ai_vision_detections
    WHERE tenant_id = p_tenant_id
    GROUP BY status
  ) t;

  -- Contrôles qualité par type
  SELECT json_agg(row_to_json(t)) INTO quality_by_type
  FROM (
    SELECT control_type, 
           SUM(checked_items) as total_checked,
           SUM(alerts_generated) as total_alerts,
           AVG(accuracy) as avg_accuracy
    FROM ai_quality_controls
    WHERE tenant_id = p_tenant_id
    GROUP BY control_type
  ) t;

  -- Détections quotidiennes (7 derniers jours)
  SELECT json_agg(row_to_json(t)) INTO daily_detections
  FROM (
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM ai_vision_detections
    WHERE tenant_id = p_tenant_id 
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  ) t;

  result := json_build_object(
    'detections_by_status', COALESCE(detections_by_status, '[]'::json),
    'quality_by_type', COALESCE(quality_by_type, '[]'::json),
    'daily_detections', COALESCE(daily_detections, '[]'::json)
  );

  RETURN result;
END;
$$;
-- =====================================================
-- Tables pour le module Apprentissage Continu (AI Learning)
-- =====================================================

-- 1. Table des modèles d'apprentissage
CREATE TABLE public.ai_learning_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  model_type TEXT NOT NULL DEFAULT 'prediction',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('training', 'active', 'pending', 'error', 'archived')),
  accuracy NUMERIC(5,2) DEFAULT 0,
  data_points INTEGER DEFAULT 0,
  epochs INTEGER DEFAULT 0,
  current_epoch INTEGER DEFAULT 0,
  progress NUMERIC(5,2) DEFAULT 0,
  last_training_at TIMESTAMPTZ,
  next_training_at TIMESTAMPTZ,
  training_frequency TEXT DEFAULT 'weekly',
  hyperparameters JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_ai_learning_models_tenant ON public.ai_learning_models(tenant_id);
CREATE INDEX idx_ai_learning_models_status ON public.ai_learning_models(status);
CREATE INDEX idx_ai_learning_models_active ON public.ai_learning_models(tenant_id, is_active);

-- RLS Policies
ALTER TABLE public.ai_learning_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ai_learning_models"
  ON public.ai_learning_models
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Allow insert for authenticated users"
  ON public.ai_learning_models
  FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1));

-- 2. Table des feedbacks utilisateurs
CREATE TABLE public.ai_learning_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.ai_learning_models(id) ON DELETE SET NULL,
  model_name TEXT,
  feedback_type TEXT NOT NULL DEFAULT 'mixed' CHECK (feedback_type IN ('positive', 'mixed', 'negative')),
  comment TEXT,
  accuracy_before NUMERIC(5,2),
  accuracy_after NUMERIC(5,2),
  user_name TEXT,
  user_id UUID REFERENCES public.personnel(id),
  impact_applied BOOLEAN DEFAULT false,
  impact_applied_at TIMESTAMPTZ,
  impact_analysis JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_ai_learning_feedback_tenant ON public.ai_learning_feedback(tenant_id);
CREATE INDEX idx_ai_learning_feedback_model ON public.ai_learning_feedback(model_id);
CREATE INDEX idx_ai_learning_feedback_type ON public.ai_learning_feedback(feedback_type);

-- RLS Policies
ALTER TABLE public.ai_learning_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ai_learning_feedback"
  ON public.ai_learning_feedback
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Allow insert for authenticated users feedback"
  ON public.ai_learning_feedback
  FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1));

-- 3. Table des datasets d'entraînement
CREATE TABLE public.ai_training_datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  records_count INTEGER DEFAULT 0,
  quality_score NUMERIC(5,2) DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'monthly', 'manual')),
  source_type TEXT DEFAULT 'internal' CHECK (source_type IN ('internal', 'api', 'file', 'database', 'stream')),
  source_name TEXT,
  source_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 365,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  sync_error_message TEXT,
  created_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_ai_training_datasets_tenant ON public.ai_training_datasets(tenant_id);
CREATE INDEX idx_ai_training_datasets_active ON public.ai_training_datasets(tenant_id, is_active);

-- RLS Policies
ALTER TABLE public.ai_training_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ai_training_datasets"
  ON public.ai_training_datasets
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Allow insert for authenticated users datasets"
  ON public.ai_training_datasets
  FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1));

-- 4. Table des sessions d'entraînement
CREATE TABLE public.ai_training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.ai_learning_models(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  epochs_total INTEGER DEFAULT 0,
  epochs_completed INTEGER DEFAULT 0,
  initial_accuracy NUMERIC(5,2),
  final_accuracy NUMERIC(5,2),
  accuracy_gain NUMERIC(5,2),
  training_time_seconds INTEGER DEFAULT 0,
  data_points_used INTEGER DEFAULT 0,
  logs JSONB DEFAULT '[]',
  error_message TEXT,
  hyperparameters_used JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  started_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_ai_training_sessions_tenant ON public.ai_training_sessions(tenant_id);
CREATE INDEX idx_ai_training_sessions_model ON public.ai_training_sessions(model_id);
CREATE INDEX idx_ai_training_sessions_status ON public.ai_training_sessions(status);

-- RLS Policies
ALTER TABLE public.ai_training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ai_training_sessions"
  ON public.ai_training_sessions
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Allow insert for authenticated users sessions"
  ON public.ai_training_sessions
  FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1));

-- =====================================================
-- RPC Functions
-- =====================================================

-- 1. Fonction pour obtenir les métriques d'apprentissage
CREATE OR REPLACE FUNCTION public.get_ai_learning_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_models INTEGER;
  v_active_training INTEGER;
  v_avg_accuracy_gain NUMERIC;
  v_data_processed BIGINT;
  v_training_hours NUMERIC;
BEGIN
  -- Compte des modèles actifs
  SELECT COUNT(*) INTO v_total_models
  FROM ai_learning_models
  WHERE tenant_id = p_tenant_id AND is_active = true;

  -- Modèles en formation
  SELECT COUNT(*) INTO v_active_training
  FROM ai_learning_models
  WHERE tenant_id = p_tenant_id AND status = 'training';

  -- Gain moyen de précision (depuis les sessions complétées ce mois)
  SELECT COALESCE(AVG(accuracy_gain), 0) INTO v_avg_accuracy_gain
  FROM ai_training_sessions
  WHERE tenant_id = p_tenant_id 
    AND status = 'completed'
    AND completed_at >= date_trunc('month', CURRENT_DATE);

  -- Total des données traitées
  SELECT COALESCE(SUM(data_points), 0) INTO v_data_processed
  FROM ai_learning_models
  WHERE tenant_id = p_tenant_id;

  -- Heures de formation ce mois
  SELECT COALESCE(SUM(training_time_seconds) / 3600.0, 0) INTO v_training_hours
  FROM ai_training_sessions
  WHERE tenant_id = p_tenant_id 
    AND completed_at >= date_trunc('month', CURRENT_DATE);

  v_result := jsonb_build_object(
    'totalModels', v_total_models,
    'activeTraining', v_active_training,
    'avgAccuracyGain', ROUND(v_avg_accuracy_gain, 2),
    'dataProcessed', v_data_processed,
    'trainingHours', ROUND(v_training_hours, 1)
  );

  RETURN v_result;
END;
$$;

-- 2. Fonction pour démarrer une session d'entraînement
CREATE OR REPLACE FUNCTION public.start_ai_model_training(
  p_tenant_id UUID,
  p_model_id UUID,
  p_epochs INTEGER DEFAULT 50,
  p_started_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_model RECORD;
BEGIN
  -- Vérifier que le modèle existe et appartient au tenant
  SELECT * INTO v_model
  FROM ai_learning_models
  WHERE id = p_model_id AND tenant_id = p_tenant_id;

  IF v_model IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Modèle non trouvé');
  END IF;

  -- Vérifier qu'il n'est pas déjà en formation
  IF v_model.status = 'training' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le modèle est déjà en formation');
  END IF;

  -- Créer la session d'entraînement
  INSERT INTO ai_training_sessions (
    tenant_id, model_id, status, epochs_total, initial_accuracy,
    hyperparameters_used, started_by, started_at
  ) VALUES (
    p_tenant_id, p_model_id, 'running', p_epochs, v_model.accuracy,
    v_model.hyperparameters, p_started_by, now()
  ) RETURNING id INTO v_session_id;

  -- Mettre à jour le statut du modèle
  UPDATE ai_learning_models
  SET status = 'training',
      current_epoch = 0,
      progress = 0,
      updated_at = now()
  WHERE id = p_model_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'model_id', p_model_id,
    'message', 'Formation démarrée avec succès'
  );
END;
$$;

-- 3. Fonction pour mettre à jour la progression d'entraînement
CREATE OR REPLACE FUNCTION public.update_training_progress(
  p_session_id UUID,
  p_epochs_completed INTEGER,
  p_current_accuracy NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_progress NUMERIC;
BEGIN
  SELECT * INTO v_session
  FROM ai_training_sessions
  WHERE id = p_session_id;

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;

  v_progress := (p_epochs_completed::NUMERIC / NULLIF(v_session.epochs_total, 0)::NUMERIC) * 100;

  -- Mettre à jour la session
  UPDATE ai_training_sessions
  SET epochs_completed = p_epochs_completed,
      metrics = metrics || jsonb_build_object('current_accuracy', p_current_accuracy),
      updated_at = now()
  WHERE id = p_session_id;

  -- Mettre à jour le modèle
  UPDATE ai_learning_models
  SET current_epoch = p_epochs_completed,
      progress = COALESCE(v_progress, 0),
      accuracy = COALESCE(p_current_accuracy, accuracy),
      updated_at = now()
  WHERE id = v_session.model_id;

  RETURN jsonb_build_object('success', true, 'progress', v_progress);
END;
$$;

-- 4. Fonction pour terminer une session d'entraînement
CREATE OR REPLACE FUNCTION public.complete_training_session(
  p_session_id UUID,
  p_final_accuracy NUMERIC,
  p_status TEXT DEFAULT 'completed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_accuracy_gain NUMERIC;
  v_training_time INTEGER;
BEGIN
  SELECT * INTO v_session
  FROM ai_training_sessions
  WHERE id = p_session_id;

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;

  v_accuracy_gain := p_final_accuracy - COALESCE(v_session.initial_accuracy, 0);
  v_training_time := EXTRACT(EPOCH FROM (now() - v_session.started_at))::INTEGER;

  -- Mettre à jour la session
  UPDATE ai_training_sessions
  SET status = p_status,
      completed_at = now(),
      final_accuracy = p_final_accuracy,
      accuracy_gain = v_accuracy_gain,
      training_time_seconds = v_training_time,
      epochs_completed = epochs_total,
      updated_at = now()
  WHERE id = p_session_id;

  -- Mettre à jour le modèle
  UPDATE ai_learning_models
  SET status = CASE WHEN p_status = 'completed' THEN 'active' ELSE 'error' END,
      accuracy = p_final_accuracy,
      progress = 100,
      current_epoch = (SELECT epochs_total FROM ai_training_sessions WHERE id = p_session_id),
      last_training_at = now(),
      next_training_at = CASE 
        WHEN training_frequency = 'daily' THEN now() + INTERVAL '1 day'
        WHEN training_frequency = 'weekly' THEN now() + INTERVAL '7 days'
        WHEN training_frequency = 'monthly' THEN now() + INTERVAL '30 days'
        ELSE now() + INTERVAL '7 days'
      END,
      version = version + 1,
      updated_at = now()
  WHERE id = v_session.model_id;

  RETURN jsonb_build_object(
    'success', true,
    'accuracy_gain', v_accuracy_gain,
    'training_time_seconds', v_training_time
  );
END;
$$;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_ai_learning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_learning_models_updated_at
  BEFORE UPDATE ON ai_learning_models
  FOR EACH ROW EXECUTE FUNCTION update_ai_learning_updated_at();

CREATE TRIGGER trigger_ai_learning_feedback_updated_at
  BEFORE UPDATE ON ai_learning_feedback
  FOR EACH ROW EXECUTE FUNCTION update_ai_learning_updated_at();

CREATE TRIGGER trigger_ai_training_datasets_updated_at
  BEFORE UPDATE ON ai_training_datasets
  FOR EACH ROW EXECUTE FUNCTION update_ai_learning_updated_at();

CREATE TRIGGER trigger_ai_training_sessions_updated_at
  BEFORE UPDATE ON ai_training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_ai_learning_updated_at();
-- ============================================
-- RESTAURATION COMPLÈTE - SECTION ALERTES
-- Plan: Correction des tables existantes + Création des tables manquantes
-- ============================================

-- ============================================
-- PHASE 1: CORRECTION global_alert_settings (P0 - BLOQUANT)
-- ============================================

-- Renommer les colonnes existantes pour correspondre au frontend
ALTER TABLE public.global_alert_settings 
  RENAME COLUMN system_alerts_enabled TO system_enabled;

ALTER TABLE public.global_alert_settings 
  RENAME COLUMN alert_check_frequency_minutes TO check_frequency_minutes;

-- Ajouter les colonnes manquantes attendues par le frontend
ALTER TABLE public.global_alert_settings 
  ADD COLUMN IF NOT EXISTS business_hours_only BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS business_start_time TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS business_end_time TIME DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS business_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  ADD COLUMN IF NOT EXISTS auto_cleanup_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_escalation_level INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS max_alerts_per_hour INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS duplicate_alert_cooldown_minutes INTEGER DEFAULT 30;

-- Migrer les données existantes des anciennes colonnes vers les nouvelles
UPDATE public.global_alert_settings
SET 
  business_start_time = business_hours_start::time,
  business_end_time = business_hours_end::time,
  auto_cleanup_enabled = COALESCE(auto_archive_resolved, true)
WHERE business_hours_start IS NOT NULL;

-- Supprimer les anciennes colonnes devenues obsolètes
ALTER TABLE public.global_alert_settings
  DROP COLUMN IF EXISTS business_hours_start,
  DROP COLUMN IF EXISTS business_hours_end,
  DROP COLUMN IF EXISTS weekend_alerts_enabled,
  DROP COLUMN IF EXISTS auto_archive_resolved,
  DROP COLUMN IF EXISTS escalation_recipient_emails;

COMMENT ON TABLE public.global_alert_settings IS 
'Configuration globale du système d''alertes - structure alignée avec le frontend';

-- ============================================
-- PHASE 2: CORRECTION alert_rules (P0 - BLOQUANT)
-- ============================================

-- Renommer les colonnes pour correspondre au frontend
ALTER TABLE public.alert_rules 
  RENAME COLUMN rule_name TO name;

ALTER TABLE public.alert_rules 
  RENAME COLUMN comparison_operator TO threshold_operator;

ALTER TABLE public.alert_rules 
  RENAME COLUMN condition_config TO conditions;

COMMENT ON TABLE public.alert_rules IS 
'Règles d''alerte personnalisées - structure alignée avec le frontend';

-- ============================================
-- PHASE 3: CRÉATION low_stock_actions_log (P0 - CRITIQUE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.low_stock_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'order_created', 
    'alert_sent', 
    'threshold_updated', 
    'stock_adjusted', 
    'bulk_order', 
    'urgent_order'
  )),
  action_details JSONB DEFAULT '{}'::jsonb,
  executed_by UUID REFERENCES public.personnel(id),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result_status TEXT CHECK (result_status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.low_stock_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view actions log from their tenant"
  ON public.low_stock_actions_log FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert actions log in their tenant"
  ON public.low_stock_actions_log FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Indexes pour performance
CREATE INDEX idx_low_stock_actions_log_produit ON public.low_stock_actions_log(produit_id);
CREATE INDEX idx_low_stock_actions_log_tenant ON public.low_stock_actions_log(tenant_id);
CREATE INDEX idx_low_stock_actions_log_date ON public.low_stock_actions_log(executed_at DESC);
CREATE INDEX idx_low_stock_actions_log_status ON public.low_stock_actions_log(result_status);

COMMENT ON TABLE public.low_stock_actions_log IS 
'Historique des actions effectuées sur les alertes de stock faible';

-- ============================================
-- PHASE 4: CRÉATION stock_alert_recipients (P1 - IMPORTANT)
-- ============================================

CREATE TABLE IF NOT EXISTS public.stock_alert_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  alert_id UUID NOT NULL REFERENCES public.alertes_peremption(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'dashboard', 'whatsapp')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stock_alert_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view alert recipients from their tenant"
  ON public.stock_alert_recipients FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert alert recipients in their tenant"
  ON public.stock_alert_recipients FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update alert recipients from their tenant"
  ON public.stock_alert_recipients FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete alert recipients from their tenant"
  ON public.stock_alert_recipients FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX idx_stock_alert_recipients_alert ON public.stock_alert_recipients(alert_id);
CREATE INDEX idx_stock_alert_recipients_personnel ON public.stock_alert_recipients(personnel_id);
CREATE INDEX idx_stock_alert_recipients_tenant ON public.stock_alert_recipients(tenant_id);

COMMENT ON TABLE public.stock_alert_recipients IS 
'Gestion des destinataires multi-canaux pour les alertes de péremption';

-- ============================================
-- PHASE 5: CRÉATION alertes_fournisseurs (P2 - COMPLÉMENTAIRE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.alertes_fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  fournisseur_id UUID NOT NULL,
  produits_ids UUID[] NOT NULL,
  type_alerte TEXT NOT NULL CHECK (type_alerte IN (
    'rupture_stock', 
    'delai_livraison', 
    'qualite_produit', 
    'urgence'
  )),
  message TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'envoyee' CHECK (statut IN (
    'envoyee', 
    'vue', 
    'repondue', 
    'resolue'
  )),
  canal_envoi TEXT NOT NULL DEFAULT 'email' CHECK (canal_envoi IN (
    'email', 
    'sms', 
    'telephone', 
    'plateforme'
  )),
  metadata JSONB DEFAULT '{}'::jsonb,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_reponse TIMESTAMP WITH TIME ZONE,
  reponse_fournisseur TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alertes_fournisseurs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view supplier alerts from their tenant"
  ON public.alertes_fournisseurs FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert supplier alerts in their tenant"
  ON public.alertes_fournisseurs FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update supplier alerts from their tenant"
  ON public.alertes_fournisseurs FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete supplier alerts from their tenant"
  ON public.alertes_fournisseurs FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX idx_alertes_fournisseurs_tenant ON public.alertes_fournisseurs(tenant_id);
CREATE INDEX idx_alertes_fournisseurs_fournisseur ON public.alertes_fournisseurs(fournisseur_id);
CREATE INDEX idx_alertes_fournisseurs_statut ON public.alertes_fournisseurs(statut);
CREATE INDEX idx_alertes_fournisseurs_date ON public.alertes_fournisseurs(date_envoi DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_alertes_fournisseurs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alertes_fournisseurs_timestamp
BEFORE UPDATE ON public.alertes_fournisseurs
FOR EACH ROW
EXECUTE FUNCTION public.update_alertes_fournisseurs_timestamp();

COMMENT ON TABLE public.alertes_fournisseurs IS 
'Gestion des alertes envoyées aux fournisseurs en cas de rupture ou problème';

-- ============================================
-- PHASE 6: CRÉATION produits_substituts (P2 - COMPLÉMENTAIRE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.produits_substituts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  produit_principal_id UUID NOT NULL,
  produit_substitut_id UUID NOT NULL,
  priorite INTEGER DEFAULT 1,
  raison_substitution TEXT,
  efficacite_validee BOOLEAN DEFAULT false,
  date_derniere_utilisation TIMESTAMP WITH TIME ZONE,
  nombre_utilisations INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_substitution_per_tenant UNIQUE(tenant_id, produit_principal_id, produit_substitut_id)
);

-- Enable RLS
ALTER TABLE public.produits_substituts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view product substitutes from their tenant"
  ON public.produits_substituts FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert product substitutes in their tenant"
  ON public.produits_substituts FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update product substitutes from their tenant"
  ON public.produits_substituts FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete product substitutes from their tenant"
  ON public.produits_substituts FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX idx_produits_substituts_tenant ON public.produits_substituts(tenant_id);
CREATE INDEX idx_produits_substituts_principal ON public.produits_substituts(produit_principal_id);
CREATE INDEX idx_produits_substituts_substitut ON public.produits_substituts(produit_substitut_id);
CREATE INDEX idx_produits_substituts_active ON public.produits_substituts(is_active) WHERE is_active = true;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_produits_substituts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_produits_substituts_timestamp
BEFORE UPDATE ON public.produits_substituts
FOR EACH ROW
EXECUTE FUNCTION public.update_produits_substituts_timestamp();

COMMENT ON TABLE public.produits_substituts IS 
'Gestion des produits de substitution en cas de rupture de stock';

-- ============================================
-- PHASE 7: FONCTION NETTOYAGE ALERTES (P2)
-- ============================================

CREATE OR REPLACE FUNCTION public.nettoyer_alertes_expiration_anciennes(
  p_tenant_id UUID,
  p_jours_retention INTEGER DEFAULT 90
)
RETURNS TABLE (
  alertes_supprimees INTEGER,
  alertes_archivees INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supprimees INTEGER := 0;
  v_archivees INTEGER := 0;
  v_date_limite TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculer la date limite de rétention
  v_date_limite := NOW() - (p_jours_retention || ' days')::INTERVAL;
  
  -- Archiver les alertes résolues anciennes
  UPDATE public.alertes_peremption
  SET statut = 'archivee'
  WHERE tenant_id = p_tenant_id
    AND statut = 'traitee'
    AND created_at < v_date_limite
    AND statut != 'archivee';
  
  GET DIAGNOSTICS v_archivees = ROW_COUNT;
  
  -- Supprimer les alertes très anciennes (au-delà du double de la rétention)
  DELETE FROM public.alertes_peremption
  WHERE tenant_id = p_tenant_id
    AND statut = 'archivee'
    AND created_at < (NOW() - (p_jours_retention * 2 || ' days')::INTERVAL);
  
  GET DIAGNOSTICS v_supprimees = ROW_COUNT;
  
  RETURN QUERY SELECT v_supprimees, v_archivees;
END;
$$;

COMMENT ON FUNCTION public.nettoyer_alertes_expiration_anciennes IS 
'Nettoie et archive les anciennes alertes d''expiration selon la politique de rétention';

-- ============================================
-- VALIDATION FINALE
-- ============================================

-- Vérifier que toutes les tables existent
DO $$
BEGIN
  -- Vérification des tables critiques
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'low_stock_actions_log') THEN
    RAISE EXCEPTION 'Table low_stock_actions_log non créée';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_alert_recipients') THEN
    RAISE EXCEPTION 'Table stock_alert_recipients non créée';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'alertes_fournisseurs') THEN
    RAISE EXCEPTION 'Table alertes_fournisseurs non créée';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'produits_substituts') THEN
    RAISE EXCEPTION 'Table produits_substituts non créée';
  END IF;
  
  RAISE NOTICE 'Migration réussie: Toutes les tables de la section Alertes sont créées et configurées';
END $$;
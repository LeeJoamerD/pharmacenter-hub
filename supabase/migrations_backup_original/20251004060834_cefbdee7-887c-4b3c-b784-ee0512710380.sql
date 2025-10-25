-- Phase 5: Vérification et création des tables manquantes

-- Table lignes_commande_fournisseur (pour détails des commandes)
CREATE TABLE IF NOT EXISTS public.lignes_commande_fournisseur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  commande_id UUID NOT NULL REFERENCES public.commandes_fournisseurs(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  quantite_commandee INTEGER NOT NULL DEFAULT 0,
  prix_achat_unitaire_attendu NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  prix_achat_unitaire_final NUMERIC(10,2),
  quantite_recue INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table stock_alert_recipients (pour notifier plusieurs personnes)
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

-- Table low_stock_actions_log (pour historique des actions)
CREATE TABLE IF NOT EXISTS public.low_stock_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('order_created', 'alert_sent', 'threshold_updated', 'stock_adjusted', 'bulk_order', 'urgent_order')),
  action_details JSONB DEFAULT '{}'::jsonb,
  executed_by UUID REFERENCES public.personnel(id),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result_status TEXT CHECK (result_status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_lignes_commande_commande ON public.lignes_commande_fournisseur(commande_id);
CREATE INDEX IF NOT EXISTS idx_lignes_commande_produit ON public.lignes_commande_fournisseur(produit_id);
CREATE INDEX IF NOT EXISTS idx_lignes_commande_tenant ON public.lignes_commande_fournisseur(tenant_id);

CREATE INDEX IF NOT EXISTS idx_alert_recipients_alert ON public.stock_alert_recipients(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_personnel ON public.stock_alert_recipients(personnel_id);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_tenant ON public.stock_alert_recipients(tenant_id);

CREATE INDEX IF NOT EXISTS idx_actions_log_produit ON public.low_stock_actions_log(produit_id);
CREATE INDEX IF NOT EXISTS idx_actions_log_tenant ON public.low_stock_actions_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_actions_log_date ON public.low_stock_actions_log(executed_at);

-- Enable RLS
ALTER TABLE public.lignes_commande_fournisseur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour lignes_commande_fournisseur
CREATE POLICY "Users can view order lines from their tenant"
  ON public.lignes_commande_fournisseur FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert order lines in their tenant"
  ON public.lignes_commande_fournisseur FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update order lines from their tenant"
  ON public.lignes_commande_fournisseur FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete order lines from their tenant"
  ON public.lignes_commande_fournisseur FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies pour stock_alert_recipients
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

-- RLS Policies pour low_stock_actions_log
CREATE POLICY "Users can view actions log from their tenant"
  ON public.low_stock_actions_log FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert actions log in their tenant"
  ON public.low_stock_actions_log FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Trigger pour updated_at sur lignes_commande_fournisseur
CREATE OR REPLACE FUNCTION update_lignes_commande_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lignes_commande_updated_at
  BEFORE UPDATE ON public.lignes_commande_fournisseur
  FOR EACH ROW
  EXECUTE FUNCTION update_lignes_commande_updated_at();
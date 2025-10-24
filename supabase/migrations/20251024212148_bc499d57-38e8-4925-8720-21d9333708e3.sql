-- ===================================
-- Migration 11: Paramètres Système
-- ===================================

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  langue_defaut TEXT DEFAULT 'fr' CHECK (langue_defaut IN ('fr', 'en')),
  devise TEXT DEFAULT 'FCFA', format_date TEXT DEFAULT 'DD/MM/YYYY', format_heure TEXT DEFAULT 'HH:mm',
  taux_tva_defaut NUMERIC(5,2) DEFAULT 19.25, taux_centime_additionnel_defaut NUMERIC(5,2) DEFAULT 1,
  alerte_stock_critique INTEGER DEFAULT 5, alerte_stock_faible INTEGER DEFAULT 10, alerte_peremption_jours INTEGER DEFAULT 90,
  autoriser_vente_stock_negatif BOOLEAN DEFAULT false, autoriser_remise_ligne BOOLEAN DEFAULT true, remise_maximale NUMERIC(5,2) DEFAULT 50,
  format_ticket TEXT DEFAULT 'A4' CHECK (format_ticket IN ('A4', 'Thermal_80mm')),
  afficher_logo_ticket BOOLEAN DEFAULT true, afficher_qr_code_ticket BOOLEAN DEFAULT false,
  notifications_email BOOLEAN DEFAULT true, notifications_sms BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id)
);

CREATE INDEX idx_system_settings_tenant_id ON public.system_settings(tenant_id);
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_system_settings AFTER INSERT OR UPDATE OR DELETE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  langue TEXT DEFAULT 'fr' CHECK (langue IN ('fr', 'en')),
  lignes_par_page INTEGER DEFAULT 20, colonnes_visibles JSONB DEFAULT '{}',
  notifications_actives BOOLEAN DEFAULT true, notifications_email BOOLEAN DEFAULT true, notifications_desktop BOOLEAN DEFAULT false,
  raccourcis_clavier JSONB DEFAULT '{}', metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.print_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  type_document TEXT CHECK (type_document IN ('Ticket_Vente', 'Facture', 'Bon_Commande', 'Bon_Reception', 'Inventaire')) NOT NULL,
  nom_template TEXT NOT NULL, format_page TEXT DEFAULT 'A4' CHECK (format_page IN ('A4', 'A5', 'Thermal_80mm', 'Thermal_58mm')),
  orientation TEXT DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
  header_html TEXT, body_html TEXT, footer_html TEXT, css_custom TEXT,
  is_default BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_print_templates_tenant_id ON public.print_templates(tenant_id);
CREATE TRIGGER update_print_templates_updated_at BEFORE UPDATE ON public.print_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_print_templates AFTER INSERT OR UPDATE OR DELETE ON public.print_templates FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  type_backup TEXT CHECK (type_backup IN ('Manuel', 'Automatique', 'Planifié')) NOT NULL,
  statut TEXT DEFAULT 'En cours' CHECK (statut IN ('En cours', 'Réussi', 'Échoué')) NOT NULL,
  date_debut TIMESTAMPTZ DEFAULT now(), date_fin TIMESTAMPTZ, taille_backup BIGINT, fichier_backup TEXT,
  erreur_message TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_backup_logs_tenant_id ON public.backup_logs(tenant_id);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_system_settings" ON public.system_settings FOR ALL USING (tenant_id = get_current_user_tenant_id() AND EXISTS (SELECT 1 FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin')) WITH CHECK (tenant_id = get_current_user_tenant_id() AND EXISTS (SELECT 1 FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_preferences" ON public.user_preferences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND tenant_id = get_current_user_tenant_id());

ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_print_templates" ON public.print_templates FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "admins_manage_print_templates" ON public.print_templates FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id() AND EXISTS (SELECT 1 FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));
CREATE POLICY "admins_update_print_templates" ON public.print_templates FOR UPDATE USING (tenant_id = get_current_user_tenant_id() AND EXISTS (SELECT 1 FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));
CREATE POLICY "admins_delete_print_templates" ON public.print_templates FOR DELETE USING (tenant_id = get_current_user_tenant_id() AND EXISTS (SELECT 1 FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));

ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_view_backup_logs" ON public.backup_logs FOR SELECT USING (tenant_id = get_current_user_tenant_id() AND EXISTS (SELECT 1 FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));
CREATE POLICY "system_insert_backup_logs" ON public.backup_logs FOR INSERT WITH CHECK (true);
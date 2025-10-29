-- =====================================================
-- MIGRATION: Correction Configuration de Stock
-- Date: 2025-01-29
-- Source: migrations_backup_original/20251016201226 et 20250818023755
-- Description: Ajout de la colonne maximum_stock_threshold dans alert_settings
--              et création des triggers updated_at pour toutes les tables de configuration
-- =====================================================

-- ===========================
-- PHASE 1: COLONNE MANQUANTE
-- ===========================

-- Ajouter le champ maximum_stock_threshold à alert_settings
ALTER TABLE public.alert_settings 
ADD COLUMN IF NOT EXISTS maximum_stock_threshold INTEGER DEFAULT 100;

COMMENT ON COLUMN public.alert_settings.maximum_stock_threshold IS 
'Seuil de stock maximum par défaut (unités) - utilisé quand stock_limite du produit n''est pas renseigné';

-- ===========================
-- PHASE 2: TRIGGERS UPDATED_AT
-- ===========================

-- Trigger pour stock_settings
DROP TRIGGER IF EXISTS update_stock_settings_updated_at ON public.stock_settings;
CREATE TRIGGER update_stock_settings_updated_at
    BEFORE UPDATE ON public.stock_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour alert_settings
DROP TRIGGER IF EXISTS update_alert_settings_updated_at ON public.alert_settings;
CREATE TRIGGER update_alert_settings_updated_at
    BEFORE UPDATE ON public.alert_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour alert_thresholds_by_category
DROP TRIGGER IF EXISTS update_alert_thresholds_updated_at ON public.alert_thresholds_by_category;
CREATE TRIGGER update_alert_thresholds_updated_at
    BEFORE UPDATE ON public.alert_thresholds_by_category
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour pricing_settings
DROP TRIGGER IF EXISTS update_pricing_settings_updated_at ON public.pricing_settings;
CREATE TRIGGER update_pricing_settings_updated_at
    BEFORE UPDATE ON public.pricing_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour margin_rules
DROP TRIGGER IF EXISTS update_margin_rules_updated_at ON public.margin_rules;
CREATE TRIGGER update_margin_rules_updated_at
    BEFORE UPDATE ON public.margin_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour parametres_systeme
DROP TRIGGER IF EXISTS update_parametres_systeme_updated_at ON public.parametres_systeme;
CREATE TRIGGER update_parametres_systeme_updated_at
    BEFORE UPDATE ON public.parametres_systeme
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================
-- PHASE 3: VALIDATION
-- ===========================

-- S'assurer que les paramètres de stock sont marqués comme modifiables
UPDATE public.parametres_systeme 
SET is_modifiable = true,
    is_visible = true
WHERE cle_parametre LIKE 'stock_%' 
AND categorie = 'general'
AND (is_modifiable IS NULL OR is_modifiable = false OR is_visible IS NULL OR is_visible = false);
-- Restauration de la structure correcte de parametres_systeme
-- Cette migration corrige la structure de la table en supprimant les colonnes incorrectes
-- et en ajoutant les colonnes nécessaires au frontend (valeur_defaut et is_visible)

-- Étape 1 : Supprimer les colonnes incorrectes qui devraient être des lignes
ALTER TABLE public.parametres_systeme
  DROP COLUMN IF EXISTS retention_days,
  DROP COLUMN IF EXISTS purge_enabled,
  DROP COLUMN IF EXISTS low_stock_enabled,
  DROP COLUMN IF EXISTS low_stock_threshold,
  DROP COLUMN IF EXISTS critical_stock_threshold,
  DROP COLUMN IF EXISTS maximum_stock_threshold,
  DROP COLUMN IF EXISTS expiration_alert_days,
  DROP COLUMN IF EXISTS near_expiration_days,
  DROP COLUMN IF EXISTS overdue_inventory_days;

-- Étape 2 : Ajouter les colonnes nécessaires au frontend
ALTER TABLE public.parametres_systeme
ADD COLUMN IF NOT EXISTS valeur_defaut TEXT;

ALTER TABLE public.parametres_systeme
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Index de performance pour les requêtes filtrées par visibilité
CREATE INDEX IF NOT EXISTS idx_parametres_systeme_visible 
ON public.parametres_systeme(tenant_id, is_visible) 
WHERE is_visible = true;

COMMENT ON COLUMN public.parametres_systeme.valeur_defaut IS 
'Valeur par défaut utilisée quand valeur_parametre est NULL';

COMMENT ON COLUMN public.parametres_systeme.is_visible IS 
'Indique si le paramètre est visible dans l''interface utilisateur';

-- Étape 3 : Migrer les données - Créer les paramètres en lignes pour chaque tenant
DO $$
DECLARE
  pharmacy_record RECORD;
BEGIN
  FOR pharmacy_record IN SELECT DISTINCT tenant_id FROM public.parametres_systeme
  LOOP
    -- Créer les paramètres de rétention/archivage si non existants
    INSERT INTO public.parametres_systeme (
      tenant_id, categorie, cle_parametre, valeur_parametre, 
      type_parametre, description, valeur_defaut, is_modifiable, is_visible
    ) VALUES
      (pharmacy_record.tenant_id, 'archivage', 'retention_days', '90', 'number', 
       'Durée de rétention des archives en jours', '90', true, true),
      (pharmacy_record.tenant_id, 'archivage', 'purge_enabled', 'false', 'boolean', 
       'Activation de la purge automatique', 'false', true, true)
    ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;
    
    -- Créer les paramètres de stock si non existants
    INSERT INTO public.parametres_systeme (
      tenant_id, categorie, cle_parametre, valeur_parametre, 
      type_parametre, description, valeur_defaut, is_modifiable, is_visible
    ) VALUES
      (pharmacy_record.tenant_id, 'stock', 'low_stock_enabled', 'true', 'boolean', 
       'Activation des alertes stock faible', 'true', true, true),
      (pharmacy_record.tenant_id, 'stock', 'low_stock_threshold', '10', 'number', 
       'Seuil d''alerte stock faible (%)', '10', true, true),
      (pharmacy_record.tenant_id, 'stock', 'critical_stock_threshold', '5', 'number', 
       'Seuil critique de stock (%)', '5', true, true),
      (pharmacy_record.tenant_id, 'stock', 'maximum_stock_threshold', '1000', 'number', 
       'Seuil maximum de stock', '1000', true, true)
    ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;
    
    -- Créer les paramètres d'expiration si non existants
    INSERT INTO public.parametres_systeme (
      tenant_id, categorie, cle_parametre, valeur_parametre, 
      type_parametre, description, valeur_defaut, is_modifiable, is_visible
    ) VALUES
      (pharmacy_record.tenant_id, 'expiration', 'expiration_alert_days', '30', 'number', 
       'Jours avant expiration pour alerte', '30', true, true),
      (pharmacy_record.tenant_id, 'expiration', 'near_expiration_days', '90', 'number', 
       'Jours avant expiration (proche)', '90', true, true),
      (pharmacy_record.tenant_id, 'expiration', 'overdue_inventory_days', '180', 'number', 
       'Jours avant inventaire en retard', '180', true, true)
    ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;
  END LOOP;
END $$;

-- Étape 4 : Copier les valeurs existantes vers valeur_defaut
UPDATE public.parametres_systeme
SET valeur_defaut = valeur_parametre
WHERE valeur_defaut IS NULL AND valeur_parametre IS NOT NULL;
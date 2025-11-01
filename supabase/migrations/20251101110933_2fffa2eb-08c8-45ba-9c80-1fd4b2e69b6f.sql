-- ============================================
-- CORRECTION DES TABLES SECURITY_ALERTS ET SECURITY_INCIDENTS
-- Ajout des colonnes manquantes pour le Dashboard Administration
-- ============================================

-- ============================================
-- PARTIE 1: CORRECTION DE security_alerts
-- ============================================

-- Ajouter la colonne title
ALTER TABLE public.security_alerts 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Ajouter la colonne status avec valeurs valides
ALTER TABLE public.security_alerts 
ADD COLUMN IF NOT EXISTS status TEXT;

-- Ajouter la colonne updated_at
ALTER TABLE public.security_alerts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Migrer les données existantes - définir des valeurs par défaut
UPDATE public.security_alerts
SET 
  title = CASE 
    WHEN title IS NULL THEN 
      CASE alert_type
        WHEN 'stock_shortage' THEN 'Alerte de rupture de stock'
        WHEN 'expiration' THEN 'Alerte de péremption'
        WHEN 'access_violation' THEN 'Violation d''accès détectée'
        WHEN 'unusual_activity' THEN 'Activité inhabituelle'
        WHEN 'system_error' THEN 'Erreur système'
        ELSE 'Alerte de sécurité'
      END
    ELSE title
  END,
  status = CASE 
    WHEN status IS NULL THEN
      CASE 
        WHEN resolved_at IS NOT NULL THEN 'resolved'
        ELSE 'open'
      END
    ELSE status
  END,
  updated_at = COALESCE(updated_at, resolved_at, created_at)
WHERE title IS NULL OR status IS NULL OR updated_at IS NULL;

-- Définir les colonnes comme NOT NULL avec defaults
ALTER TABLE public.security_alerts 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN status SET DEFAULT 'open',
ALTER COLUMN updated_at SET NOT NULL;

-- Ajouter la contrainte CHECK pour status
ALTER TABLE public.security_alerts
DROP CONSTRAINT IF EXISTS security_alerts_status_check;

ALTER TABLE public.security_alerts
ADD CONSTRAINT security_alerts_status_check 
CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));

-- Créer ou remplacer le trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_security_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_security_alerts_updated_at ON public.security_alerts;

CREATE TRIGGER trigger_update_security_alerts_updated_at
  BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_security_alerts_updated_at();

-- Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_security_alerts_status 
ON public.security_alerts(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_alerts_severity 
ON public.security_alerts(tenant_id, severity)
WHERE status IN ('open', 'in_progress');

-- ============================================
-- PARTIE 2: CORRECTION DE security_incidents
-- ============================================

-- Ajouter la colonne impact_level
ALTER TABLE public.security_incidents 
ADD COLUMN IF NOT EXISTS impact_level TEXT;

-- Ajouter la colonne affected_systems
ALTER TABLE public.security_incidents 
ADD COLUMN IF NOT EXISTS affected_systems TEXT[] DEFAULT '{}';

-- Migrer les données existantes
UPDATE public.security_incidents
SET 
  impact_level = CASE 
    WHEN impact_level IS NULL THEN 
      CASE severity
        WHEN 'critical' THEN 'critical'
        WHEN 'high' THEN 'high'
        WHEN 'medium' THEN 'medium'
        WHEN 'low' THEN 'low'
        ELSE 'medium'
      END
    ELSE impact_level
  END,
  affected_systems = COALESCE(affected_systems, '{}')
WHERE impact_level IS NULL;

-- Définir impact_level comme NOT NULL avec default
ALTER TABLE public.security_incidents 
ALTER COLUMN impact_level SET NOT NULL,
ALTER COLUMN impact_level SET DEFAULT 'medium',
ALTER COLUMN affected_systems SET DEFAULT '{}';

-- Ajouter la contrainte CHECK pour impact_level
ALTER TABLE public.security_incidents
DROP CONSTRAINT IF EXISTS security_incidents_impact_level_check;

ALTER TABLE public.security_incidents
ADD CONSTRAINT security_incidents_impact_level_check 
CHECK (impact_level IN ('low', 'medium', 'high', 'critical'));

-- Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_security_incidents_status 
ON public.security_incidents(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_incidents_impact 
ON public.security_incidents(tenant_id, impact_level, severity)
WHERE status IN ('open', 'investigating');

-- ============================================
-- COMMENTAIRES DE DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.security_alerts.title IS 
'Titre de l''alerte de sécurité';

COMMENT ON COLUMN public.security_alerts.status IS 
'Statut de l''alerte: open, in_progress, resolved, closed';

COMMENT ON COLUMN public.security_alerts.updated_at IS 
'Date de dernière mise à jour de l''alerte';

COMMENT ON COLUMN public.security_incidents.impact_level IS 
'Niveau d''impact de l''incident: low, medium, high, critical';

COMMENT ON COLUMN public.security_incidents.affected_systems IS 
'Liste des systèmes affectés par l''incident';
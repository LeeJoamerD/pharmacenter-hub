-- ============================================================================
-- FONCTION RPC POUR LA DÉTECTION DE PATTERNS SUSPECTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.detect_suspicious_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  suspicious_record RECORD;
  current_tenant_id UUID;
BEGIN
  -- Récupérer le tenant de l'utilisateur actuel
  current_tenant_id := public.get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié ou tenant non trouvé';
  END IF;

  -- Détecter les patterns suspects dans le tenant courant seulement
  FOR suspicious_record IN
    SELECT 
      sa.user_id,
      COUNT(*) as alert_count,
      MAX(sa.created_at) as last_alert,
      array_agg(DISTINCT sa.alert_type) as alert_types
    FROM public.security_alerts sa
    WHERE sa.tenant_id = current_tenant_id
      AND sa.created_at > NOW() - INTERVAL '2 hours'
      AND sa.severity IN ('high', 'critical')
      AND sa.resolved = false
    GROUP BY sa.user_id, sa.tenant_id
    HAVING COUNT(*) >= 3
  LOOP
    -- Vérifier qu'une alerte similaire n'existe pas déjà récemment
    IF NOT EXISTS (
      SELECT 1 FROM public.security_alerts
      WHERE tenant_id = current_tenant_id
        AND user_id = suspicious_record.user_id
        AND alert_type = 'suspicious_pattern_detected'
        AND created_at > NOW() - INTERVAL '1 hour'
    ) THEN
      -- Créer une alerte de pattern suspect
      INSERT INTO public.security_alerts (
        tenant_id,
        user_id,
        alert_type,
        severity,
        description,
        metadata,
        resolved
      ) VALUES (
        current_tenant_id,
        suspicious_record.user_id,
        'suspicious_pattern_detected',
        'critical',
        format('Pattern suspect détecté: %s alertes de haute sévérité en 2h', suspicious_record.alert_count),
        jsonb_build_object(
          'alert_count', suspicious_record.alert_count,
          'time_window', '2 hours',
          'last_alert', suspicious_record.last_alert,
          'alert_types', suspicious_record.alert_types,
          'automated_detection', true,
          'recommended_action', 'immediate_review',
          'detection_timestamp', NOW()
        ),
        false
      );
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.detect_suspicious_patterns() IS 
'Détecte les patterns suspects basés sur 3+ alertes critiques/high en 2h pour un même utilisateur';
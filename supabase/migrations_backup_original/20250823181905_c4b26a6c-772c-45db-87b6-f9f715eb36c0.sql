-- Migration pour finaliser les politiques RLS du module Sécurité

-- ============================================================================
-- 1. POLITIQUES RLS POUR AUDIT_LOGS
-- ============================================================================

-- INSERT: Permettre aux utilisateurs authentifiés d'insérer dans leur tenant
DROP POLICY IF EXISTS "Users can insert audit logs in their tenant" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs in their tenant" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (
  tenant_id = public.get_current_user_tenant_id()
  AND (user_id = auth.uid() OR user_id IS NULL) -- Permettre insertion même sans user_id pour certains logs système
);

-- ============================================================================
-- 2. POLITIQUES RLS POUR SECURITY_ALERTS
-- ============================================================================

-- INSERT: Permettre la création d'alertes dans le tenant courant
DROP POLICY IF EXISTS "Users can insert security alerts in their tenant" ON public.security_alerts;
CREATE POLICY "Users can insert security alerts in their tenant" 
ON public.security_alerts 
FOR INSERT 
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

-- UPDATE: Permettre la résolution par Admin/Pharmacien
DROP POLICY IF EXISTS "Admins can resolve security alerts in their tenant" ON public.security_alerts;
CREATE POLICY "Admins can resolve security alerts in their tenant" 
ON public.security_alerts 
FOR UPDATE 
USING (
  tenant_id = public.get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
)
WITH CHECK (
  tenant_id = public.get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- ============================================================================
-- 3. POLITIQUES RLS POUR LOGIN_ATTEMPTS
-- ============================================================================

-- INSERT: Permettre l'insertion même pour utilisateurs non authentifiés (logs de tentatives échouées)
DROP POLICY IF EXISTS "Allow login attempt logging" ON public.login_attempts;
CREATE POLICY "Allow login attempt logging" 
ON public.login_attempts 
FOR INSERT 
WITH CHECK (tenant_id IS NOT NULL); -- Juste s'assurer qu'un tenant_id est fourni

-- ============================================================================
-- 4. POLITIQUES RLS POUR USER_SESSIONS
-- ============================================================================

-- INSERT: Permettre la création de sessions pour l'utilisateur authentifié dans son tenant
DROP POLICY IF EXISTS "Users can create sessions in their tenant" ON public.user_sessions;
CREATE POLICY "Users can create sessions in their tenant" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (
  tenant_id = public.get_current_user_tenant_id()
  AND personnel_id IN (
    SELECT id FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id = public.get_current_user_tenant_id()
  )
);

-- UPDATE: Permettre la mise à jour par le propriétaire ou admin
DROP POLICY IF EXISTS "Users can update their own sessions or admins can update all" ON public.user_sessions;
CREATE POLICY "Users can update their own sessions or admins can update all" 
ON public.user_sessions 
FOR UPDATE 
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND (
    -- Propriétaire de la session
    personnel_id IN (
      SELECT id FROM public.personnel 
      WHERE auth_user_id = auth.uid()
    )
    OR
    -- Admin/Pharmacien du même tenant
    EXISTS (
      SELECT 1 FROM public.personnel 
      WHERE auth_user_id = auth.uid() 
      AND tenant_id = public.get_current_user_tenant_id()
      AND role IN ('Admin', 'Pharmacien')
    )
  )
)
WITH CHECK (
  tenant_id = public.get_current_user_tenant_id()
);

-- ============================================================================
-- 5. FONCTION RPC POUR LA DÉTECTION DE PATTERNS SUSPECTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.detect_suspicious_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
    GROUP BY sa.user_id, sa.tenant_id
    HAVING COUNT(*) >= 3
  LOOP
    -- Créer une alerte de pattern suspect
    INSERT INTO public.security_alerts (
      tenant_id,
      user_id,
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      current_tenant_id,
      suspicious_record.user_id,
      'suspicious_pattern_detected',
      'critical',
      format('Pattern suspect détecté: %s alertes en 2h', suspicious_record.alert_count),
      jsonb_build_object(
        'alert_count', suspicious_record.alert_count,
        'time_window', '2 hours',
        'last_alert', suspicious_record.last_alert,
        'alert_types', suspicious_record.alert_types,
        'automated_detection', true,
        'recommended_action', 'immediate_review'
      )
    );
  END LOOP;
END;
$$;
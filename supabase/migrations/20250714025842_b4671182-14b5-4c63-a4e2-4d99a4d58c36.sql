-- PHASE 3: SÉCURITÉ LOCATAIRE (MULTI-PHARMACIE)
-- Renforcement de l'isolation des données et sécurité cross-tenant

-- 1. Fonction de validation stricte des accès cross-tenant
CREATE OR REPLACE FUNCTION public.validate_tenant_access(
  target_tenant_id UUID,
  operation_type TEXT DEFAULT 'read'
) RETURNS BOOLEAN AS $$
DECLARE
  user_tenant_id UUID;
  user_role TEXT;
  is_super_admin BOOLEAN := false;
BEGIN
  -- Récupérer le tenant et rôle de l'utilisateur actuel
  SELECT p.tenant_id, p.role INTO user_tenant_id, user_role
  FROM public.personnel p
  WHERE p.auth_user_id = auth.uid();
  
  -- Si pas d'utilisateur authentifié, refuser
  IF user_tenant_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier si l'utilisateur est super admin (peut accéder à tout)
  -- Seulement si explicitement configuré dans les paramètres système
  SELECT EXISTS (
    SELECT 1 FROM public.parametres_systeme 
    WHERE tenant_id = user_tenant_id 
    AND cle_parametre = 'allow_super_admin_access'
    AND valeur_parametre = 'true'
  ) INTO is_super_admin;
  
  -- Si super admin et opération de lecture, autoriser
  IF is_super_admin AND operation_type = 'read' AND user_role = 'Admin' THEN
    -- Logger l'accès super admin
    INSERT INTO public.audit_logs (
      tenant_id, user_id, action, table_name, new_values, status
    ) VALUES (
      user_tenant_id,
      auth.uid(),
      'SUPER_ADMIN_ACCESS',
      'cross_tenant_read',
      jsonb_build_object(
        'target_tenant', target_tenant_id,
        'user_tenant', user_tenant_id,
        'operation', operation_type
      ),
      'logged'
    );
    RETURN true;
  END IF;
  
  -- Règle standard : accès seulement au même tenant
  RETURN user_tenant_id = target_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Fonction de détection et logging des tentatives cross-tenant
CREATE OR REPLACE FUNCTION public.log_cross_tenant_attempt()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
  attempted_tenant_id UUID;
  user_role TEXT;
  table_name TEXT := TG_TABLE_NAME;
BEGIN
  -- Récupérer le tenant de l'utilisateur
  SELECT p.tenant_id, p.role INTO user_tenant_id, user_role
  FROM public.personnel p
  WHERE p.auth_user_id = auth.uid();
  
  -- Déterminer le tenant tenté d'accès
  IF TG_OP = 'DELETE' THEN
    attempted_tenant_id := OLD.tenant_id;
  ELSE
    attempted_tenant_id := NEW.tenant_id;
  END IF;
  
  -- Si tentative cross-tenant détectée
  IF user_tenant_id IS NOT NULL AND 
     attempted_tenant_id IS NOT NULL AND 
     user_tenant_id != attempted_tenant_id THEN
    
    -- Logger l'alerte de sécurité critique
    INSERT INTO public.security_alerts (
      tenant_id,
      user_id,
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      user_tenant_id,
      auth.uid(),
      'cross_tenant_violation',
      'critical',
      'Tentative d''accès cross-tenant bloquée sur ' || table_name,
      jsonb_build_object(
        'user_tenant', user_tenant_id,
        'attempted_tenant', attempted_tenant_id,
        'table', table_name,
        'operation', TG_OP,
        'user_role', user_role,
        'timestamp', NOW(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      )
    );
    
    -- Bloquer l'opération
    RAISE EXCEPTION 'SÉCURITÉ: Accès cross-tenant interdit. Incident signalé. [Code: CT-%]', 
      EXTRACT(EPOCH FROM NOW())::bigint;
  END IF;
  
  -- Autoriser l'opération si même tenant
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction de monitoring des patterns suspects
CREATE OR REPLACE FUNCTION public.detect_suspicious_patterns()
RETURNS VOID AS $$
DECLARE
  suspicious_user RECORD;
  alert_count INTEGER;
BEGIN
  -- Détecter les utilisateurs avec trop de tentatives cross-tenant
  FOR suspicious_user IN
    SELECT 
      sa.user_id,
      sa.tenant_id,
      COUNT(*) as violation_count,
      MAX(sa.created_at) as last_violation
    FROM public.security_alerts sa
    WHERE sa.alert_type = 'cross_tenant_violation'
      AND sa.created_at > NOW() - INTERVAL '1 hour'
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
      suspicious_user.tenant_id,
      suspicious_user.user_id,
      'suspicious_pattern_detected',
      'critical',
      'Pattern suspect détecté: ' || suspicious_user.violation_count || ' tentatives cross-tenant en 1h',
      jsonb_build_object(
        'violation_count', suspicious_user.violation_count,
        'time_window', '1 hour',
        'last_violation', suspicious_user.last_violation,
        'recommended_action', 'review_user_access'
      )
    );
    
    -- Optionnel: Désactiver automatiquement l'utilisateur
    -- (Commenté pour éviter les blocages accidentels)
    /*
    UPDATE public.personnel 
    SET is_active = false
    WHERE auth_user_id = suspicious_user.user_id;
    */
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Table de configuration de sécurité cross-tenant
CREATE TABLE IF NOT EXISTS public.tenant_security_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  allow_cross_tenant_read BOOLEAN NOT NULL DEFAULT false,
  allowed_source_tenants UUID[] DEFAULT ARRAY[]::UUID[],
  security_level TEXT NOT NULL DEFAULT 'strict' CHECK (security_level IN ('strict', 'moderate', 'permissive')),
  auto_block_violations BOOLEAN NOT NULL DEFAULT true,
  max_violations_per_hour INTEGER NOT NULL DEFAULT 3,
  notification_webhook TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_tenant_security_config_tenant FOREIGN KEY (tenant_id) REFERENCES public.pharmacies(id),
  CONSTRAINT unique_tenant_security_config UNIQUE (tenant_id)
);

-- 5. Table des accès inter-pharmacies autorisés
CREATE TABLE IF NOT EXISTS public.cross_tenant_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_tenant_id UUID NOT NULL,
  target_tenant_id UUID NOT NULL,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'admin')),
  table_name TEXT NOT NULL,
  granted_by UUID NOT NULL, -- personnel qui a accordé la permission
  granted_to UUID, -- personnel spécifique ou NULL pour tous
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_cross_tenant_source FOREIGN KEY (source_tenant_id) REFERENCES public.pharmacies(id),
  CONSTRAINT fk_cross_tenant_target FOREIGN KEY (target_tenant_id) REFERENCES public.pharmacies(id),
  CONSTRAINT fk_cross_tenant_granted_by FOREIGN KEY (granted_by) REFERENCES public.personnel(id),
  CONSTRAINT fk_cross_tenant_granted_to FOREIGN KEY (granted_to) REFERENCES public.personnel(id)
);

-- 6. Fonction de vérification des permissions cross-tenant
CREATE OR REPLACE FUNCTION public.check_cross_tenant_permission(
  source_tenant UUID,
  target_tenant UUID,
  table_name TEXT,
  permission_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_personnel_id UUID;
  permission_exists BOOLEAN := false;
BEGIN
  -- Récupérer l'ID du personnel actuel
  SELECT id INTO current_personnel_id
  FROM public.personnel
  WHERE auth_user_id = auth.uid();
  
  -- Vérifier s'il existe une permission active
  SELECT EXISTS (
    SELECT 1 FROM public.cross_tenant_permissions ctp
    WHERE ctp.source_tenant_id = source_tenant
      AND ctp.target_tenant_id = target_tenant
      AND ctp.table_name = check_cross_tenant_permission.table_name
      AND ctp.permission_type = check_cross_tenant_permission.permission_type
      AND ctp.is_active = true
      AND (ctp.expires_at IS NULL OR ctp.expires_at > NOW())
      AND (ctp.granted_to IS NULL OR ctp.granted_to = current_personnel_id)
  ) INTO permission_exists;
  
  RETURN permission_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. Créer des triggers de sécurité sur toutes les tables sensibles
CREATE OR REPLACE FUNCTION public.setup_cross_tenant_security_triggers()
RETURNS VOID AS $$
DECLARE
  table_record RECORD;
  trigger_name TEXT;
BEGIN
  -- Liste des tables avec tenant_id à sécuriser
  FOR table_record IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('audit_logs', 'security_alerts', 'permissions', 'roles')
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = tablename
          AND column_name = 'tenant_id'
      )
  LOOP
    trigger_name := 'trigger_cross_tenant_security_' || table_record.tablename;
    
    -- Supprimer le trigger s'il existe déjà
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trigger_name, table_record.tablename);
    
    -- Créer le nouveau trigger
    EXECUTE format(
      'CREATE TRIGGER %I
       BEFORE INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.log_cross_tenant_attempt()',
      trigger_name, table_record.tablename
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Activer les triggers sur toutes les tables
SELECT public.setup_cross_tenant_security_triggers();

-- 9. Créer des indexes pour optimiser les requêtes de sécurité
CREATE INDEX IF NOT EXISTS idx_security_alerts_cross_tenant 
ON public.security_alerts (tenant_id, alert_type, created_at) 
WHERE alert_type IN ('cross_tenant_violation', 'suspicious_pattern_detected');

CREATE INDEX IF NOT EXISTS idx_cross_tenant_permissions_active 
ON public.cross_tenant_permissions (source_tenant_id, target_tenant_id, is_active, expires_at);

-- 10. Activer RLS sur les nouvelles tables
ALTER TABLE public.tenant_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_tenant_permissions ENABLE ROW LEVEL SECURITY;

-- 11. Créer les policies RLS pour les nouvelles tables
CREATE POLICY "Admins can manage tenant security config" 
ON public.tenant_security_config 
FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "Admins can manage cross-tenant permissions" 
ON public.cross_tenant_permissions 
FOR ALL 
USING (
  (source_tenant_id = get_current_user_tenant_id() OR target_tenant_id = get_current_user_tenant_id()) AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- 12. Insérer une configuration de sécurité par défaut pour chaque tenant
INSERT INTO public.tenant_security_config (tenant_id, security_level)
SELECT id, 'strict' FROM public.pharmacies
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_security_config 
  WHERE tenant_id = pharmacies.id
);

-- 13. Créer une tâche de nettoyage automatique (fonction)
CREATE OR REPLACE FUNCTION public.cleanup_security_data()
RETURNS VOID AS $$
BEGIN
  -- Supprimer les alertes de sécurité anciennes (> 6 mois)
  DELETE FROM public.security_alerts 
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND severity NOT IN ('critical');
  
  -- Désactiver les permissions cross-tenant expirées
  UPDATE public.cross_tenant_permissions 
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
  
  -- Nettoyer les tentatives de connexion anciennes
  DELETE FROM public.login_attempts 
  WHERE created_at < NOW() - INTERVAL '3 months';
  
  -- Nettoyer les sessions inactives anciennes
  DELETE FROM public.user_sessions 
  WHERE is_active = false 
  AND updated_at < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
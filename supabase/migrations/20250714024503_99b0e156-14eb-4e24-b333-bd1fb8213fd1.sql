-- PHASE 1: AUDIT ET NETTOYAGE DE SÉCURITÉ
-- Correction des failles critiques de sécurité dans PharmaSoft

-- 1. Renforcer les policies INSERT avec vérification de rôles
DROP POLICY IF EXISTS "Users can insert categories in their tenant" ON public.categorie_tarification;
CREATE POLICY "Authorized users can insert categories in their tenant" 
ON public.categorie_tarification 
FOR INSERT 
WITH CHECK (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Gestionnaire de stock')
  )
);

DROP POLICY IF EXISTS "Users can insert products in their tenant" ON public.produits;
CREATE POLICY "Authorized users can insert products in their tenant" 
ON public.produits 
FOR INSERT 
WITH CHECK (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Gestionnaire de stock')
  )
);

DROP POLICY IF EXISTS "Users can insert sales in their tenant" ON public.ventes;
CREATE POLICY "Authorized users can insert sales in their tenant" 
ON public.ventes 
FOR INSERT 
WITH CHECK (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Caissier', 'Vendeur')
  )
);

-- 2. Créer une fonction de vérification de permissions sécurisée
CREATE OR REPLACE FUNCTION public.check_user_permission(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.personnel 
  WHERE auth_user_id = auth.uid()
  AND tenant_id = public.get_current_user_tenant_id();
  
  RETURN user_role = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Restreindre l'accès aux permissions (éviter l'énumération)
DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
CREATE POLICY "Authenticated users can view permissions" 
ON public.permissions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Créer une fonction d'audit améliorée pour les opérations sensibles
CREATE OR REPLACE FUNCTION public.log_sensitive_operation(
  operation_type TEXT,
  table_name TEXT,
  record_data JSONB,
  risk_level TEXT DEFAULT 'medium'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    personnel_id,
    action,
    table_name,
    new_values,
    ip_address,
    status
  ) VALUES (
    public.get_current_user_tenant_id(),
    auth.uid(),
    (SELECT id FROM public.personnel WHERE auth_user_id = auth.uid()),
    operation_type || '_SENSITIVE',
    table_name,
    jsonb_build_object(
      'risk_level', risk_level,
      'data', record_data,
      'timestamp', NOW()
    ),
    current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    'logged'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer une policy de monitoring des tentatives d'accès non autorisées
CREATE OR REPLACE FUNCTION public.log_unauthorized_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Logger toute tentative d'insertion/modification sans autorisation
  INSERT INTO public.security_alerts (
    tenant_id,
    user_id,
    alert_type,
    severity,
    description,
    metadata
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    'unauthorized_operation_attempt',
    'high',
    'Tentative d''opération non autorisée sur ' || TG_TABLE_NAME,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    )
  );
  
  RETURN NULL; -- Bloque l'opération
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer des indexes pour optimiser les requêtes de sécurité
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_security 
ON public.audit_logs (tenant_id, action, created_at) 
WHERE action LIKE '%SENSITIVE%';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_alerts_monitoring 
ON public.security_alerts (tenant_id, severity, created_at) 
WHERE severity IN ('high', 'critical');

-- 7. Fonction de nettoyage des logs anciens (GDPR compliance)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS VOID AS $$
BEGIN
  -- Supprimer les logs d'audit > 2 ans (sauf les critiques)
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND action NOT LIKE '%CRITICAL%'
  AND action NOT LIKE '%SECURITY%';
  
  -- Anonymiser les alertes de sécurité > 1 an
  UPDATE public.security_alerts 
  SET metadata = jsonb_build_object('anonymized', true, 'date', created_at)
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND severity NOT IN ('critical');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
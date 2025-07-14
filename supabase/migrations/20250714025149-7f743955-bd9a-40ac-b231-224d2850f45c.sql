-- PHASE 2: AUTHENTIFICATION MULTI-NIVEAUX
-- Implémentation d'un système d'authentification renforcé

-- 1. Table des tentatives de connexion
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Index pour optimiser les requêtes
  CONSTRAINT fk_login_attempts_tenant FOREIGN KEY (tenant_id) REFERENCES public.pharmacies(id)
);

-- 2. Table des sessions utilisateur avec contrôle avancé
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  personnel_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  security_level TEXT NOT NULL DEFAULT 'standard' CHECK (security_level IN ('basic', 'standard', 'elevated', 'high')),
  requires_2fa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_user_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES public.pharmacies(id),
  CONSTRAINT fk_user_sessions_personnel FOREIGN KEY (personnel_id) REFERENCES public.personnel(id)
);

-- 3. Table de politique des mots de passe
CREATE TABLE IF NOT EXISTS public.password_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  min_length INTEGER NOT NULL DEFAULT 8,
  require_uppercase BOOLEAN NOT NULL DEFAULT true,
  require_lowercase BOOLEAN NOT NULL DEFAULT true,
  require_numbers BOOLEAN NOT NULL DEFAULT true,
  require_special_chars BOOLEAN NOT NULL DEFAULT true,
  max_age_days INTEGER NOT NULL DEFAULT 90,
  remember_last_passwords INTEGER NOT NULL DEFAULT 5,
  max_failed_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 480, -- 8 heures
  force_2fa_for_roles TEXT[] DEFAULT ARRAY['Admin', 'Pharmacien'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_password_policies_tenant FOREIGN KEY (tenant_id) REFERENCES public.pharmacies(id)
);

-- 4. Table pour l'historique des mots de passe
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  personnel_id UUID NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_password_history_tenant FOREIGN KEY (tenant_id) REFERENCES public.pharmacies(id),
  CONSTRAINT fk_password_history_personnel FOREIGN KEY (personnel_id) REFERENCES public.personnel(id)
);

-- 5. Table pour l'authentification à deux facteurs
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  personnel_id UUID NOT NULL UNIQUE,
  secret_key TEXT NOT NULL,
  backup_codes TEXT[], -- codes de récupération
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_two_factor_auth_tenant FOREIGN KEY (tenant_id) REFERENCES public.pharmacies(id),
  CONSTRAINT fk_two_factor_auth_personnel FOREIGN KEY (personnel_id) REFERENCES public.personnel(id)
);

-- 6. Fonction de validation des mots de passe
CREATE OR REPLACE FUNCTION public.validate_password_strength(
  password TEXT,
  tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  policy RECORD;
  result JSONB;
  is_valid BOOLEAN := true;
  errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Récupérer la politique de mots de passe
  SELECT * INTO policy 
  FROM public.password_policies 
  WHERE password_policies.tenant_id = validate_password_strength.tenant_id;
  
  -- Si pas de politique, utiliser les valeurs par défaut
  IF policy IS NULL THEN
    policy.min_length := 8;
    policy.require_uppercase := true;
    policy.require_lowercase := true;
    policy.require_numbers := true;
    policy.require_special_chars := true;
  END IF;
  
  -- Vérifier la longueur
  IF LENGTH(password) < policy.min_length THEN
    is_valid := false;
    errors := array_append(errors, 'Le mot de passe doit contenir au moins ' || policy.min_length || ' caractères');
  END IF;
  
  -- Vérifier les majuscules
  IF policy.require_uppercase AND password !~ '[A-Z]' THEN
    is_valid := false;
    errors := array_append(errors, 'Le mot de passe doit contenir au moins une majuscule');
  END IF;
  
  -- Vérifier les minuscules
  IF policy.require_lowercase AND password !~ '[a-z]' THEN
    is_valid := false;
    errors := array_append(errors, 'Le mot de passe doit contenir au moins une minuscule');
  END IF;
  
  -- Vérifier les chiffres
  IF policy.require_numbers AND password !~ '[0-9]' THEN
    is_valid := false;
    errors := array_append(errors, 'Le mot de passe doit contenir au moins un chiffre');
  END IF;
  
  -- Vérifier les caractères spéciaux
  IF policy.require_special_chars AND password !~ '[^A-Za-z0-9]' THEN
    is_valid := false;
    errors := array_append(errors, 'Le mot de passe doit contenir au moins un caractère spécial');
  END IF;
  
  result := jsonb_build_object(
    'is_valid', is_valid,
    'errors', to_jsonb(errors),
    'policy', to_jsonb(policy)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction de vérification des tentatives de connexion
CREATE OR REPLACE FUNCTION public.check_login_attempts(
  email TEXT,
  tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  policy RECORD;
  failed_attempts INTEGER;
  last_attempt TIMESTAMP WITH TIME ZONE;
  is_locked BOOLEAN := false;
  lockout_remaining INTEGER := 0;
BEGIN
  -- Récupérer la politique
  SELECT * INTO policy 
  FROM public.password_policies 
  WHERE password_policies.tenant_id = check_login_attempts.tenant_id;
  
  -- Valeurs par défaut si pas de politique
  IF policy IS NULL THEN
    policy.max_failed_attempts := 5;
    policy.lockout_duration_minutes := 30;
  END IF;
  
  -- Compter les tentatives échouées récentes
  SELECT 
    COUNT(*),
    MAX(created_at)
  INTO failed_attempts, last_attempt
  FROM public.login_attempts 
  WHERE login_attempts.email = check_login_attempts.email
    AND login_attempts.tenant_id = check_login_attempts.tenant_id
    AND success = false
    AND created_at > NOW() - INTERVAL '1 day';
  
  -- Vérifier si le compte est verrouillé
  IF failed_attempts >= policy.max_failed_attempts AND 
     last_attempt > NOW() - (policy.lockout_duration_minutes || ' minutes')::INTERVAL THEN
    is_locked := true;
    lockout_remaining := EXTRACT(EPOCH FROM (
      last_attempt + (policy.lockout_duration_minutes || ' minutes')::INTERVAL - NOW()
    ))::INTEGER / 60;
  END IF;
  
  RETURN jsonb_build_object(
    'is_locked', is_locked,
    'failed_attempts', failed_attempts,
    'max_attempts', policy.max_failed_attempts,
    'lockout_remaining_minutes', lockout_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction de calcul du niveau de risque d'une session
CREATE OR REPLACE FUNCTION public.calculate_session_risk_score(
  ip_address TEXT,
  user_agent TEXT,
  personnel_id UUID
) RETURNS INTEGER AS $$
DECLARE
  risk_score INTEGER := 0;
  known_ip_count INTEGER;
  known_agent_count INTEGER;
BEGIN
  -- Vérifier si l'IP est connue
  SELECT COUNT(*) INTO known_ip_count
  FROM public.user_sessions
  WHERE user_sessions.personnel_id = calculate_session_risk_score.personnel_id
    AND user_sessions.ip_address = calculate_session_risk_score.ip_address
    AND created_at > NOW() - INTERVAL '30 days';
  
  IF known_ip_count = 0 THEN
    risk_score := risk_score + 30; -- Nouvelle IP
  END IF;
  
  -- Vérifier si le user agent est connu
  SELECT COUNT(*) INTO known_agent_count
  FROM public.user_sessions
  WHERE user_sessions.personnel_id = calculate_session_risk_score.personnel_id
    AND user_sessions.user_agent = calculate_session_risk_score.user_agent
    AND created_at > NOW() - INTERVAL '30 days';
  
  IF known_agent_count = 0 THEN
    risk_score := risk_score + 20; -- Nouveau navigateur/appareil
  END IF;
  
  -- Heure de connexion inhabituelle (entre 22h et 6h)
  IF EXTRACT(HOUR FROM NOW()) BETWEEN 22 AND 23 OR EXTRACT(HOUR FROM NOW()) BETWEEN 0 AND 6 THEN
    risk_score := risk_score + 10;
  END IF;
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Créer des indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_tenant 
ON public.login_attempts (email, tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_personnel_active 
ON public.user_sessions (personnel_id, is_active, last_activity);

CREATE INDEX IF NOT EXISTS idx_password_history_personnel 
ON public.password_history (personnel_id, created_at);

-- 10. Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- 11. Créer les policies RLS
CREATE POLICY "Users can view login attempts from their tenant" 
ON public.login_attempts 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view sessions from their tenant" 
ON public.user_sessions 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage password policies in their tenant" 
ON public.password_policies 
FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "Users can view password policies from their tenant" 
ON public.password_policies 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view their own 2FA settings" 
ON public.two_factor_auth 
FOR SELECT 
USING (
  tenant_id = get_current_user_tenant_id() AND
  personnel_id = (
    SELECT id FROM public.personnel 
    WHERE auth_user_id = auth.uid()
  )
);

-- 12. Insérer des politiques par défaut pour chaque tenant existant
INSERT INTO public.password_policies (tenant_id)
SELECT id FROM public.pharmacies
WHERE NOT EXISTS (
  SELECT 1 FROM public.password_policies 
  WHERE tenant_id = pharmacies.id
);
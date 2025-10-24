-- Migration 15: Corriger les schémas pour conformité avec anciennes migrations

-- ============================================================================
-- ÉTAPE 1: Corriger password_policies
-- ============================================================================

-- Renommer les colonnes
ALTER TABLE password_policies 
  RENAME COLUMN prevent_reuse_count TO remember_last_passwords;

ALTER TABLE password_policies 
  RENAME COLUMN lockout_attempts TO max_failed_attempts;

-- Changer la valeur par défaut du timeout de session
ALTER TABLE password_policies 
  ALTER COLUMN session_timeout_minutes SET DEFAULT 480;

-- Ajouter la colonne pour forcer 2FA pour certains rôles
ALTER TABLE password_policies 
  ADD COLUMN force_2fa_for_roles TEXT[] DEFAULT ARRAY['Admin', 'Pharmacien'];

-- ============================================================================
-- ÉTAPE 2: Corriger user_sessions
-- ============================================================================

-- Changer le type de ip_address de INET à TEXT
ALTER TABLE user_sessions 
  ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;

-- Définir la valeur par défaut pour security_level
ALTER TABLE user_sessions 
  ALTER COLUMN security_level SET DEFAULT 'standard';

-- Ajouter contrainte CHECK pour security_level
ALTER TABLE user_sessions 
  ADD CONSTRAINT check_security_level 
  CHECK (security_level IN ('basic', 'standard', 'elevated', 'high'));

-- Ajouter la colonne requires_2fa
ALTER TABLE user_sessions 
  ADD COLUMN requires_2fa BOOLEAN DEFAULT false;

-- ============================================================================
-- ÉTAPE 3: Corriger login_attempts
-- ============================================================================

-- Changer le type de ip_address de INET à TEXT
ALTER TABLE login_attempts 
  ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;

-- ============================================================================
-- ÉTAPE 4: Créer password_history
-- ============================================================================

CREATE TABLE public.password_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  personnel_id UUID NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_password_history_personnel ON public.password_history(personnel_id);
CREATE INDEX idx_password_history_tenant ON public.password_history(tenant_id);

-- RLS
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_access_password_history" ON public.password_history
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- ÉTAPE 5: Créer two_factor_auth
-- ============================================================================

CREATE TABLE public.two_factor_auth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  personnel_id UUID NOT NULL UNIQUE,
  secret_key TEXT NOT NULL,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_two_factor_auth_personnel ON public.two_factor_auth(personnel_id);
CREATE INDEX idx_two_factor_auth_tenant ON public.two_factor_auth(tenant_id);

-- RLS
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_access_two_factor_auth" ON public.two_factor_auth
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Trigger pour updated_at
CREATE TRIGGER update_two_factor_auth_updated_at
  BEFORE UPDATE ON public.two_factor_auth
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ÉTAPE 6: Créer les fonctions RPC manquantes
-- ============================================================================

-- Fonction 1: Valider la force du mot de passe
CREATE OR REPLACE FUNCTION public.validate_password_strength(
  password TEXT,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy RECORD;
  errors TEXT[] := '{}';
  is_valid BOOLEAN := true;
BEGIN
  -- Récupérer la politique de mot de passe
  SELECT * INTO policy FROM password_policies WHERE tenant_id = p_tenant_id LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'isValid', false,
      'errors', ARRAY['Politique de mot de passe non trouvée'],
      'policy', NULL
    );
  END IF;
  
  -- Vérifier la longueur minimale
  IF LENGTH(password) < policy.min_length THEN
    errors := array_append(errors, 'Le mot de passe doit contenir au moins ' || policy.min_length || ' caractères');
    is_valid := false;
  END IF;
  
  -- Vérifier les majuscules
  IF policy.require_uppercase AND password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Le mot de passe doit contenir au moins une majuscule');
    is_valid := false;
  END IF;
  
  -- Vérifier les minuscules
  IF policy.require_lowercase AND password !~ '[a-z]' THEN
    errors := array_append(errors, 'Le mot de passe doit contenir au moins une minuscule');
    is_valid := false;
  END IF;
  
  -- Vérifier les chiffres
  IF policy.require_numbers AND password !~ '[0-9]' THEN
    errors := array_append(errors, 'Le mot de passe doit contenir au moins un chiffre');
    is_valid := false;
  END IF;
  
  -- Vérifier les caractères spéciaux
  IF policy.require_special_chars AND password !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Le mot de passe doit contenir au moins un caractère spécial');
    is_valid := false;
  END IF;
  
  RETURN jsonb_build_object(
    'isValid', is_valid,
    'errors', errors,
    'policy', row_to_json(policy)
  );
END;
$$;

-- Fonction 2: Vérifier les tentatives de connexion
CREATE OR REPLACE FUNCTION public.check_login_attempts(
  p_email TEXT,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy RECORD;
  failed_count INTEGER;
  last_failed TIMESTAMPTZ;
  lockout_until TIMESTAMPTZ;
  is_locked BOOLEAN := false;
BEGIN
  -- Récupérer la politique
  SELECT * INTO policy FROM password_policies WHERE tenant_id = p_tenant_id LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'isLocked', false,
      'attemptsRemaining', 5,
      'lockoutUntil', NULL
    );
  END IF;
  
  -- Compter les échecs récents
  SELECT COUNT(*), MAX(created_at)
  INTO failed_count, last_failed
  FROM login_attempts
  WHERE email = p_email 
    AND tenant_id = p_tenant_id
    AND success = false
    AND created_at > NOW() - (policy.lockout_duration_minutes || ' minutes')::INTERVAL;
  
  -- Vérifier si le compte est verrouillé
  IF failed_count >= policy.max_failed_attempts THEN
    lockout_until := last_failed + (policy.lockout_duration_minutes || ' minutes')::INTERVAL;
    
    IF NOW() < lockout_until THEN
      is_locked := true;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'isLocked', is_locked,
    'attemptsRemaining', GREATEST(0, policy.max_failed_attempts - failed_count),
    'lockoutUntil', lockout_until,
    'failedAttempts', failed_count
  );
END;
$$;

-- Fonction 3: Calculer le score de risque de session
CREATE OR REPLACE FUNCTION public.calculate_session_risk_score(
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_personnel_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  risk_score INTEGER := 0;
  prev_sessions INTEGER;
  prev_ips INTEGER;
BEGIN
  -- Score de base
  risk_score := 10;
  
  -- Vérifier si c'est une IP connue
  SELECT COUNT(DISTINCT ip_address)
  INTO prev_ips
  FROM user_sessions
  WHERE personnel_id = p_personnel_id
    AND ip_address = p_ip_address
    AND is_active = true;
  
  IF prev_ips = 0 THEN
    risk_score := risk_score + 20; -- Nouvelle IP
  END IF;
  
  -- Vérifier le nombre de sessions actives
  SELECT COUNT(*)
  INTO prev_sessions
  FROM user_sessions
  WHERE personnel_id = p_personnel_id
    AND is_active = true;
  
  IF prev_sessions > 3 THEN
    risk_score := risk_score + 15; -- Trop de sessions actives
  END IF;
  
  -- Vérifier si le user agent est connu
  IF p_user_agent IS NULL OR LENGTH(p_user_agent) < 10 THEN
    risk_score := risk_score + 10; -- User agent suspect
  END IF;
  
  -- Limiter le score entre 0 et 100
  RETURN LEAST(100, GREATEST(0, risk_score));
END;
$$;

-- ============================================================================
-- ÉTAPE 7: Indexes de performance supplémentaires
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_personnel ON public.user_sessions(personnel_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON public.login_attempts(success, created_at DESC);
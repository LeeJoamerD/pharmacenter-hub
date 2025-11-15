-- Fix check_login_attempts function to use correct column name max_failed_attempts
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

COMMENT ON FUNCTION public.check_login_attempts IS 
'Vérifie si un compte est verrouillé suite à trop de tentatives de connexion échouées. Utilise max_failed_attempts de password_policies.';
-- 1. Créer une politique de mot de passe par défaut pour la pharmacie DJL - Computer Sciences
INSERT INTO password_policies (
  tenant_id,
  min_length,
  require_uppercase,
  require_lowercase,
  require_numbers,
  require_special_chars,
  max_failed_attempts,
  lockout_duration_minutes,
  max_age_days,
  remember_last_passwords,
  session_timeout_minutes
) VALUES (
  'b51e3719-13d1-4cfb-96ed-2429bb62b411',
  8,
  true,
  true,
  true,
  true,
  3,
  20,
  90,
  5,
  480
) ON CONFLICT (tenant_id) DO NOTHING;

-- 2. Améliorer la fonction validate_password_strength pour utiliser des valeurs par défaut
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
  default_min_length INTEGER := 8;
BEGIN
  -- Récupérer la politique de mot de passe
  SELECT * INTO policy FROM password_policies WHERE tenant_id = p_tenant_id LIMIT 1;
  
  -- Si pas de politique, utiliser les valeurs par défaut au lieu de rejeter
  IF NOT FOUND THEN
    -- Validation basique avec valeurs par défaut
    IF LENGTH(password) < default_min_length THEN
      errors := array_append(errors, 'Le mot de passe doit contenir au moins ' || default_min_length || ' caractères');
      is_valid := false;
    END IF;
    
    IF password !~ '[A-Z]' THEN
      errors := array_append(errors, 'Le mot de passe doit contenir au moins une majuscule');
      is_valid := false;
    END IF;
    
    IF password !~ '[a-z]' THEN
      errors := array_append(errors, 'Le mot de passe doit contenir au moins une minuscule');
      is_valid := false;
    END IF;
    
    IF password !~ '[0-9]' THEN
      errors := array_append(errors, 'Le mot de passe doit contenir au moins un chiffre');
      is_valid := false;
    END IF;
    
    IF password !~ '[^A-Za-z0-9]' THEN
      errors := array_append(errors, 'Le mot de passe doit contenir au moins un caractère spécial');
      is_valid := false;
    END IF;
    
    RETURN jsonb_build_object(
      'isValid', is_valid,
      'errors', errors,
      'policy', jsonb_build_object(
        'min_length', default_min_length,
        'require_uppercase', true,
        'require_lowercase', true,
        'require_numbers', true,
        'require_special_chars', true,
        'is_default', true
      )
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

-- 3. Créer un trigger pour ajouter automatiquement une politique à chaque nouvelle pharmacie
CREATE OR REPLACE FUNCTION public.create_default_password_policy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO password_policies (
    tenant_id,
    min_length,
    require_uppercase,
    require_lowercase,
    require_numbers,
    require_special_chars,
    max_failed_attempts,
    lockout_duration_minutes,
    max_age_days,
    remember_last_passwords,
    session_timeout_minutes
  ) VALUES (
    NEW.id,
    8, true, true, true, true,
    3, 20, 90, 5, 480
  ) ON CONFLICT (tenant_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_create_default_password_policy ON pharmacies;

-- Créer le trigger
CREATE TRIGGER trigger_create_default_password_policy
  AFTER INSERT ON pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_password_policy();
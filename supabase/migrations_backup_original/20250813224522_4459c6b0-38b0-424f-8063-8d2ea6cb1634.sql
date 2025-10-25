-- Fonction pour vérifier l'existence d'un email pharmacie
CREATE OR REPLACE FUNCTION public.check_pharmacy_email_exists(email_to_check text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pharmacy_record record;
  auth_user_record record;
BEGIN
  -- Vérifier si l'email existe dans la table pharmacies
  SELECT id, name, email, status 
  INTO pharmacy_record
  FROM public.pharmacies 
  WHERE lower(email) = lower(email_to_check)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'exists', false,
      'pharmacy_id', null,
      'google_verified', false
    );
  END IF;
  
  -- Vérifier si cet email a un compte auth.users avec OAuth Google
  SELECT id, email, raw_user_meta_data
  INTO auth_user_record
  FROM auth.users
  WHERE lower(email) = lower(email_to_check)
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'exists', true,
    'pharmacy_id', pharmacy_record.id,
    'pharmacy_name', pharmacy_record.name,
    'pharmacy_status', pharmacy_record.status,
    'google_verified', CASE 
      WHEN auth_user_record.id IS NOT NULL THEN true 
      ELSE false 
    END,
    'has_auth_account', CASE 
      WHEN auth_user_record.id IS NOT NULL THEN true 
      ELSE false 
    END
  );
END;
$$;
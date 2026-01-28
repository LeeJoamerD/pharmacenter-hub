-- Correction : ajouter le préfixe extensions. à gen_random_bytes

-- 1. Corriger authenticate_pharmacy
CREATE OR REPLACE FUNCTION public.authenticate_pharmacy(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy RECORD;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_pharmacy 
  FROM pharmacies 
  WHERE lower(email) = lower(p_email)
  AND password_hash IS NOT NULL
  AND password_hash = extensions.crypt(p_password, password_hash)
  AND status = 'active';
  
  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(p_email)) THEN
      IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(p_email) AND password_hash IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mot de passe non configuré. Contactez l''administrateur.');
      END IF;
      RETURN jsonb_build_object('success', false, 'error', 'Mot de passe incorrect');
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Aucune pharmacie trouvée avec cet email');
  END IF;
  
  -- CORRECTION : extensions.gen_random_bytes
  v_session_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
  UPDATE pharmacy_sessions 
  SET is_active = false 
  WHERE pharmacy_id = v_pharmacy.id AND is_active = true;
  
  INSERT INTO pharmacy_sessions (pharmacy_id, session_token, expires_at, is_active)
  VALUES (v_pharmacy.id, v_session_token, v_expires_at, true);
  
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy', jsonb_build_object(
      'id', v_pharmacy.id,
      'name', v_pharmacy.name,
      'email', v_pharmacy.email,
      'code', v_pharmacy.code,
      'address', v_pharmacy.address,
      'city', v_pharmacy.city,
      'quartier', v_pharmacy.quartier,
      'arrondissement', v_pharmacy.arrondissement,
      'departement', v_pharmacy.departement,
      'region', v_pharmacy.region,
      'pays', v_pharmacy.pays,
      'type', v_pharmacy.type,
      'status', v_pharmacy.status,
      'telephone_appel', v_pharmacy.telephone_appel,
      'telephone_whatsapp', v_pharmacy.telephone_whatsapp,
      'logo', v_pharmacy.logo,
      'created_at', v_pharmacy.created_at,
      'updated_at', v_pharmacy.updated_at
    ),
    'session_token', v_session_token,
    'expires_at', v_expires_at
  );
END;
$$;

-- 2. Corriger register_pharmacy_simple
CREATE OR REPLACE FUNCTION public.register_pharmacy_simple(
  pharmacy_data JSONB,
  pharmacy_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy_id UUID;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_password_hash TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(pharmacy_data->>'email')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Une pharmacie avec cet email existe déjà');
  END IF;
  
  v_password_hash := extensions.crypt(pharmacy_password, extensions.gen_salt('bf'));
  
  INSERT INTO pharmacies (
    name, code, address, quartier, arrondissement, city, departement,
    region, pays, telephone_appel, telephone_whatsapp, email, type, status, password_hash
  )
  VALUES (
    pharmacy_data->>'name',
    COALESCE(pharmacy_data->>'code', 'PH' || extract(epoch from now())::text),
    pharmacy_data->>'address',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'city',
    pharmacy_data->>'departement',
    COALESCE(pharmacy_data->>'region', 'République du Congo'),
    COALESCE(pharmacy_data->>'pays', 'République du Congo'),
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'email',
    COALESCE(pharmacy_data->>'type', 'standard'),
    'active',
    v_password_hash
  )
  RETURNING id INTO v_pharmacy_id;
  
  -- CORRECTION : extensions.gen_random_bytes
  v_session_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
  INSERT INTO pharmacy_sessions (pharmacy_id, session_token, expires_at, is_active)
  VALUES (v_pharmacy_id, v_session_token, v_expires_at, true);
  
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy_id', v_pharmacy_id,
    'session_token', v_session_token,
    'expires_at', v_expires_at
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Réappliquer les permissions
GRANT EXECUTE ON FUNCTION public.authenticate_pharmacy(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_pharmacy_simple(JSONB, TEXT) TO anon, authenticated;
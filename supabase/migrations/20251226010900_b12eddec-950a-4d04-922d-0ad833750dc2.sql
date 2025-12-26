-- Fix pgcrypto calls: schema-qualify and cast options to text

-- 1) encrypt_fournisseur_password: use extensions.pgp_sym_encrypt and cast options
CREATE OR REPLACE FUNCTION public.encrypt_fournisseur_password(p_tenant_id uuid, p_plain text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_key text;
  v_cipher bytea;
BEGIN
  IF p_plain IS NULL OR btrim(p_plain) = '' THEN
    RETURN NULL;
  END IF;

  IF left(p_plain, 4) = 'enc:' THEN
    RETURN p_plain;
  END IF;

  v_key := public.get_fournisseur_import_key(p_tenant_id);

  v_cipher := extensions.pgp_sym_encrypt(
    p_plain,
    v_key,
    ('cipher-algo=aes256,compress-algo=1')::text
  );

  RETURN 'enc:' || encode(v_cipher, 'base64');
END;
$$;

-- 2) decrypt_fournisseur_password: use extensions.pgp_sym_decrypt
CREATE OR REPLACE FUNCTION public.decrypt_fournisseur_password(p_tenant_id uuid, p_cipher_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_key text;
  v_b64 text;
  v_cipher bytea;
  v_plain text;
BEGIN
  -- Accès tenant
  IF public.get_current_user_tenant_id() IS DISTINCT FROM p_tenant_id THEN
    RAISE EXCEPTION 'Accès refusé au tenant %', p_tenant_id;
  END IF;

  -- Déchiffrement uniquement pour les admins/pharmaciens
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Accès refusé (décryptage)';
  END IF;

  IF p_cipher_text IS NULL OR btrim(p_cipher_text) = '' THEN
    RETURN NULL;
  END IF;

  IF left(p_cipher_text, 4) <> 'enc:' THEN
    -- Compat: valeur encore en clair
    RETURN p_cipher_text;
  END IF;

  v_b64 := substr(p_cipher_text, 5);
  v_cipher := decode(v_b64, 'base64');

  v_key := public.get_fournisseur_import_key(p_tenant_id);

  v_plain := extensions.pgp_sym_decrypt(v_cipher, v_key);
  RETURN v_plain;
END;
$$;

-- 3) Trigger function: ensure search_path includes extensions (even if it calls other functions)
CREATE OR REPLACE FUNCTION public.trg_encrypt_fournisseur_import_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF NEW.mp_fournisseur_import IS NOT NULL AND btrim(NEW.mp_fournisseur_import) <> '' THEN
    IF left(NEW.mp_fournisseur_import, 4) <> 'enc:' THEN
      NEW.mp_fournisseur_import := public.encrypt_fournisseur_password(NEW.tenant_id, NEW.mp_fournisseur_import);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Permissions (idempotent)
GRANT EXECUTE ON FUNCTION public.encrypt_fournisseur_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_fournisseur_password(uuid, text) TO authenticated;
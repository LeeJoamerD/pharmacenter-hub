-- Correction: utiliser extensions.gen_random_bytes(32) pour pgcrypto

-- 1) Corriger ensure_encryption_key avec le bon schéma
CREATE OR REPLACE FUNCTION public.ensure_encryption_key(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public, extensions
AS $$
DECLARE
  v_key text;
BEGIN
  -- Désactiver RLS temporairement pour cette transaction
  PERFORM set_config('row_security', 'off', true);

  -- Tenter de récupérer la clé existante
  SELECT fournisseur_import_key
    INTO v_key
  FROM public.encryption_keys
  WHERE tenant_id = p_tenant_id;

  IF v_key IS NOT NULL AND v_key <> '' THEN
    RETURN v_key;
  END IF;

  -- Créer une clé si absente (utiliser extensions.gen_random_bytes explicitement)
  v_key := encode(extensions.gen_random_bytes(32), 'base64');

  INSERT INTO public.encryption_keys (tenant_id, fournisseur_import_key)
  VALUES (p_tenant_id, v_key)
  ON CONFLICT (tenant_id)
  DO UPDATE SET fournisseur_import_key = EXCLUDED.fournisseur_import_key,
                updated_at = now()
  RETURNING fournisseur_import_key INTO v_key;

  RETURN v_key;
END;
$$;

-- 2) Mettre à jour get_fournisseur_import_key
CREATE OR REPLACE FUNCTION public.get_fournisseur_import_key(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions
AS $$
DECLARE
  v_key text;
BEGIN
  v_key := public.ensure_encryption_key(p_tenant_id);

  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Clé de chiffrement manquante pour le tenant %', p_tenant_id;
  END IF;

  RETURN v_key;
END;
$$;

-- 3) Générer immédiatement la clé pour le tenant existant (sans dépendre de session)
INSERT INTO public.encryption_keys (tenant_id, fournisseur_import_key)
VALUES (
  '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
  encode(extensions.gen_random_bytes(32), 'base64')
)
ON CONFLICT (tenant_id) DO UPDATE 
SET fournisseur_import_key = EXCLUDED.fournisseur_import_key,
    updated_at = now();

-- 4) Permissions
GRANT EXECUTE ON FUNCTION public.ensure_encryption_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fournisseur_import_key(uuid) TO authenticated;
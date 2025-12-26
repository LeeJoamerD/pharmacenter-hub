-- Auto-génération de la clé de chiffrement par tenant

-- 1) Fonction: ensure_encryption_key
CREATE OR REPLACE FUNCTION public.ensure_encryption_key(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_key text;
BEGIN
  -- Vérifier que l'utilisateur appartient bien au tenant demandé
  IF public.get_current_user_tenant_id() IS DISTINCT FROM p_tenant_id THEN
    RAISE EXCEPTION 'Accès refusé au tenant %', p_tenant_id;
  END IF;

  -- S'assurer que la fonction puisse agir même si la table est sous RLS
  PERFORM set_config('row_security', 'off', true);

  -- Tenter de récupérer la clé existante
  SELECT fournisseur_import_key
    INTO v_key
  FROM public.encryption_keys
  WHERE tenant_id = p_tenant_id;

  IF v_key IS NOT NULL AND v_key <> '' THEN
    RETURN v_key;
  END IF;

  -- Créer une clé si absente (32 bytes => base64)
  v_key := encode(gen_random_bytes(32), 'base64');

  INSERT INTO public.encryption_keys (tenant_id, fournisseur_import_key)
  VALUES (p_tenant_id, v_key)
  ON CONFLICT (tenant_id)
  DO UPDATE SET fournisseur_import_key = EXCLUDED.fournisseur_import_key,
                updated_at = now()
  RETURNING fournisseur_import_key INTO v_key;

  RETURN v_key;
END;
$$;

-- 2) Modifier get_fournisseur_import_key pour auto-créer la clé
CREATE OR REPLACE FUNCTION public.get_fournisseur_import_key(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_key text;
BEGIN
  -- Vérifier que l'utilisateur appartient bien au tenant demandé
  IF public.get_current_user_tenant_id() IS DISTINCT FROM p_tenant_id THEN
    RAISE EXCEPTION 'Accès refusé au tenant %', p_tenant_id;
  END IF;

  v_key := public.ensure_encryption_key(p_tenant_id);

  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Clé de chiffrement manquante pour le tenant %', p_tenant_id;
  END IF;

  RETURN v_key;
END;
$$;

-- 3) Générer la clé pour le tenant existant
DO $$
BEGIN
  -- Génère une clé si nécessaire, sans rien casser si déjà présent
  PERFORM public.ensure_encryption_key('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'::uuid);
EXCEPTION WHEN OTHERS THEN
  -- Ne pas bloquer la migration si la session n'a pas de tenant courant
  RAISE NOTICE 'ensure_encryption_key skipped in migration context: %', SQLERRM;
END;
$$;

-- 4) Permissions
GRANT EXECUTE ON FUNCTION public.ensure_encryption_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fournisseur_import_key(uuid) TO authenticated;
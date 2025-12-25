-- Chiffrement du champ fournisseurs.mp_fournisseur_import (mot de passe import)

-- Extension nécessaire
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction générique updated_at (au cas où elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Table de clés de chiffrement (par tenant)
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  tenant_id uuid PRIMARY KEY REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  fournisseur_import_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_encryption_keys_updated_at ON public.encryption_keys;
CREATE TRIGGER update_encryption_keys_updated_at
BEFORE UPDATE ON public.encryption_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Politiques RLS (accès admin/pharmacien uniquement)
DROP POLICY IF EXISTS "encryption_keys_select_admin" ON public.encryption_keys;
DROP POLICY IF EXISTS "encryption_keys_insert_admin" ON public.encryption_keys;
DROP POLICY IF EXISTS "encryption_keys_update_admin" ON public.encryption_keys;
DROP POLICY IF EXISTS "encryption_keys_delete_admin" ON public.encryption_keys;

CREATE POLICY "encryption_keys_select_admin"
ON public.encryption_keys
FOR SELECT
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND public.is_system_admin()
);

CREATE POLICY "encryption_keys_insert_admin"
ON public.encryption_keys
FOR INSERT
WITH CHECK (
  tenant_id = public.get_current_user_tenant_id()
  AND public.is_system_admin()
);

CREATE POLICY "encryption_keys_update_admin"
ON public.encryption_keys
FOR UPDATE
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND public.is_system_admin()
)
WITH CHECK (
  tenant_id = public.get_current_user_tenant_id()
  AND public.is_system_admin()
);

CREATE POLICY "encryption_keys_delete_admin"
ON public.encryption_keys
FOR DELETE
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND public.is_system_admin()
);

-- Helper: récupérer la clé (SECURITY DEFINER pour pouvoir lire la table)
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

  SELECT fournisseur_import_key
    INTO v_key
  FROM public.encryption_keys
  WHERE tenant_id = p_tenant_id;

  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Clé de chiffrement manquante pour le tenant %', p_tenant_id;
  END IF;

  RETURN v_key;
END;
$$;

-- Chiffrer (retourne un texte préfixé pour éviter les doubles-chiffrements)
CREATE OR REPLACE FUNCTION public.encrypt_fournisseur_password(p_tenant_id uuid, p_plain text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

  v_cipher := pgp_sym_encrypt(
    p_plain,
    v_key,
    'cipher-algo=aes256,compress-algo=1'
  );

  RETURN 'enc:' || encode(v_cipher, 'base64');
END;
$$;

-- Déchiffrer (réservé admin/pharmacien)
CREATE OR REPLACE FUNCTION public.decrypt_fournisseur_password(p_tenant_id uuid, p_cipher_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

  v_plain := pgp_sym_decrypt(v_cipher, v_key);
  RETURN v_plain;
END;
$$;

GRANT EXECUTE ON FUNCTION public.encrypt_fournisseur_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_fournisseur_password(uuid, text) TO authenticated;

-- Trigger: chiffrer automatiquement avant INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.trg_encrypt_fournisseur_import_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

DROP TRIGGER IF EXISTS fournisseurs_encrypt_mp_fournisseur_import ON public.fournisseurs;
CREATE TRIGGER fournisseurs_encrypt_mp_fournisseur_import
BEFORE INSERT OR UPDATE OF mp_fournisseur_import
ON public.fournisseurs
FOR EACH ROW
EXECUTE FUNCTION public.trg_encrypt_fournisseur_import_password();

-- Migration des données existantes (uniquement si en clair)
UPDATE public.fournisseurs
SET mp_fournisseur_import = public.encrypt_fournisseur_password(tenant_id, mp_fournisseur_import)
WHERE mp_fournisseur_import IS NOT NULL
  AND btrim(mp_fournisseur_import) <> ''
  AND left(mp_fournisseur_import, 4) <> 'enc:';

COMMENT ON TABLE public.encryption_keys IS 'Clés de chiffrement par tenant (accès restreint).';
COMMENT ON COLUMN public.fournisseurs.mp_fournisseur_import IS 'Mot de passe (chiffré au repos) pour l’import fournisseur (préfixé enc:).';
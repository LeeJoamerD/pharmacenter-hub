CREATE OR REPLACE FUNCTION public.create_initial_admin_personnel(
  p_tenant_id uuid,
  p_auth_user_id uuid,
  p_noms text,
  p_prenoms text,
  p_email text,
  p_telephone text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  admin_count int;
  new_personnel_id uuid;
  v_reference_agent text;
BEGIN
  SET LOCAL row_security = off;

  -- Sécurité : n'autoriser que si la pharmacie n'a AUCUN admin
  SELECT count(*) INTO admin_count
  FROM personnel WHERE tenant_id = p_tenant_id AND role = 'Admin';

  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Cette pharmacie possède déjà un administrateur';
  END IF;

  -- Générer référence agent
  v_reference_agent := 'AG-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6);

  INSERT INTO personnel (tenant_id, auth_user_id, noms, prenoms, email,
    telephone_appel, role, reference_agent, is_active)
  VALUES (p_tenant_id, p_auth_user_id, p_noms, p_prenoms, p_email,
    p_telephone, 'Admin', v_reference_agent, true)
  RETURNING id INTO new_personnel_id;

  -- Créer le client associé
  INSERT INTO clients (tenant_id, type_client, personnel_id, nom_complet, telephone, taux_remise_automatique)
  VALUES (p_tenant_id, 'Personnel', new_personnel_id, p_prenoms || ' ' || p_noms, p_telephone, 0.00);

  RETURN jsonb_build_object('success', true, 'personnel_id', new_personnel_id);
END;
$$;
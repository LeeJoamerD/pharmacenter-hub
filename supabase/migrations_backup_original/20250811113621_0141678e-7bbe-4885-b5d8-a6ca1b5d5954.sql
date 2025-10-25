-- Purge de toutes les pharmacies sauf celle à conserver, et des données associées aux autres tenants
-- Sécurisé pour n'affecter que le schéma public et l'ID fourni
DO $$
DECLARE
  v_keep_id uuid := 'c6dde9fb-2ae8-442b-a9d5-39be58f4eb4c';
  r record;
BEGIN
  -- Vérification de sécurité : la pharmacie à conserver doit exister
  IF NOT EXISTS (
    SELECT 1 FROM public.pharmacies WHERE id = v_keep_id
  ) THEN
    RAISE EXCEPTION 'Pharmacie à conserver introuvable: %', v_keep_id;
  END IF;

  -- 1) Supprimer les données de tous les autres tenants dans toutes les tables ayant une colonne tenant_id
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name <> 'pharmacies' -- on garde la suppression des pharmacies pour la fin
    GROUP BY c.table_name
  LOOP
    EXECUTE format(
      'DELETE FROM public.%I WHERE tenant_id IN (SELECT id FROM public.pharmacies WHERE id <> $1)'
      , r.table_name
    ) USING v_keep_id;
  END LOOP;

  -- 2) Supprimer aussi dans les tables ayant une colonne pharmacy_id (sessions, présence, etc.)
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'pharmacy_id'
    GROUP BY c.table_name
  LOOP
    EXECUTE format(
      'DELETE FROM public.%I WHERE pharmacy_id IN (SELECT id FROM public.pharmacies WHERE id <> $1)'
      , r.table_name
    ) USING v_keep_id;
  END LOOP;

  -- 3) Cas particulier connu: messages réseau envoyés par d'autres pharmacies
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'network_messages' AND column_name = 'sender_pharmacy_id'
  ) THEN
    EXECUTE 
      'DELETE FROM public.network_messages 
       WHERE sender_pharmacy_id IN (SELECT id FROM public.pharmacies WHERE id <> $1)'
    USING v_keep_id;
  END IF;

  -- 4) Enfin, supprimer toutes les pharmacies sauf celle conservée
  DELETE FROM public.pharmacies WHERE id <> v_keep_id;
END $$;
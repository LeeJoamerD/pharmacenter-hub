-- Purge contrôlée: conserver uniquement la pharmacie spécifiée et nettoyer les données associées
DO $$
DECLARE
  v_keep_id uuid := 'c6dde9fb-2ae8-442b-ad95-39be58f4eb4c';
  r record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pharmacies WHERE id = v_keep_id) THEN
    RAISE EXCEPTION 'Pharmacie à conserver introuvable: %', v_keep_id;
  END IF;

  -- 1) Supprimer les données des autres tenants (on exclut audit_logs et pharmacies pour gérer les FK proprement)
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name NOT IN ('pharmacies','audit_logs')
    GROUP BY c.table_name
  LOOP
    EXECUTE format(
      'DELETE FROM public.%I WHERE tenant_id IN (SELECT id FROM public.pharmacies WHERE id <> $1)'
      , r.table_name
    ) USING v_keep_id;
  END LOOP;

  -- 2) Supprimer dans les tables avec pharmacy_id
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

  -- 3) Cas particulier: messages réseau
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'network_messages' AND column_name = 'sender_pharmacy_id'
  ) THEN
    EXECUTE 
      'DELETE FROM public.network_messages 
       WHERE sender_pharmacy_id IN (SELECT id FROM public.pharmacies WHERE id <> $1)'
    USING v_keep_id;
  END IF;

  -- 4) Nettoyer les logs d'audit des autres tenants avant de supprimer les pharmacies
  DELETE FROM public.audit_logs 
  WHERE tenant_id IN (SELECT id FROM public.pharmacies WHERE id <> v_keep_id);

  -- 5) Désactiver les triggers sur la table pharmacies pour éviter l'insertion de nouveaux logs pendant la suppression
  EXECUTE 'ALTER TABLE public.pharmacies DISABLE TRIGGER ALL';

  -- 6) Supprimer toutes les pharmacies sauf celle conservée
  DELETE FROM public.pharmacies WHERE id <> v_keep_id;

  -- 7) Réactiver les triggers
  EXECUTE 'ALTER TABLE public.pharmacies ENABLE TRIGGER ALL';
END $$;
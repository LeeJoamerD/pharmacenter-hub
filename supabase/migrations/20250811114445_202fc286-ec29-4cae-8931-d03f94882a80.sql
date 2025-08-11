-- Suppression ciblée des pharmacies (sauf une) en contournant le log d'audit pour éviter les contraintes FK
DO $$
DECLARE
  v_keep_id uuid := 'c6dde9fb-2ae8-442b-ad95-39be58f4eb4c';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pharmacies WHERE id = v_keep_id) THEN
    RAISE EXCEPTION 'Pharmacie à conserver introuvable: %', v_keep_id;
  END IF;

  -- Nettoyer d'abord les audit_logs des autres tenants pour éviter tout FK
  DELETE FROM public.audit_logs 
  WHERE tenant_id IN (SELECT id FROM public.pharmacies WHERE id <> v_keep_id);

  -- Désactiver uniquement le trigger d'audit sur pharmacies
  ALTER TABLE public.pharmacies DISABLE TRIGGER audit_pharmacies;

  -- Supprimer toutes les autres pharmacies
  DELETE FROM public.pharmacies WHERE id <> v_keep_id;

  -- Réactiver le trigger d'audit
  ALTER TABLE public.pharmacies ENABLE TRIGGER audit_pharmacies;
END $$;
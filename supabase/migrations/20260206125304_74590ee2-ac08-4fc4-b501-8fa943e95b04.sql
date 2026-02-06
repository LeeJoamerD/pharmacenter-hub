
-- Phase 1.1 : Corriger les clients dont le tenant_id diverge de leur personnel
UPDATE public.clients c
SET tenant_id = p.tenant_id,
    updated_at = now()
FROM public.personnel p
WHERE c.personnel_id = p.id
  AND c.tenant_id != p.tenant_id;

-- Phase 1.2 : Créer les clients manquants pour les personnels qui n'en ont pas
INSERT INTO public.clients (
  tenant_id, type_client, personnel_id, nom_complet, telephone, adresse, taux_remise_automatique
)
SELECT 
  p.tenant_id,
  'Personnel'::public.type_client,
  p.id,
  CONCAT(p.prenoms, ' ', p.noms),
  p.telephone_appel,
  p.adresse,
  0.00
FROM public.personnel p
LEFT JOIN public.clients c ON c.personnel_id = p.id AND c.tenant_id = p.tenant_id
WHERE c.id IS NULL;

-- Phase 1.3 : Améliorer le trigger INSERT
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id, type_client, personnel_id, nom_complet, telephone, adresse, taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Personnel'::public.type_client,
    NEW.id,
    CONCAT(NEW.prenoms, ' ', NEW.noms),
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Client already exists for personnel % in tenant %', NEW.id, NEW.tenant_id;
  RETURN NEW;
WHEN OTHERS THEN
  RAISE LOG 'CRITICAL: Failed to create client for personnel %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;

-- Phase 1.4 : Améliorer le trigger UPDATE - gérer les changements de tenant_id
CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    UPDATE public.clients SET
      tenant_id = NEW.tenant_id,
      nom_complet = CONCAT(NEW.prenoms, ' ', NEW.noms),
      telephone = NEW.telephone_appel,
      adresse = NEW.adresse,
      updated_at = now()
    WHERE personnel_id = NEW.id AND tenant_id = OLD.tenant_id;
  ELSE
    UPDATE public.clients SET
      nom_complet = CONCAT(NEW.prenoms, ' ', NEW.noms),
      telephone = NEW.telephone_appel,
      adresse = NEW.adresse,
      updated_at = now()
    WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$function$;

NOTIFY pgrst, 'reload schema';

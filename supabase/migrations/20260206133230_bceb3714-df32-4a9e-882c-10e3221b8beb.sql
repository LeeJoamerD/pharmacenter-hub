
-- 1. Corriger create_client_for_societe
CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    societe_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Entreprise'::public.type_client,
    NEW.id,
    NEW.libelle_societe,
    NEW.telephone_appel,
    NEW.adresse,
    COALESCE(NEW.taux_remise_automatique, 0.00)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'create_client_for_societe FAILED for societe_id=%, error: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2. Corriger create_client_for_conventionne
CREATE OR REPLACE FUNCTION public.create_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    conventionne_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Conventionné'::public.type_client,
    NEW.id,
    NEW.noms,
    NEW.telephone_appel,
    NEW.adresse,
    COALESCE(NEW.taux_remise_automatique, 0.00)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'create_client_for_conventionne FAILED for conventionne_id=%, error: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 3. Corriger sync_client_from_societe
CREATE OR REPLACE FUNCTION public.sync_client_from_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.clients
  SET
    nom_complet = NEW.libelle_societe,
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0.00)
  WHERE societe_id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'sync_client_from_societe FAILED for societe_id=%, error: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

NOTIFY pgrst, 'reload schema';

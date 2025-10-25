-- Corriger la première fonction avec le bon search_path
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    personnel_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Personnel'::type_client_enum,
    NEW.id,
    NEW.noms || ' ' || NEW.prenoms,
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  RETURN NEW;
END;
$function$;
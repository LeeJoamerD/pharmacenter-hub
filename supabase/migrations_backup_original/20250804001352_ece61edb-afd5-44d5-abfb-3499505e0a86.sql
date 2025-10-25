-- Fonction pour créer un client pour un nouveau personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
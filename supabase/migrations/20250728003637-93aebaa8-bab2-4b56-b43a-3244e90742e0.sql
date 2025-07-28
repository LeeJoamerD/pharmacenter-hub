-- Corriger le problème d'enum type_client
-- D'abord, vérifier le type enum existant
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'type_client_enum'
);

-- Modifier le trigger pour utiliser le bon cast
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
    'Assuré'::type_client_enum,
    NEW.id,
    NEW.libelle_societe,
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  RETURN NEW;
END;
$function$;

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
    'Conventionné'::type_client_enum,
    NEW.id,
    NEW.noms,
    NEW.telephone_appel,
    NEW.adresse,
    NEW.taux_remise_automatique
  );
  RETURN NEW;
END;
$function$;
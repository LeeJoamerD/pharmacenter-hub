-- Rendre assureur_id obligatoire dans la table societes
ALTER TABLE public.societes 
ALTER COLUMN assureur_id SET NOT NULL;

-- Mettre à jour la fonction trigger pour utiliser le bon type de client "Assuré"
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
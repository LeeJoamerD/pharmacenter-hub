-- Corriger le trigger pour utiliser le bon type de client "Assuré" au lieu de "Assurer"
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
    'Assuré'::type_client_enum,  -- Correction: utiliser "Assuré" au lieu de "Assurer"
    NEW.id,
    NEW.libelle_societe,
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  RETURN NEW;
END;
$function$;
-- Fonction pour mettre à jour le client quand le personnel est modifié
CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.clients SET
    nom_complet = NEW.noms || ' ' || NEW.prenoms,
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    updated_at = now()
  WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$function$;
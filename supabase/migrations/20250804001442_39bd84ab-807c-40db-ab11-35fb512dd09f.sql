-- Fonction pour supprimer le client quand le personnel est supprimé
CREATE OR REPLACE FUNCTION public.delete_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.clients 
  WHERE personnel_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$function$;
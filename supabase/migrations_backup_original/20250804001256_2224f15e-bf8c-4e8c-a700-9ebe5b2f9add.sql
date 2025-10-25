-- Créer des triggers pour créer automatiquement un client quand un personnel est créé

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
$function$

-- Fonction pour mettre à jour le client quand le personnel est modifié
CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
$function$

-- Fonction pour supprimer le client quand le personnel est supprimé
CREATE OR REPLACE FUNCTION public.delete_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.clients 
  WHERE personnel_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$function$

-- Triggers pour la table employes_rh
CREATE TRIGGER trigger_create_client_for_personnel
  AFTER INSERT ON public.employes_rh
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_personnel();

CREATE TRIGGER trigger_update_client_for_personnel
  AFTER UPDATE ON public.employes_rh
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_for_personnel();

CREATE TRIGGER trigger_delete_client_for_personnel
  AFTER DELETE ON public.employes_rh
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_client_for_personnel();
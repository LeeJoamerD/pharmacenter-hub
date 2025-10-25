-- Corriger le trigger create_client_for_personnel pour éviter l'erreur de foreign key

-- D'abord, supprimer le trigger existant
DROP TRIGGER IF EXISTS trigger_create_client_for_personnel ON public.employes_rh;

-- Modifier la fonction pour gérer correctement l'ID personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insérer directement dans la table clients avec le bon personnel_id
  -- Utiliser NEW.id qui fait référence à l'ID de l'employé RH nouvellement créé
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
    'personnel'::type_client_enum,
    NEW.id,  -- Utiliser l'ID de l'employé RH comme personnel_id
    CONCAT(NEW.prenoms, ' ', NEW.noms),
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, logger mais ne pas bloquer la création de l'employé
  RAISE WARNING 'Erreur lors de la création du client pour l''employé %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Recréer le trigger AFTER INSERT
CREATE TRIGGER trigger_create_client_for_personnel
  AFTER INSERT ON public.employes_rh
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_personnel();
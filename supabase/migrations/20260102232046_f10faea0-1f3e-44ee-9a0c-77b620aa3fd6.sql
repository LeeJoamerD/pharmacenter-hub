-- Ajouter les colonnes taux_agent et taux_ayant_droit à la table personnel
ALTER TABLE public.personnel
ADD COLUMN IF NOT EXISTS taux_agent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS taux_ayant_droit numeric DEFAULT 0;

-- Ajouter les colonnes taux_agent et taux_ayant_droit à la table clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS taux_agent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS taux_ayant_droit numeric DEFAULT 0;

-- Mettre à jour le trigger create_client_for_personnel pour inclure les nouveaux champs
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    INSERT INTO public.clients (
      tenant_id,
      type_client,
      personnel_id,
      nom_complet,
      telephone,
      adresse,
      taux_remise_automatique,
      limite_credit,
      assureur_id,
      peut_prendre_bon,
      taux_agent,
      taux_ayant_droit
    ) VALUES (
      NEW.tenant_id,
      'personnel'::type_client_enum,
      NEW.id,
      CONCAT(NEW.prenoms, ' ', NEW.noms),
      NEW.telephone_appel,
      NEW.adresse,
      COALESCE(NEW.taux_remise_automatique, 0),
      COALESCE(NEW.limite_dette, 0),
      NEW.assureur_id,
      COALESCE(NEW.peut_prendre_bon, true),
      COALESCE(NEW.taux_agent, 0),
      COALESCE(NEW.taux_ayant_droit, 0)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la création du client pour le personnel %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Mettre à jour le trigger update_client_for_personnel pour inclure les nouveaux champs
CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.clients 
  SET 
    nom_complet = CONCAT(NEW.prenoms, ' ', NEW.noms),
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    limite_credit = COALESCE(NEW.limite_dette, 0),
    assureur_id = NEW.assureur_id,
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, true),
    taux_agent = COALESCE(NEW.taux_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_ayant_droit, 0),
    updated_at = now()
  WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$function$;
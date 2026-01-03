-- Ajout des colonnes manquantes à la table conventionnes
ALTER TABLE public.conventionnes 
ADD COLUMN IF NOT EXISTS taux_couverture_agent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS taux_couverture_ayant_droit numeric DEFAULT 0;

-- Correction du trigger de création de client pour les conventionnés
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
    limite_credit,
    taux_remise_automatique,
    taux_agent,
    taux_ayant_droit,
    peut_prendre_bon
  ) VALUES (
    NEW.tenant_id,
    'conventionne'::type_client_enum,
    NEW.id,
    NEW.noms,
    NEW.telephone_appel,
    NEW.adresse,
    COALESCE(NEW.limite_dette, 0),
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.taux_couverture_agent, 0),
    COALESCE(NEW.taux_couverture_ayant_droit, 0),
    COALESCE(NEW.peut_prendre_bon, true)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la création du client pour le conventionné %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Correction du trigger de mise à jour de client pour les conventionnés
CREATE OR REPLACE FUNCTION public.update_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.clients
  SET
    nom_complet = NEW.noms,
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    limite_credit = COALESCE(NEW.limite_dette, 0),
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    taux_agent = COALESCE(NEW.taux_couverture_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_couverture_ayant_droit, 0),
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, true),
    updated_at = now()
  WHERE conventionne_id = NEW.id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la mise à jour du client pour le conventionné %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;
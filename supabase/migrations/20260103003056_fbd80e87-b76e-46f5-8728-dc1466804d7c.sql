-- Corriger create_client_for_societe avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    societe_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique,
    limite_dette,
    assureur_id,
    peut_prendre_bon,
    taux_agent,
    taux_ayant_droit
  ) VALUES (
    NEW.tenant_id,
    'Entreprise'::public.type_client_enum,
    NEW.id,
    NEW.libelle_societe,
    NEW.telephone_appel,
    NEW.adresse,
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.limite_dette, 0),
    NEW.assureur_id,
    COALESCE(NEW.peut_prendre_bon, true),
    COALESCE(NEW.taux_couverture_agent, 0),
    COALESCE(NEW.taux_couverture_ayant_droit, 0)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur création client société %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Corriger update_client_for_societe avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION public.update_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.clients 
  SET 
    nom_complet = NEW.libelle_societe,
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    limite_dette = COALESCE(NEW.limite_dette, 0),
    assureur_id = NEW.assureur_id,
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, true),
    taux_agent = COALESCE(NEW.taux_couverture_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_couverture_ayant_droit, 0),
    updated_at = now()
  WHERE societe_id = NEW.id AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$function$;
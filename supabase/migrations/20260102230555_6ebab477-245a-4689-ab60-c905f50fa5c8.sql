-- Corriger le trigger update_client_for_personnel pour utiliser limite_credit au lieu de limite_dette
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
    updated_at = now()
  WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$function$;

-- Corriger le trigger update_client_for_societe pour utiliser limite_credit au lieu de limite_dette
CREATE OR REPLACE FUNCTION public.update_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.clients 
  SET 
    nom_complet = NEW.nom,
    telephone = NEW.telephone,
    adresse = NEW.adresse,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    limite_credit = COALESCE(NEW.limite_dette, 0),
    assureur_id = NEW.assureur_id,
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, true),
    updated_at = now()
  WHERE societe_id = NEW.id AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$function$;

-- Corriger le trigger update_client_for_conventionne pour utiliser limite_credit au lieu de limite_dette
CREATE OR REPLACE FUNCTION public.update_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.clients 
  SET 
    nom_complet = NEW.nom_complet,
    telephone = NEW.telephone,
    adresse = NEW.adresse,
    assureur_id = NEW.assureur_id,
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, true),
    updated_at = now()
  WHERE conventionne_id = NEW.id AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$function$;
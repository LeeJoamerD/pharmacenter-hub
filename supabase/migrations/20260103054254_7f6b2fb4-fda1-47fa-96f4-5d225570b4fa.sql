-- =====================================================
-- Migration: Synchronisation des "Infos Compte Client"
-- Copie les informations depuis societes, personnel, conventionnes vers clients
-- =====================================================

-- PARTIE 1: Synchroniser les données existantes

-- 1.1 Synchroniser les clients Entreprise depuis societes
UPDATE public.clients c
SET 
  assureur_id = s.assureur_id,
  taux_remise_automatique = COALESCE(s.taux_remise_automatique, 0),
  taux_agent = COALESCE(s.taux_couverture_agent, 0),
  taux_ayant_droit = COALESCE(s.taux_couverture_ayant_droit, 0),
  limite_credit = COALESCE(s.limite_dette, 0),
  peut_prendre_bon = COALESCE(s.peut_prendre_bon, false),
  taux_ticket_moderateur = COALESCE(s.taux_ticket_moderateur, 0),
  caution = COALESCE(s.caution, 0)
FROM public.societes s
WHERE c.societe_id = s.id
  AND c.type_client = 'Entreprise';

-- 1.2 Synchroniser les clients Personnel depuis personnel
UPDATE public.clients c
SET 
  assureur_id = p.assureur_id,
  taux_remise_automatique = COALESCE(p.taux_remise_automatique, 0),
  taux_agent = COALESCE(p.taux_agent, 0),
  taux_ayant_droit = COALESCE(p.taux_ayant_droit, 0),
  limite_credit = COALESCE(p.limite_dette, 0),
  peut_prendre_bon = COALESCE(p.peut_prendre_bon, false),
  taux_ticket_moderateur = COALESCE(p.taux_ticket_moderateur, 0),
  caution = COALESCE(p.caution, 0)
FROM public.personnel p
WHERE c.personnel_id = p.id
  AND c.type_client = 'Personnel';

-- 1.3 Synchroniser les clients Conventionné depuis conventionnes
UPDATE public.clients c
SET 
  assureur_id = cv.assureur_id,
  taux_remise_automatique = COALESCE(cv.taux_remise_automatique, 0),
  taux_agent = COALESCE(cv.taux_couverture_agent, 0),
  taux_ayant_droit = COALESCE(cv.taux_couverture_ayant_droit, 0),
  limite_credit = COALESCE(cv.limite_dette, 0),
  peut_prendre_bon = COALESCE(cv.peut_prendre_bon, false),
  taux_ticket_moderateur = COALESCE(cv.taux_ticket_moderateur, 0),
  caution = COALESCE(cv.caution, 0)
FROM public.conventionnes cv
WHERE c.conventionne_id = cv.id
  AND c.type_client = 'Conventionné';

-- PARTIE 2: Mettre à jour les triggers de CRÉATION

-- 2.1 Trigger pour création client depuis societe
CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    societe_id,
    nom_complet,
    telephone,
    adresse,
    -- Infos Compte Client
    assureur_id,
    taux_remise_automatique,
    taux_agent,
    taux_ayant_droit,
    limite_credit,
    peut_prendre_bon,
    taux_ticket_moderateur,
    caution
  ) VALUES (
    NEW.tenant_id,
    'Entreprise'::type_client_enum,
    NEW.id,
    NEW.nom,
    NEW.telephone,
    NEW.adresse,
    -- Infos Compte Client depuis societe
    NEW.assureur_id,
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.taux_couverture_agent, 0),
    COALESCE(NEW.taux_couverture_ayant_droit, 0),
    COALESCE(NEW.limite_dette, 0),
    COALESCE(NEW.peut_prendre_bon, false),
    COALESCE(NEW.taux_ticket_moderateur, 0),
    COALESCE(NEW.caution, 0)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur création client pour société %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2.2 Trigger pour création client depuis personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Créer un client uniquement pour les employés (pas pour les utilisateurs système)
  IF NEW.auth_user_id IS NULL THEN
    INSERT INTO public.clients (
      tenant_id,
      type_client,
      personnel_id,
      nom_complet,
      telephone,
      adresse,
      -- Infos Compte Client
      assureur_id,
      taux_remise_automatique,
      taux_agent,
      taux_ayant_droit,
      limite_credit,
      peut_prendre_bon,
      taux_ticket_moderateur,
      caution
    ) VALUES (
      NEW.tenant_id,
      'Personnel'::type_client_enum,
      NEW.id,
      CONCAT(NEW.prenoms, ' ', NEW.noms),
      NEW.telephone_appel,
      NEW.adresse,
      -- Infos Compte Client depuis personnel
      NEW.assureur_id,
      COALESCE(NEW.taux_remise_automatique, 0),
      COALESCE(NEW.taux_agent, 0),
      COALESCE(NEW.taux_ayant_droit, 0),
      COALESCE(NEW.limite_dette, 0),
      COALESCE(NEW.peut_prendre_bon, false),
      COALESCE(NEW.taux_ticket_moderateur, 0),
      COALESCE(NEW.caution, 0)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur création client pour personnel %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2.3 Trigger pour création client depuis conventionne
CREATE OR REPLACE FUNCTION public.create_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    conventionne_id,
    nom_complet,
    telephone,
    adresse,
    -- Infos Compte Client
    assureur_id,
    taux_remise_automatique,
    taux_agent,
    taux_ayant_droit,
    limite_credit,
    peut_prendre_bon,
    taux_ticket_moderateur,
    caution
  ) VALUES (
    NEW.tenant_id,
    'Conventionné'::type_client_enum,
    NEW.id,
    NEW.nom_complet,
    NEW.telephone,
    NEW.adresse,
    -- Infos Compte Client depuis conventionne
    NEW.assureur_id,
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.taux_couverture_agent, 0),
    COALESCE(NEW.taux_couverture_ayant_droit, 0),
    COALESCE(NEW.limite_dette, 0),
    COALESCE(NEW.peut_prendre_bon, false),
    COALESCE(NEW.taux_ticket_moderateur, 0),
    COALESCE(NEW.caution, 0)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur création client pour conventionné %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS trigger_create_client_for_conventionne ON public.conventionnes;
CREATE TRIGGER trigger_create_client_for_conventionne
  AFTER INSERT ON public.conventionnes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_conventionne();

-- PARTIE 3: Créer les triggers de MISE À JOUR

-- 3.1 Trigger pour synchroniser client quand societe est modifiée
CREATE OR REPLACE FUNCTION public.sync_client_from_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.clients
  SET 
    nom_complet = NEW.nom,
    telephone = NEW.telephone,
    adresse = NEW.adresse,
    -- Sync Infos Compte Client
    assureur_id = NEW.assureur_id,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    taux_agent = COALESCE(NEW.taux_couverture_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_couverture_ayant_droit, 0),
    limite_credit = COALESCE(NEW.limite_dette, 0),
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, false),
    taux_ticket_moderateur = COALESCE(NEW.taux_ticket_moderateur, 0),
    caution = COALESCE(NEW.caution, 0)
  WHERE societe_id = NEW.id
    AND type_client = 'Entreprise';
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_sync_client_from_societe ON public.societes;
CREATE TRIGGER trigger_sync_client_from_societe
  AFTER UPDATE ON public.societes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_from_societe();

-- 3.2 Trigger pour synchroniser client quand personnel est modifié
CREATE OR REPLACE FUNCTION public.sync_client_from_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.clients
  SET 
    nom_complet = CONCAT(NEW.prenoms, ' ', NEW.noms),
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    -- Sync Infos Compte Client
    assureur_id = NEW.assureur_id,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    taux_agent = COALESCE(NEW.taux_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_ayant_droit, 0),
    limite_credit = COALESCE(NEW.limite_dette, 0),
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, false),
    taux_ticket_moderateur = COALESCE(NEW.taux_ticket_moderateur, 0),
    caution = COALESCE(NEW.caution, 0)
  WHERE personnel_id = NEW.id
    AND type_client = 'Personnel';
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_sync_client_from_personnel ON public.personnel;
CREATE TRIGGER trigger_sync_client_from_personnel
  AFTER UPDATE ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_from_personnel();

-- 3.3 Trigger pour synchroniser client quand conventionne est modifié
CREATE OR REPLACE FUNCTION public.sync_client_from_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.clients
  SET 
    nom_complet = NEW.nom_complet,
    telephone = NEW.telephone,
    adresse = NEW.adresse,
    -- Sync Infos Compte Client
    assureur_id = NEW.assureur_id,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    taux_agent = COALESCE(NEW.taux_couverture_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_couverture_ayant_droit, 0),
    limite_credit = COALESCE(NEW.limite_dette, 0),
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, false),
    taux_ticket_moderateur = COALESCE(NEW.taux_ticket_moderateur, 0),
    caution = COALESCE(NEW.caution, 0)
  WHERE conventionne_id = NEW.id
    AND type_client = 'Conventionné';
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_sync_client_from_conventionne ON public.conventionnes;
CREATE TRIGGER trigger_sync_client_from_conventionne
  AFTER UPDATE ON public.conventionnes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_from_conventionne();
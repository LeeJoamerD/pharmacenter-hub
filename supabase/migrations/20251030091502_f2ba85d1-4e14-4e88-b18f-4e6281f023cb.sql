-- PHASE 1: Ajouter la colonne personnel_id à la table clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS personnel_id UUID;

ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_personnel_id_fkey;

ALTER TABLE public.clients
ADD CONSTRAINT clients_personnel_id_fkey
FOREIGN KEY (personnel_id) 
REFERENCES public.personnel(id) 
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_personnel_id 
ON public.clients(personnel_id);

-- PHASE 2: Créer les fonctions et triggers pour Personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
      taux_remise_automatique
    ) VALUES (
      NEW.tenant_id,
      'Personnel',
      NEW.id,
      CONCAT(NEW.prenoms, ' ', NEW.noms),
      NEW.telephone_appel,
      NEW.adresse,
      0.00
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur création client pour personnel %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.clients SET
    nom_complet = CONCAT(NEW.prenoms, ' ', NEW.noms),
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    updated_at = now()
  WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.clients 
  WHERE personnel_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_create_client_for_personnel ON public.personnel;
CREATE TRIGGER trigger_create_client_for_personnel
  AFTER INSERT ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_personnel();

DROP TRIGGER IF EXISTS trigger_update_client_for_personnel ON public.personnel;
CREATE TRIGGER trigger_update_client_for_personnel
  AFTER UPDATE ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_for_personnel();

DROP TRIGGER IF EXISTS trigger_delete_client_for_personnel ON public.personnel;
CREATE TRIGGER trigger_delete_client_for_personnel
  AFTER DELETE ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_client_for_personnel();

-- PHASE 3: Créer les triggers pour Sociétés
DROP TRIGGER IF EXISTS trigger_create_client_for_societe ON public.societes;
CREATE TRIGGER trigger_create_client_for_societe
  AFTER INSERT ON public.societes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_societe();

CREATE OR REPLACE FUNCTION public.update_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.clients SET
    nom_complet = NEW.libelle_societe,
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    updated_at = now()
  WHERE societe_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_client_for_societe ON public.societes;
CREATE TRIGGER trigger_update_client_for_societe
  AFTER UPDATE ON public.societes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_for_societe();

CREATE OR REPLACE FUNCTION public.delete_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.clients 
  WHERE societe_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_delete_client_for_societe ON public.societes;
CREATE TRIGGER trigger_delete_client_for_societe
  AFTER DELETE ON public.societes
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_client_for_societe();

-- PHASE 4: Créer les triggers pour Conventionnés
DROP TRIGGER IF EXISTS trigger_create_client_for_conventionne ON public.conventionnes;
CREATE TRIGGER trigger_create_client_for_conventionne
  AFTER INSERT ON public.conventionnes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_conventionne();

CREATE OR REPLACE FUNCTION public.update_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.clients SET
    nom_complet = NEW.noms,
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    limite_credit = COALESCE(NEW.limite_dette, 0),
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    updated_at = now()
  WHERE conventionne_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_client_for_conventionne ON public.conventionnes;
CREATE TRIGGER trigger_update_client_for_conventionne
  AFTER UPDATE ON public.conventionnes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_for_conventionne();

CREATE OR REPLACE FUNCTION public.delete_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.clients 
  WHERE conventionne_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_delete_client_for_conventionne ON public.conventionnes;
CREATE TRIGGER trigger_delete_client_for_conventionne
  AFTER DELETE ON public.conventionnes
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_client_for_conventionne();

-- PHASE 5: Migration des données existantes
INSERT INTO public.clients (
  tenant_id,
  type_client,
  personnel_id,
  nom_complet,
  telephone,
  adresse,
  taux_remise_automatique
)
SELECT 
  p.tenant_id,
  'Personnel',
  p.id,
  CONCAT(p.prenoms, ' ', p.noms),
  p.telephone_appel,
  p.adresse,
  0.00
FROM public.personnel p
WHERE p.auth_user_id IS NULL  
  AND NOT EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.personnel_id = p.id
  );

-- PHASE 6: Audit trail pour les clients
DROP TRIGGER IF EXISTS audit_clients_changes ON public.clients;
CREATE TRIGGER audit_clients_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();
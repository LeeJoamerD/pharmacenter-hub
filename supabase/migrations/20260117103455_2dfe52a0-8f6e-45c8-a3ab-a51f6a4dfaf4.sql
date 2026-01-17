-- Migration: Activer le trigger de création de client pour le personnel et rattrapage des données existantes

-- 1. S'assurer que la fonction existe et est correcte pour la table personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Vérifier que le personnel a un tenant_id valide
  IF NEW.tenant_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier qu'un client n'existe pas déjà pour ce personnel
  IF EXISTS (SELECT 1 FROM public.clients WHERE personnel_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Insérer le client pour ce personnel
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
    'Personnel'::type_client,
    NEW.id,
    CONCAT(COALESCE(NEW.prenoms, ''), ' ', COALESCE(NEW.noms, '')),
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, logger mais ne pas bloquer la création du personnel
  RAISE WARNING 'Erreur lors de la création du client pour le personnel %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2. Supprimer l'ancien trigger s'il existe sur personnel
DROP TRIGGER IF EXISTS trigger_create_client_for_personnel ON public.personnel;

-- 3. Créer le trigger sur la table personnel
CREATE TRIGGER trigger_create_client_for_personnel
  AFTER INSERT ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_personnel();

-- 4. Script de rattrapage : Créer les clients pour tous les personnels existants qui n'en ont pas
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
  'Personnel'::type_client,
  p.id,
  CONCAT(COALESCE(p.prenoms, ''), ' ', COALESCE(p.noms, '')),
  p.telephone_appel,
  p.adresse,
  0.00
FROM public.personnel p
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients c WHERE c.personnel_id = p.id
)
AND p.tenant_id IS NOT NULL;
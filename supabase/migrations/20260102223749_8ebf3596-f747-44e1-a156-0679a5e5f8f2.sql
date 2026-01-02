-- =====================================================
-- MIGRATION: Nettoyage gestion des clients
-- =====================================================

-- =====================================================
-- PHASE 1: Ajouter les colonnes manquantes
-- =====================================================

-- Table clients: ajouter assureur_id et peut_prendre_bon
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS assureur_id uuid REFERENCES public.assureurs(id) ON DELETE SET NULL;

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS peut_prendre_bon boolean DEFAULT true;

-- Table personnel: ajouter les colonnes compte client
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS assureur_id uuid REFERENCES public.assureurs(id) ON DELETE SET NULL;

ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS taux_remise_automatique numeric DEFAULT 0;

ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS peut_prendre_bon boolean DEFAULT true;

-- Table conventionnes: ajouter assureur_id et peut_prendre_bon
ALTER TABLE public.conventionnes 
ADD COLUMN IF NOT EXISTS assureur_id uuid REFERENCES public.assureurs(id) ON DELETE SET NULL;

ALTER TABLE public.conventionnes 
ADD COLUMN IF NOT EXISTS peut_prendre_bon boolean DEFAULT true;

-- Table societes: ajouter taux_remise et peut_prendre_bon, rendre assureur optionnel
ALTER TABLE public.societes 
ADD COLUMN IF NOT EXISTS taux_remise_automatique numeric DEFAULT 0;

ALTER TABLE public.societes 
ADD COLUMN IF NOT EXISTS peut_prendre_bon boolean DEFAULT true;

-- Rendre assureur_id optionnel dans societes (était NOT NULL)
ALTER TABLE public.societes 
ALTER COLUMN assureur_id DROP NOT NULL;

-- =====================================================
-- PHASE 2: Supprimer le type "Assuré" de l'enum
-- =====================================================

-- D'abord migrer les clients existants de type 'Assuré' vers 'Entreprise'
UPDATE public.clients SET type_client = 'Entreprise' WHERE type_client = 'Assuré';

-- Supprimer la valeur par défaut avant de changer le type
ALTER TABLE public.clients 
ALTER COLUMN type_client DROP DEFAULT;

-- Recréer l'enum sans 'Assuré'
-- 1. Créer le nouvel enum
CREATE TYPE type_client_new AS ENUM ('Ordinaire', 'Conventionné', 'Entreprise', 'Personnel');

-- 2. Changer le type de la colonne
ALTER TABLE public.clients 
ALTER COLUMN type_client TYPE type_client_new 
USING type_client::text::type_client_new;

-- 3. Supprimer l'ancien enum et renommer le nouveau
DROP TYPE type_client;
ALTER TYPE type_client_new RENAME TO type_client;

-- 4. Remettre la valeur par défaut (Conventionné au lieu de Ordinaire)
ALTER TABLE public.clients 
ALTER COLUMN type_client SET DEFAULT 'Conventionné'::type_client;

-- =====================================================
-- PHASE 3: Corriger et mettre à jour les triggers
-- =====================================================

-- Trigger pour création de client depuis personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
      taux_remise_automatique,
      limite_dette,
      assureur_id,
      peut_prendre_bon
    ) VALUES (
      NEW.tenant_id,
      'Personnel'::public.type_client,
      NEW.id,
      CONCAT(NEW.prenoms, ' ', NEW.noms),
      NEW.telephone_appel,
      NEW.adresse,
      COALESCE(NEW.taux_remise_automatique, 0),
      COALESCE(NEW.limite_dette, 0),
      NEW.assureur_id,
      COALESCE(NEW.peut_prendre_bon, true)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la création du client pour le personnel %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Trigger pour mise à jour de client depuis personnel
CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.clients 
  SET 
    nom_complet = CONCAT(NEW.prenoms, ' ', NEW.noms),
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    limite_dette = COALESCE(NEW.limite_dette, 0),
    assureur_id = NEW.assureur_id,
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, true),
    updated_at = now()
  WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$function$;

-- Créer le trigger update si inexistant
DROP TRIGGER IF EXISTS trigger_update_client_for_personnel ON public.personnel;
CREATE TRIGGER trigger_update_client_for_personnel
  AFTER UPDATE ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_for_personnel();

-- Trigger pour création de client depuis societe
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
    peut_prendre_bon
  ) VALUES (
    NEW.tenant_id,
    'Entreprise'::public.type_client,
    NEW.id,
    NEW.nom,
    NEW.telephone,
    NEW.adresse,
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.limite_dette, 0),
    NEW.assureur_id,
    COALESCE(NEW.peut_prendre_bon, true)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la création du client pour la société %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Trigger pour mise à jour de client depuis societe
CREATE OR REPLACE FUNCTION public.update_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.clients 
  SET 
    nom_complet = NEW.nom,
    telephone = NEW.telephone,
    adresse = NEW.adresse,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    limite_dette = COALESCE(NEW.limite_dette, 0),
    assureur_id = NEW.assureur_id,
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, true),
    updated_at = now()
  WHERE societe_id = NEW.id AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$function$;

-- Créer le trigger update si inexistant
DROP TRIGGER IF EXISTS trigger_update_client_for_societe ON public.societes;
CREATE TRIGGER trigger_update_client_for_societe
  AFTER UPDATE ON public.societes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_for_societe();

-- Trigger pour création de client depuis conventionne
CREATE OR REPLACE FUNCTION public.create_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    conventionne_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique,
    limite_dette,
    assureur_id,
    peut_prendre_bon
  ) VALUES (
    NEW.tenant_id,
    'Conventionné'::public.type_client,
    NEW.id,
    NEW.nom_complet,
    NEW.telephone,
    NEW.adresse,
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.limite_dette, 0),
    NEW.assureur_id,
    COALESCE(NEW.peut_prendre_bon, true)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la création du client pour le conventionné %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Trigger pour mise à jour de client depuis conventionne
CREATE OR REPLACE FUNCTION public.update_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.clients 
  SET 
    nom_complet = NEW.nom_complet,
    telephone = NEW.telephone,
    adresse = NEW.adresse,
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    limite_dette = COALESCE(NEW.limite_dette, 0),
    assureur_id = NEW.assureur_id,
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, true),
    updated_at = now()
  WHERE conventionne_id = NEW.id AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$function$;

-- Créer le trigger update si inexistant
DROP TRIGGER IF EXISTS trigger_update_client_for_conventionne ON public.conventionnes;
CREATE TRIGGER trigger_update_client_for_conventionne
  AFTER UPDATE ON public.conventionnes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_for_conventionne();
-- CONSOLIDATION DES ENUMS TYPE_CLIENT
-- Objectif: Un seul enum avec 5 valeurs (Ordinaire, Assuré, Conventionné, Entreprise, Personnel)

-- PHASE 1: Supprimer la valeur par défaut existante
ALTER TABLE clients ALTER COLUMN type_client DROP DEFAULT;

-- PHASE 2: Créer le nouvel enum avec les 5 valeurs finales
CREATE TYPE type_client_new AS ENUM (
  'Ordinaire',
  'Assuré', 
  'Conventionné',
  'Entreprise',
  'Personnel'
);

-- PHASE 3: Migrer la colonne avec conversion des anciennes valeurs
ALTER TABLE clients 
  ALTER COLUMN type_client TYPE type_client_new 
  USING (
    CASE type_client::text
      WHEN 'Particulier' THEN 'Ordinaire'
      WHEN 'Assureur' THEN 'Entreprise'
      WHEN 'Société' THEN 'Entreprise'
      WHEN 'Ordinaire' THEN 'Ordinaire'
      WHEN 'Assuré' THEN 'Assuré'
      WHEN 'Conventionné' THEN 'Conventionné'
      WHEN 'Personnel' THEN 'Personnel'
      ELSE 'Ordinaire'
    END
  )::type_client_new;

-- PHASE 4: Supprimer les anciens enums
DROP TYPE IF EXISTS type_client CASCADE;
DROP TYPE IF EXISTS type_client_enum CASCADE;

-- PHASE 5: Renommer le nouvel enum
ALTER TYPE type_client_new RENAME TO type_client;

-- PHASE 6: Remettre la valeur par défaut
ALTER TABLE clients 
  ALTER COLUMN type_client SET DEFAULT 'Ordinaire'::type_client;

-- PHASE 7: Mise à jour des fonctions trigger

-- 1. Fonction create_client_for_personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ne créer un client que si auth_user_id est NULL (non lié à un compte)
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
      'Personnel'::type_client,
      NEW.id,
      NEW.noms || ' ' || NEW.prenoms,
      NEW.telephone_appel,
      NEW.adresse,
      0.00
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Fonction create_client_for_conventionne
CREATE OR REPLACE FUNCTION public.create_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Conventionné'::type_client,
    NEW.id,
    NEW.noms,
    NEW.telephone_appel,
    NEW.adresse,
    COALESCE(NEW.limite_dette, 0),
    COALESCE(NEW.taux_remise_automatique, 0)
  );
  RETURN NEW;
END;
$function$;

-- 3. Fonction create_client_for_societe (changé de "Assuré" à "Entreprise")
CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    societe_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Entreprise'::type_client,
    NEW.id,
    NEW.libelle_societe,
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  RETURN NEW;
END;
$function$;

-- 4. Fonction update_client_for_personnel
CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
$function$;

-- 5. Fonction update_client_for_conventionne
CREATE OR REPLACE FUNCTION public.update_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 6. Fonction update_client_for_societe
CREATE OR REPLACE FUNCTION public.update_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 7. Fonction delete_client_for_personnel
CREATE OR REPLACE FUNCTION public.delete_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.clients 
  WHERE personnel_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$function$;

-- 8. Fonction delete_client_for_conventionne
CREATE OR REPLACE FUNCTION public.delete_client_for_conventionne()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.clients 
  WHERE conventionne_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$function$;

-- 9. Fonction delete_client_for_societe
CREATE OR REPLACE FUNCTION public.delete_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.clients 
  WHERE societe_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$function$;
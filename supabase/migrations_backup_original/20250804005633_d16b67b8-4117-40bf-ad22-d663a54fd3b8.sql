-- Correction de l'enum type_client_enum pour les triggers
-- S'assurer que l'enum est correctement accessible dans toutes les fonctions

-- Recréer les fonctions avec le bon schéma
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
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
    'Personnel'::public.type_client_enum,
    NEW.id,
    NEW.noms || ' ' || NEW.prenoms,
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
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
    nom_complet = NEW.noms || ' ' || NEW.prenoms,
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
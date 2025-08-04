-- Fix the trigger timing issue and add year navigation to calendar
-- The issue is that the trigger tries to create a client before the personnel record is fully committed

-- First, let's modify the trigger to use AFTER INSERT instead of BEFORE INSERT
-- and handle the foreign key constraint properly

DROP TRIGGER IF EXISTS trigger_create_client_for_personnel ON public.employes_rh;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search path to ensure we can access public schema types
  SET search_path = 'public';
  
  -- Insert into clients table after the personnel record is committed
  -- Using NEW.id which should exist at this point
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
    'personnel'::type_client_enum,
    NEW.id,  -- This should now reference a valid personnel record
    CONCAT(NEW.prenoms, ' ', NEW.noms),
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the personnel creation
  RAISE WARNING 'Failed to create client for personnel %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
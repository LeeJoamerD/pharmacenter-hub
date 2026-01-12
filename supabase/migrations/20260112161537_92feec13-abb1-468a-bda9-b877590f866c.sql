-- Corriger la fonction RPC pour utiliser telephone_appel au lieu de phone
CREATE OR REPLACE FUNCTION public.get_pharmacy_phone_by_email(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_phone TEXT;
BEGIN
  SELECT telephone_appel INTO v_phone
  FROM public.pharmacies
  WHERE email = p_email
  LIMIT 1;
  
  RETURN v_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Supprimer la colonne phone inutilisée de la table pharmacies
ALTER TABLE public.pharmacies DROP COLUMN IF EXISTS phone;
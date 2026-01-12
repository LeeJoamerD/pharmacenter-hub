-- Correction de la fonction get_pharmacy_phone_by_email
-- La colonne s'appelle "phone" et non "telephone" dans la table pharmacies

CREATE OR REPLACE FUNCTION public.get_pharmacy_phone_by_email(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_phone TEXT;
BEGIN
  SELECT phone INTO v_phone
  FROM public.pharmacies
  WHERE email = p_email
  LIMIT 1;
  
  RETURN v_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
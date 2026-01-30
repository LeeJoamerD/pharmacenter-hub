-- RPC pour récupérer l'ID de la pharmacie par email (sécurisé)
CREATE OR REPLACE FUNCTION public.get_pharmacy_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT id FROM pharmacies 
    WHERE lower(email) = lower(p_email) 
    LIMIT 1
  );
END;
$$;

-- Donner accès à la fonction pour les utilisateurs anonymes (nécessaire pour le reset)
GRANT EXECUTE ON FUNCTION public.get_pharmacy_id_by_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_pharmacy_id_by_email(TEXT) TO authenticated;
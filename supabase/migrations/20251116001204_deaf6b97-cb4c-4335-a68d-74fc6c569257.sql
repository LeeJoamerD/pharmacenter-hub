-- Fonction pour générer un numéro de facture POS de manière atomique
CREATE OR REPLACE FUNCTION public.generate_pos_invoice_number(
  p_tenant_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_prefix TEXT;
  v_sequence INTEGER;
  v_numero TEXT;
  v_lock_key BIGINT;
  v_start_of_day TIMESTAMPTZ;
  v_end_of_day TIMESTAMPTZ;
BEGIN
  -- 1. Calculer le préfixe de date (YYYYMMDD)
  v_date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- 2. Calculer les bornes de la journée
  v_start_of_day := DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
  v_end_of_day := v_start_of_day + INTERVAL '1 day' - INTERVAL '1 microsecond';
  
  -- 3. Créer une clé de verrou unique basée sur tenant_id et date
  -- Utiliser hashtext pour convertir en entier
  v_lock_key := hashtext(p_tenant_id::TEXT || v_date_prefix);
  
  -- 4. Acquérir un verrou advisory (bloque jusqu'à obtention)
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- 5. Trouver le prochain numéro de séquence pour ce tenant et cette date
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(numero_vente FROM 'POS-\d{8}-(\d{4})') AS INTEGER
      )
    ),
    0
  ) + 1
  INTO v_sequence
  FROM public.ventes
  WHERE tenant_id = p_tenant_id
    AND date_vente >= v_start_of_day
    AND date_vente <= v_end_of_day
    AND numero_vente LIKE 'POS-' || v_date_prefix || '-%';
  
  -- 6. Formater le numéro final
  v_numero := 'POS-' || v_date_prefix || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  -- 7. Le verrou sera automatiquement libéré à la fin de la transaction
  RETURN v_numero;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.generate_pos_invoice_number(UUID) TO authenticated;

-- Commentaire
COMMENT ON FUNCTION public.generate_pos_invoice_number IS 
  'Génère un numéro de facture POS unique et séquentiel pour un tenant donné. Utilise un advisory lock pour éviter les race conditions.';
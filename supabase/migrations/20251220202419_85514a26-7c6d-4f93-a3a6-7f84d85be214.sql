-- Corriger la fonction generate_piece_number pour utiliser journaux_comptables
CREATE OR REPLACE FUNCTION public.generate_piece_number(
  p_journal_id UUID,
  p_date_piece DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journal RECORD;
  v_prefixe TEXT;
  v_sequence INTEGER;
  v_annee TEXT;
  v_mois TEXT;
  v_numero_piece TEXT;
BEGIN
  -- Récupérer le journal depuis journaux_comptables (table unifiée)
  SELECT * INTO v_journal
  FROM public.journaux_comptables
  WHERE id = p_journal_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Journal non trouvé';
  END IF;
  
  -- Utiliser le préfixe du journal ou le code par défaut
  v_prefixe := COALESCE(v_journal.prefixe, v_journal.code_journal);
  
  -- Récupérer la séquence courante
  v_sequence := COALESCE(v_journal.sequence_courante, 1);
  
  -- Extraire l'année et le mois
  v_annee := TO_CHAR(p_date_piece, 'YYYY');
  v_mois := TO_CHAR(p_date_piece, 'MM');
  
  -- Générer le numéro de pièce: PREFIXE-YYYYMM-SEQUENCE
  v_numero_piece := v_prefixe || '-' || v_annee || v_mois || '-' || LPAD(v_sequence::TEXT, 5, '0');
  
  -- Incrémenter la séquence dans journaux_comptables
  UPDATE public.journaux_comptables
  SET sequence_courante = v_sequence + 1
  WHERE id = p_journal_id;
  
  RETURN v_numero_piece;
END;
$$;
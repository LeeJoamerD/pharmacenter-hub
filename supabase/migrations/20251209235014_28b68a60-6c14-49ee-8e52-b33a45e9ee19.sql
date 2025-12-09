-- Drop existing function first, then recreate with fixes
DROP FUNCTION IF EXISTS public.generate_accounting_entry(UUID, TEXT, DATE, TEXT, TEXT, UUID, JSONB);

-- Create improved version with correct field names and optional exercise
CREATE OR REPLACE FUNCTION public.generate_accounting_entry(
  p_tenant_id UUID,
  p_journal_code TEXT,
  p_date_ecriture DATE,
  p_libelle TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_lines JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ecriture_id UUID;
  v_exercice_id UUID;
  v_journal_id UUID;
  v_numero_piece TEXT;
  v_line JSONB;
  v_total_debit NUMERIC := 0;
  v_total_credit NUMERIC := 0;
  v_compte_id UUID;
  v_ligne_numero INT := 1;
BEGIN
  -- Get tenant's open exercise (optional - allow NULL)
  SELECT id INTO v_exercice_id
  FROM exercices_comptables
  WHERE tenant_id = p_tenant_id
    AND statut = 'ouvert'
  ORDER BY date_debut DESC
  LIMIT 1;

  -- Get journal ID
  SELECT id INTO v_journal_id
  FROM accounting_journals
  WHERE tenant_id = p_tenant_id
    AND code = p_journal_code
    AND is_active = true
  LIMIT 1;

  -- If no journal found, try to create a default one
  IF v_journal_id IS NULL THEN
    INSERT INTO accounting_journals (tenant_id, code, name, type, is_active)
    VALUES (p_tenant_id, p_journal_code, 
      CASE p_journal_code 
        WHEN 'VT' THEN 'Journal des Ventes'
        WHEN 'AC' THEN 'Journal des Achats'
        WHEN 'TR' THEN 'Journal de Trésorerie'
        WHEN 'OD' THEN 'Journal des Opérations Diverses'
        ELSE 'Journal ' || p_journal_code
      END,
      CASE p_journal_code 
        WHEN 'VT' THEN 'ventes'
        WHEN 'AC' THEN 'achats'
        WHEN 'TR' THEN 'tresorerie'
        ELSE 'operations_diverses'
      END,
      true
    )
    RETURNING id INTO v_journal_id;
  END IF;

  -- Generate piece number
  v_numero_piece := p_journal_code || '-' || TO_CHAR(p_date_ecriture, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Validate lines and calculate totals
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::NUMERIC, 0);
    v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::NUMERIC, 0);
  END LOOP;

  -- Check balance (allow small rounding differences)
  IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Écriture déséquilibrée: Débit=%s, Crédit=%s', v_total_debit, v_total_credit)
    );
  END IF;

  -- Create the accounting entry
  INSERT INTO ecritures_comptables (
    tenant_id,
    exercice_id,
    journal_id,
    numero_piece,
    date_ecriture,
    libelle,
    statut,
    is_auto_generated,
    reference_type,
    reference_id,
    total_debit,
    total_credit
  ) VALUES (
    p_tenant_id,
    v_exercice_id,  -- Can be NULL if no open exercise
    v_journal_id,
    v_numero_piece,
    p_date_ecriture,
    p_libelle,
    'validee',
    true,
    p_reference_type,
    p_reference_id,
    v_total_debit,
    v_total_credit
  )
  RETURNING id INTO v_ecriture_id;

  -- Create entry lines
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    -- Get or create the account (support both field naming conventions)
    SELECT id INTO v_compte_id
    FROM comptes_comptables
    WHERE tenant_id = p_tenant_id
      AND numero = COALESCE(v_line->>'numero_compte', v_line->>'compte_numero')
    LIMIT 1;

    -- Create account if it doesn't exist
    IF v_compte_id IS NULL THEN
      INSERT INTO comptes_comptables (
        tenant_id,
        numero,
        libelle,
        type,
        classe,
        is_active
      ) VALUES (
        p_tenant_id,
        COALESCE(v_line->>'numero_compte', v_line->>'compte_numero'),
        COALESCE(v_line->>'libelle_ligne', v_line->>'libelle', 'Compte ' || COALESCE(v_line->>'numero_compte', v_line->>'compte_numero')),
        CASE 
          WHEN COALESCE(v_line->>'numero_compte', v_line->>'compte_numero') LIKE '4%' THEN 'tiers'
          WHEN COALESCE(v_line->>'numero_compte', v_line->>'compte_numero') LIKE '5%' THEN 'tresorerie'
          WHEN COALESCE(v_line->>'numero_compte', v_line->>'compte_numero') LIKE '6%' THEN 'charge'
          WHEN COALESCE(v_line->>'numero_compte', v_line->>'compte_numero') LIKE '7%' THEN 'produit'
          ELSE 'autre'
        END,
        LEFT(COALESCE(v_line->>'numero_compte', v_line->>'compte_numero'), 1)::INT,
        true
      )
      RETURNING id INTO v_compte_id;
    END IF;

    -- Insert the line
    INSERT INTO lignes_ecriture (
      tenant_id,
      ecriture_id,
      compte_id,
      numero_ligne,
      libelle,
      debit,
      credit
    ) VALUES (
      p_tenant_id,
      v_ecriture_id,
      v_compte_id,
      v_ligne_numero,
      COALESCE(v_line->>'libelle_ligne', v_line->>'libelle', p_libelle),
      COALESCE((v_line->>'debit')::NUMERIC, 0),
      COALESCE((v_line->>'credit')::NUMERIC, 0)
    );

    v_ligne_numero := v_ligne_numero + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'ecriture_id', v_ecriture_id,
    'numero_piece', v_numero_piece,
    'exercice_id', v_exercice_id,
    'total_debit', v_total_debit,
    'total_credit', v_total_credit
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.generate_accounting_entry(UUID, TEXT, DATE, TEXT, TEXT, UUID, JSONB) TO authenticated;
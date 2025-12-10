-- Fix case-sensitive comparison for exercice comptable statut
-- The database has 'Ouvert' but the query was looking for 'ouvert'

CREATE OR REPLACE FUNCTION public.generate_accounting_entry(
  p_tenant_id uuid,
  p_journal_code text,
  p_date date,
  p_libelle text,
  p_lines jsonb,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ecriture_id uuid;
  v_journal_id uuid;
  v_exercice_id uuid;
  v_numero text;
  v_total_debit numeric := 0;
  v_total_credit numeric := 0;
  v_line jsonb;
  v_compte_id uuid;
  v_compte_numero text;
  v_libelle_ligne text;
BEGIN
  -- Validate that lines is not null and is an array
  IF p_lines IS NULL OR jsonb_array_length(p_lines) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lines array is required and must not be empty');
  END IF;
  
  -- Calculate totals to validate balance
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::numeric, 0);
    v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::numeric, 0);
  END LOOP;
  
  -- Validate debit = credit
  IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Debit (%s) must equal Credit (%s)', v_total_debit, v_total_credit)
    );
  END IF;
  
  -- Find journal by code
  SELECT id INTO v_journal_id
  FROM accounting_journals
  WHERE tenant_id = p_tenant_id 
    AND code = p_journal_code
    AND is_active = true
  LIMIT 1;
  
  -- If journal not found, try to create a default one
  IF v_journal_id IS NULL THEN
    INSERT INTO accounting_journals (tenant_id, code, name, type, is_active)
    VALUES (p_tenant_id, p_journal_code, 'Journal ' || p_journal_code, 'general', true)
    RETURNING id INTO v_journal_id;
  END IF;
  
  -- Find open accounting exercise for the date (case-insensitive comparison)
  SELECT id INTO v_exercice_id
  FROM exercices_comptables
  WHERE tenant_id = p_tenant_id
    AND p_date BETWEEN date_debut AND date_fin
    AND LOWER(statut) = 'ouvert'
  LIMIT 1;
  
  -- Note: v_exercice_id can be NULL if no open exercise exists - we allow this
  
  -- Generate entry number
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_numero
  FROM ecritures_comptables
  WHERE tenant_id = p_tenant_id;
  
  v_numero := p_journal_code || '-' || LPAD(COALESCE(v_numero, '1'), 6, '0');
  
  -- Create the accounting entry
  INSERT INTO ecritures_comptables (
    tenant_id,
    journal_id,
    exercice_id,
    numero,
    date_ecriture,
    libelle,
    statut,
    is_auto_generated,
    reference_type,
    reference_id
  ) VALUES (
    p_tenant_id,
    v_journal_id,
    v_exercice_id,
    v_numero,
    p_date,
    p_libelle,
    'brouillon',
    true,
    p_reference_type,
    p_reference_id
  )
  RETURNING id INTO v_ecriture_id;
  
  -- Insert entry lines
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    -- Support both numero_compte and compte_numero field names
    v_compte_numero := COALESCE(v_line->>'numero_compte', v_line->>'compte_numero');
    -- Support both libelle_ligne and libelle field names
    v_libelle_ligne := COALESCE(v_line->>'libelle_ligne', v_line->>'libelle', p_libelle);
    
    -- Find account by numero
    SELECT id INTO v_compte_id
    FROM comptes_comptables
    WHERE tenant_id = p_tenant_id 
      AND numero_compte = v_compte_numero
    LIMIT 1;
    
    -- If account not found, create it automatically
    IF v_compte_id IS NULL AND v_compte_numero IS NOT NULL THEN
      INSERT INTO comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, is_active)
      VALUES (p_tenant_id, v_compte_numero, 'Compte ' || v_compte_numero, 'general', true)
      RETURNING id INTO v_compte_id;
    END IF;
    
    -- Insert the line
    INSERT INTO lignes_ecriture (
      ecriture_id,
      compte_id,
      libelle,
      debit,
      credit
    ) VALUES (
      v_ecriture_id,
      v_compte_id,
      v_libelle_ligne,
      COALESCE((v_line->>'debit')::numeric, 0),
      COALESCE((v_line->>'credit')::numeric, 0)
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'ecriture_id', v_ecriture_id,
    'numero', v_numero,
    'exercice_id', v_exercice_id,
    'journal_id', v_journal_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
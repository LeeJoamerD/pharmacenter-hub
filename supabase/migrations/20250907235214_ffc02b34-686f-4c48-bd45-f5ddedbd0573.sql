-- Create inventory management RPCs

-- RPC to create a new inventory session
CREATE OR REPLACE FUNCTION rpc_inventory_create_session(
  session_name TEXT,
  session_description TEXT DEFAULT NULL,
  session_type TEXT DEFAULT 'complet',
  session_secteurs TEXT[] DEFAULT '{}',
  session_participants TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_session_id UUID;
  current_tenant_id UUID;
  current_personnel_id UUID;
BEGIN
  -- Get current user info
  current_tenant_id := get_current_user_tenant_id();
  SELECT id INTO current_personnel_id 
  FROM personnel 
  WHERE auth_user_id = auth.uid() AND tenant_id = current_tenant_id;
  
  IF current_tenant_id IS NULL OR current_personnel_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;
  
  -- Create new inventory session
  INSERT INTO inventaire_sessions (
    tenant_id, nom, description, type, secteurs, participants,
    agent_id, responsable, statut, date_creation
  ) VALUES (
    current_tenant_id, session_name, session_description, session_type,
    session_secteurs, session_participants, current_personnel_id,
    (SELECT CONCAT(prenoms, ' ', noms) FROM personnel WHERE id = current_personnel_id),
    'planifiee', now()
  ) RETURNING id INTO new_session_id;
  
  RETURN new_session_id;
END;
$$;

-- RPC to start an inventory session
CREATE OR REPLACE FUNCTION rpc_inventory_start_session(session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
  total_products INTEGER;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  
  -- Check if session exists and belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM inventaire_sessions 
    WHERE id = session_id AND tenant_id = current_tenant_id
  ) THEN
    RAISE EXCEPTION 'Session not found or unauthorized';
  END IF;
  
  -- Get total products count for progress tracking
  SELECT COUNT(*) INTO total_products
  FROM produits p
  WHERE p.tenant_id = current_tenant_id AND p.is_active = true;
  
  -- Update session status
  UPDATE inventaire_sessions 
  SET statut = 'en_cours', 
      date_debut = now(),
      produits_total = total_products,
      updated_at = now()
  WHERE id = session_id AND tenant_id = current_tenant_id;
  
  RETURN FOUND;
END;
$$;

-- RPC to record a barcode scan/entry
CREATE OR REPLACE FUNCTION rpc_inventory_record_entry(
  session_id UUID,
  code_barre TEXT,
  quantite INTEGER DEFAULT 1,
  emplacement TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
  current_personnel_id UUID;
  found_product RECORD;
  found_lot RECORD;
  entry_id UUID;
  result JSONB;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  SELECT id INTO current_personnel_id 
  FROM personnel 
  WHERE auth_user_id = auth.uid() AND tenant_id = current_tenant_id;
  
  IF current_tenant_id IS NULL OR current_personnel_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;
  
  -- Check if session exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM inventaire_sessions 
    WHERE id = session_id AND tenant_id = current_tenant_id AND statut = 'en_cours'
  ) THEN
    RAISE EXCEPTION 'Session not found, completed, or not started';
  END IF;
  
  -- Try to find product by barcode (could be CIP or other barcode)
  SELECT p.id, p.libelle_produit, p.code_cip 
  INTO found_product
  FROM produits p
  WHERE p.tenant_id = current_tenant_id 
    AND p.is_active = true
    AND (p.code_cip = code_barre OR p.code_barre = code_barre)
  LIMIT 1;
  
  -- Try to find lot by barcode if no product found
  IF found_product IS NULL THEN
    SELECT l.id, l.numero_lot, l.produit_id, p.libelle_produit
    INTO found_lot
    FROM lots l
    JOIN produits p ON l.produit_id = p.id
    WHERE l.tenant_id = current_tenant_id 
      AND (l.numero_lot = code_barre OR l.code_barre = code_barre)
    LIMIT 1;
    
    IF found_lot IS NOT NULL THEN
      found_product.id := found_lot.produit_id;
      found_product.libelle_produit := found_lot.libelle_produit;
    END IF;
  END IF;
  
  -- Record the entry
  INSERT INTO inventaire_saisies (
    tenant_id, session_id, code_barre, quantite, emplacement,
    operateur_id, produit_trouve, produit_id, lot_id
  ) VALUES (
    current_tenant_id, session_id, code_barre, quantite, emplacement,
    current_personnel_id, found_product IS NOT NULL, 
    found_product.id, found_lot.id
  ) RETURNING id INTO entry_id;
  
  -- Build result
  result := jsonb_build_object(
    'entry_id', entry_id,
    'product_found', found_product IS NOT NULL,
    'product_name', COALESCE(found_product.libelle_produit, 'Produit non trouvé'),
    'lot_number', found_lot.numero_lot
  );
  
  RETURN result;
END;
$$;

-- RPC to save inventory count for a product
CREATE OR REPLACE FUNCTION rpc_inventory_save_count(
  session_id UUID,
  produit_id UUID,
  lot_id UUID DEFAULT NULL,
  quantite_comptee INTEGER,
  emplacement_reel TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
  current_personnel_id UUID;
  quantite_theorique INTEGER := 0;
  ligne_id UUID;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  SELECT id INTO current_personnel_id 
  FROM personnel 
  WHERE auth_user_id = auth.uid() AND tenant_id = current_tenant_id;
  
  IF current_tenant_id IS NULL OR current_personnel_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;
  
  -- Get theoretical quantity from lots if lot_id provided
  IF lot_id IS NOT NULL THEN
    SELECT quantite_restante INTO quantite_theorique
    FROM lots
    WHERE id = lot_id AND tenant_id = current_tenant_id;
  ELSE
    -- Sum all lots quantities for the product
    SELECT COALESCE(SUM(quantite_restante), 0) INTO quantite_theorique
    FROM lots
    WHERE produit_id = rpc_inventory_save_count.produit_id 
      AND tenant_id = current_tenant_id;
  END IF;
  
  -- Insert or update inventory line
  INSERT INTO inventaire_lignes (
    tenant_id, session_id, produit_id, lot_id, 
    quantite_theorique, quantite_comptee, emplacement_reel,
    statut, date_comptage, operateur_id, notes
  ) VALUES (
    current_tenant_id, session_id, produit_id, lot_id,
    quantite_theorique, quantite_comptee, emplacement_reel,
    CASE 
      WHEN quantite_comptee = quantite_theorique THEN 'valide'
      ELSE 'ecart'
    END,
    now(), current_personnel_id, notes
  ) 
  ON CONFLICT (session_id, produit_id, COALESCE(lot_id, '00000000-0000-0000-0000-000000000000'::UUID))
  DO UPDATE SET
    quantite_comptee = EXCLUDED.quantite_comptee,
    emplacement_reel = EXCLUDED.emplacement_reel,
    statut = EXCLUDED.statut,
    date_comptage = EXCLUDED.date_comptage,
    operateur_id = EXCLUDED.operateur_id,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING id INTO ligne_id;
  
  -- Update session progress
  UPDATE inventaire_sessions 
  SET 
    produits_comptes = (
      SELECT COUNT(DISTINCT produit_id) 
      FROM inventaire_lignes 
      WHERE session_id = rpc_inventory_save_count.session_id
    ),
    ecarts = (
      SELECT COUNT(*) 
      FROM inventaire_lignes 
      WHERE session_id = rpc_inventory_save_count.session_id AND statut = 'ecart'
    ),
    progression = CASE 
      WHEN produits_total > 0 THEN 
        (SELECT COUNT(DISTINCT produit_id) FROM inventaire_lignes WHERE session_id = rpc_inventory_save_count.session_id) * 100.0 / produits_total
      ELSE 0
    END
  WHERE id = session_id;
  
  RETURN ligne_id;
END;
$$;
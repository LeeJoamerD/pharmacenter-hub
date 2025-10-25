-- Add missing taux_tva column to produits
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(5,2) DEFAULT 18.00;

-- Add foreign key between lots and fournisseurs
ALTER TABLE public.lots 
DROP CONSTRAINT IF EXISTS lots_fournisseur_id_fkey;

ALTER TABLE public.lots 
ADD CONSTRAINT lots_fournisseur_id_fkey 
FOREIGN KEY (fournisseur_id) 
REFERENCES public.fournisseurs(id) 
ON DELETE SET NULL;

-- Add missing columns to parametres_systeme if needed
ALTER TABLE public.parametres_systeme ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.parametres_systeme ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Create RPC function for updating stock movement
CREATE OR REPLACE FUNCTION public.rpc_stock_update_movement(
  p_tenant_id UUID,
  p_mouvement_id UUID,
  p_quantite INTEGER,
  p_motif TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mouvement_record RECORD;
  v_lot_record RECORD;
  v_quantite_avant INTEGER;
  v_quantite_apres INTEGER;
  v_diff INTEGER;
BEGIN
  -- Get existing movement record
  SELECT * INTO v_mouvement_record 
  FROM public.mouvements_lots 
  WHERE id = p_mouvement_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;
  
  -- Get current lot state
  SELECT * INTO v_lot_record 
  FROM public.lots 
  WHERE id = v_mouvement_record.lot_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;
  
  -- Calculate difference
  v_diff := p_quantite - v_mouvement_record.quantite_mouvement;
  
  -- Calculate new quantity
  IF v_mouvement_record.type_mouvement IN ('sortie', 'peremption') THEN
    v_quantite_apres := v_lot_record.quantite_restante - v_diff;
  ELSIF v_mouvement_record.type_mouvement IN ('entree', 'retour') THEN
    v_quantite_apres := v_lot_record.quantite_restante + v_diff;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Type de mouvement invalide');
  END IF;
  
  -- Check for negative stock
  IF v_quantite_apres < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Stock insuffisant');
  END IF;
  
  -- Update movement record
  UPDATE public.mouvements_lots
  SET quantite_mouvement = p_quantite,
      quantite_apres = v_quantite_apres,
      motif = COALESCE(p_motif, motif)
  WHERE id = p_mouvement_id;
  
  -- Update lot
  UPDATE public.lots
  SET quantite_restante = v_quantite_apres,
      updated_at = NOW()
  WHERE id = v_mouvement_record.lot_id;
  
  RETURN json_build_object(
    'success', true,
    'quantite_apres', v_quantite_apres
  );
END;
$$;

-- Create RPC function for deleting stock movement
CREATE OR REPLACE FUNCTION public.rpc_stock_delete_movement(
  p_tenant_id UUID,
  p_mouvement_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mouvement_record RECORD;
  v_lot_record RECORD;
  v_quantite_apres INTEGER;
BEGIN
  -- Get movement record
  SELECT * INTO v_mouvement_record 
  FROM public.mouvements_lots 
  WHERE id = p_mouvement_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;
  
  -- Get lot record
  SELECT * INTO v_lot_record 
  FROM public.lots 
  WHERE id = v_mouvement_record.lot_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;
  
  -- Reverse the movement
  IF v_mouvement_record.type_mouvement IN ('sortie', 'peremption') THEN
    v_quantite_apres := v_lot_record.quantite_restante + v_mouvement_record.quantite_mouvement;
  ELSIF v_mouvement_record.type_mouvement IN ('entree', 'retour') THEN
    v_quantite_apres := v_lot_record.quantite_restante - v_mouvement_record.quantite_mouvement;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Type de mouvement invalide');
  END IF;
  
  -- Update lot
  UPDATE public.lots
  SET quantite_restante = v_quantite_apres,
      updated_at = NOW()
  WHERE id = v_mouvement_record.lot_id;
  
  -- Delete movement
  DELETE FROM public.mouvements_lots
  WHERE id = p_mouvement_id;
  
  RETURN json_build_object(
    'success', true,
    'quantite_apres', v_quantite_apres
  );
END;
$$;
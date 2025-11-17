-- ÉTAPE 3: Fonctions SQL de Recalcul - SOLUTION 1

-- Fonction pour recalculer les prix de tous les produits
CREATE OR REPLACE FUNCTION recalculer_prix_produits()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_tenant_id UUID;
  product_record RECORD;
  category_record RECORD;
  v_prix_ht NUMERIC;
  v_tva NUMERIC;
  v_centime NUMERIC;
  v_prix_ttc NUMERIC;
BEGIN
  -- Récupérer le tenant_id de l'utilisateur actuel
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non authentifié ou tenant non trouvé'
    );
  END IF;

  -- Parcourir tous les produits actifs avec une catégorie et un prix d'achat
  FOR product_record IN
    SELECT 
      p.id,
      p.prix_achat,
      p.categorie_tarification_id
    FROM produits p
    WHERE p.tenant_id = v_tenant_id
      AND p.is_active = true
      AND p.categorie_tarification_id IS NOT NULL
      AND p.prix_achat > 0
  LOOP
    -- Récupérer les paramètres de la catégorie
    SELECT 
      coefficient_prix_vente,
      taux_tva,
      taux_centime_additionnel
    INTO category_record
    FROM categorie_tarification
    WHERE id = product_record.categorie_tarification_id
      AND tenant_id = v_tenant_id;

    IF FOUND THEN
      -- Calculer prix HT (prix achat × coefficient)
      v_prix_ht := product_record.prix_achat * category_record.coefficient_prix_vente;
      
      -- Calculer centime additionnel (sur HT)
      v_centime := v_prix_ht * (category_record.taux_centime_additionnel / 100);
      
      -- Calculer TVA (sur HT + centime additionnel)
      v_tva := (v_prix_ht + v_centime) * (category_record.taux_tva / 100);
      
      -- Calculer prix TTC
      v_prix_ttc := v_prix_ht + v_centime + v_tva;

      -- Mettre à jour le produit
      UPDATE produits
      SET
        prix_vente_ht = v_prix_ht,
        tva = v_tva,
        centime_additionnel = v_centime,
        prix_vente_ttc = v_prix_ttc,
        updated_at = NOW()
      WHERE id = product_record.id;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'products_updated', v_count,
    'message', format('%s produits recalculés avec succès', v_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Fonction pour recalculer les prix_vente_suggere des lots
CREATE OR REPLACE FUNCTION recalculer_prix_lots()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_tenant_id UUID;
BEGIN
  -- Récupérer le tenant_id de l'utilisateur actuel
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non authentifié ou tenant non trouvé'
    );
  END IF;

  -- Mettre à jour tous les lots avec le prix_vente_ttc du produit
  UPDATE lots l
  SET 
    prix_vente_suggere = p.prix_vente_ttc,
    updated_at = NOW()
  FROM produits p
  WHERE l.produit_id = p.id
    AND l.tenant_id = v_tenant_id
    AND p.tenant_id = v_tenant_id
    AND l.quantite_restante > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'lots_updated', v_count,
    'message', format('%s lots recalculés avec succès', v_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION recalculer_prix_produits() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculer_prix_lots() TO authenticated;
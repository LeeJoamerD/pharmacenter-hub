-- Nouvelle fonction RPC unifiée pour recalculer tous les prix
-- Lit automatiquement les paramètres d'arrondi depuis parametres_systeme
-- Définit prix_vente_suggere = prix_vente_ttc pour les lots

CREATE OR REPLACE FUNCTION recalculer_tous_les_prix_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_precision INTEGER := 25;
  v_method TEXT := 'ceil';
  v_param_value TEXT;
  v_products_count INTEGER := 0;
  v_lots_count INTEGER := 0;
  product_record RECORD;
  lot_record RECORD;
  category_record RECORD;
  v_prix_ht NUMERIC;
  v_tva NUMERIC;
  v_centime NUMERIC;
  v_prix_ttc_brut NUMERIC;
  v_prix_ttc NUMERIC;
BEGIN
  -- Récupérer le tenant
  v_tenant_id := get_current_user_tenant_id();
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant non trouvé');
  END IF;

  -- LIRE LA PRÉCISION depuis parametres_systeme
  SELECT valeur_parametre INTO v_param_value
  FROM parametres_systeme 
  WHERE tenant_id = v_tenant_id AND cle_parametre = 'stock_rounding_precision'
  LIMIT 1;
  IF v_param_value IS NOT NULL THEN
    v_precision := v_param_value::INTEGER;
  END IF;

  -- LIRE LA MÉTHODE depuis parametres_systeme (dans sales_tax JSON)
  SELECT valeur_parametre INTO v_param_value
  FROM parametres_systeme 
  WHERE tenant_id = v_tenant_id AND cle_parametre = 'sales_tax'
  LIMIT 1;
  IF v_param_value IS NOT NULL THEN
    BEGIN
      v_method := COALESCE(v_param_value::json->>'taxRoundingMethod', 'ceil');
    EXCEPTION WHEN OTHERS THEN
      v_method := 'ceil';
    END;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- PARTIE 1: RECALCULER LES PRODUITS
  -- ═══════════════════════════════════════════════════════════
  FOR product_record IN
    SELECT p.id, p.prix_achat, p.categorie_tarification_id
    FROM produits p
    WHERE p.tenant_id = v_tenant_id
      AND p.is_active = true
      AND p.categorie_tarification_id IS NOT NULL
      AND p.prix_achat > 0
  LOOP
    SELECT coefficient_prix_vente, taux_tva, taux_centime_additionnel
    INTO category_record
    FROM categorie_tarification
    WHERE id = product_record.categorie_tarification_id 
      AND tenant_id = v_tenant_id;

    IF FOUND THEN
      -- Formules de calcul (arrondis intermédiaires à l'entier)
      v_prix_ht := ROUND(product_record.prix_achat * category_record.coefficient_prix_vente);
      v_centime := ROUND(v_prix_ht * (category_record.taux_centime_additionnel / 100));
      v_tva := ROUND((v_prix_ht + v_centime) * (category_record.taux_tva / 100));
      v_prix_ttc_brut := v_prix_ht + v_tva + v_centime;
      
      -- Appliquer l'arrondi final selon la méthode configurée
      IF v_method = 'ceil' THEN
        v_prix_ttc := CEIL(v_prix_ttc_brut / v_precision) * v_precision;
      ELSIF v_method = 'floor' THEN
        v_prix_ttc := FLOOR(v_prix_ttc_brut / v_precision) * v_precision;
      ELSE
        v_prix_ttc := ROUND(v_prix_ttc_brut / v_precision) * v_precision;
      END IF;

      UPDATE produits SET
        prix_vente_ht = v_prix_ht,
        tva = v_tva,
        centime_additionnel = v_centime,
        prix_vente_ttc = v_prix_ttc,
        updated_at = NOW()
      WHERE id = product_record.id;

      v_products_count := v_products_count + 1;
    END IF;
  END LOOP;

  -- ═══════════════════════════════════════════════════════════
  -- PARTIE 2: RECALCULER LES LOTS (basé sur prix_achat_unitaire)
  -- ═══════════════════════════════════════════════════════════
  FOR lot_record IN
    SELECT l.id, l.prix_achat_unitaire, p.categorie_tarification_id
    FROM lots l
    JOIN produits p ON l.produit_id = p.id
    WHERE l.tenant_id = v_tenant_id
      AND l.quantite_restante > 0
      AND l.prix_achat_unitaire > 0
      AND p.categorie_tarification_id IS NOT NULL
  LOOP
    SELECT coefficient_prix_vente, taux_tva, taux_centime_additionnel
    INTO category_record
    FROM categorie_tarification
    WHERE id = lot_record.categorie_tarification_id 
      AND tenant_id = v_tenant_id;

    IF FOUND THEN
      v_prix_ht := ROUND(lot_record.prix_achat_unitaire * category_record.coefficient_prix_vente);
      v_centime := ROUND(v_prix_ht * (category_record.taux_centime_additionnel / 100));
      v_tva := ROUND((v_prix_ht + v_centime) * (category_record.taux_tva / 100));
      v_prix_ttc_brut := v_prix_ht + v_tva + v_centime;
      
      IF v_method = 'ceil' THEN
        v_prix_ttc := CEIL(v_prix_ttc_brut / v_precision) * v_precision;
      ELSIF v_method = 'floor' THEN
        v_prix_ttc := FLOOR(v_prix_ttc_brut / v_precision) * v_precision;
      ELSE
        v_prix_ttc := ROUND(v_prix_ttc_brut / v_precision) * v_precision;
      END IF;

      UPDATE lots SET
        prix_vente_ht = v_prix_ht,
        taux_tva = category_record.taux_tva,
        montant_tva = v_tva,
        taux_centime_additionnel = category_record.taux_centime_additionnel,
        montant_centime_additionnel = v_centime,
        prix_vente_ttc = v_prix_ttc,
        prix_vente_suggere = v_prix_ttc,
        updated_at = NOW()
      WHERE id = lot_record.id;

      v_lots_count := v_lots_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'products_updated', v_products_count,
    'lots_updated', v_lots_count,
    'precision', v_precision,
    'method', v_method,
    'message', format('%s produits et %s lots recalculés (arrondi: %s × %s)', 
                      v_products_count, v_lots_count, v_method, v_precision)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
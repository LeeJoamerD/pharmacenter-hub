-- =============================================================================
-- MIGRATION: Correction Multi-Localité des Prix pour Franc CFA
-- =============================================================================
-- Cette migration:
-- 1. Modifie les triggers pour utiliser ROUND(..., 0) pour le Franc CFA
-- 2. Nettoie les données existantes (suppression des décimales)
-- =============================================================================

-- 1. Modifier trigger_calculate_product_prices pour utiliser ROUND 0
CREATE OR REPLACE FUNCTION trigger_calculate_product_prices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  category_record RECORD;
  v_prix_ht NUMERIC;
  v_tva NUMERIC;
  v_centime NUMERIC;
  v_prix_ttc NUMERIC;
BEGIN
  -- Vérifier si le produit a une catégorie et un prix d'achat
  IF NEW.categorie_tarification_id IS NOT NULL AND NEW.prix_achat > 0 THEN
    -- Récupérer les paramètres de la catégorie
    SELECT 
      coefficient_prix_vente,
      taux_tva,
      taux_centime_additionnel
    INTO category_record
    FROM categorie_tarification
    WHERE id = NEW.categorie_tarification_id
      AND tenant_id = NEW.tenant_id;

    IF FOUND THEN
      -- Calculer prix HT (prix achat × coefficient) - ARRONDI ENTIER pour FCFA
      v_prix_ht := ROUND((NEW.prix_achat * category_record.coefficient_prix_vente)::NUMERIC, 0);
      
      -- Calculer centime additionnel (sur HT) - ARRONDI ENTIER pour FCFA
      v_centime := ROUND((v_prix_ht * (category_record.taux_centime_additionnel / 100))::NUMERIC, 0);
      
      -- Calculer TVA (sur HT + centime additionnel) - ARRONDI ENTIER pour FCFA
      v_tva := ROUND(((v_prix_ht + v_centime) * (category_record.taux_tva / 100))::NUMERIC, 0);
      
      -- Calculer prix TTC - ARRONDI ENTIER pour FCFA
      v_prix_ttc := ROUND((v_prix_ht + v_centime + v_tva)::NUMERIC, 0);

      -- Appliquer les valeurs calculées
      NEW.prix_vente_ht := v_prix_ht;
      NEW.tva := v_tva;
      NEW.centime_additionnel := v_centime;
      NEW.prix_vente_ttc := v_prix_ttc;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Modifier recalculer_prix_produits pour utiliser ROUND 0
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
      -- Calculer prix HT - ARRONDI ENTIER pour FCFA
      v_prix_ht := ROUND((product_record.prix_achat * category_record.coefficient_prix_vente)::NUMERIC, 0);
      
      -- Calculer centime additionnel - ARRONDI ENTIER pour FCFA
      v_centime := ROUND((v_prix_ht * (category_record.taux_centime_additionnel / 100))::NUMERIC, 0);
      
      -- Calculer TVA - ARRONDI ENTIER pour FCFA
      v_tva := ROUND(((v_prix_ht + v_centime) * (category_record.taux_tva / 100))::NUMERIC, 0);
      
      -- Calculer prix TTC - ARRONDI ENTIER pour FCFA
      v_prix_ttc := ROUND((v_prix_ht + v_centime + v_tva)::NUMERIC, 0);

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
    'message', format('%s produits recalculés avec succès (prix arrondis à l''entier)', v_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- 3. Modifier trigger_calculate_lot_prices pour utiliser ROUND 0
CREATE OR REPLACE FUNCTION trigger_calculate_lot_prices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_record RECORD;
  category_record RECORD;
  v_prix_achat NUMERIC;
  v_prix_ht NUMERIC;
  v_tva NUMERIC;
  v_centime NUMERIC;
  v_prix_ttc NUMERIC;
BEGIN
  -- Récupérer les informations du produit parent
  SELECT 
    p.categorie_tarification_id,
    p.tenant_id,
    p.prix_achat as product_prix_achat
  INTO product_record
  FROM produits p
  WHERE p.id = NEW.produit_id;

  IF NOT FOUND THEN
    -- Si le produit n'existe pas, on garde le prix suggéré existant
    RETURN NEW;
  END IF;

  -- Utiliser le prix d'achat spécifique du lot si différent
  v_prix_achat := COALESCE(NEW.prix_achat_unitaire, product_record.product_prix_achat);

  -- Si le lot a un prix d'achat et le produit a une catégorie, calculer le prix
  IF v_prix_achat > 0 AND product_record.categorie_tarification_id IS NOT NULL THEN
    -- Récupérer les paramètres de la catégorie
    SELECT 
      coefficient_prix_vente,
      taux_tva,
      taux_centime_additionnel
    INTO category_record
    FROM categorie_tarification
    WHERE id = product_record.categorie_tarification_id
      AND tenant_id = product_record.tenant_id;

    IF FOUND THEN
      -- Calculer prix HT - ARRONDI ENTIER pour FCFA
      v_prix_ht := ROUND((v_prix_achat * category_record.coefficient_prix_vente)::NUMERIC, 0);
      
      -- Calculer centime additionnel - ARRONDI ENTIER pour FCFA
      v_centime := ROUND((v_prix_ht * (category_record.taux_centime_additionnel / 100))::NUMERIC, 0);
      
      -- Calculer TVA - ARRONDI ENTIER pour FCFA
      v_tva := ROUND(((v_prix_ht + v_centime) * (category_record.taux_tva / 100))::NUMERIC, 0);
      
      -- Calculer prix TTC - ARRONDI ENTIER pour FCFA
      v_prix_ttc := ROUND((v_prix_ht + v_centime + v_tva)::NUMERIC, 0);

      -- Appliquer le prix de vente suggéré
      NEW.prix_vente_suggere := v_prix_ttc;
    END IF;
  ELSE
    -- Si pas de calcul possible, utiliser le prix TTC du produit parent
    SELECT prix_vente_ttc INTO v_prix_ttc
    FROM produits
    WHERE id = NEW.produit_id;
    
    IF v_prix_ttc IS NOT NULL THEN
      NEW.prix_vente_suggere := ROUND(v_prix_ttc, 0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Modifier recalculer_prix_lots pour utiliser ROUND 0
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

  -- Mettre à jour tous les lots avec le prix_vente_ttc du produit (ARRONDI ENTIER)
  UPDATE lots l
  SET 
    prix_vente_suggere = ROUND(p.prix_vente_ttc, 0),
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
    'message', format('%s lots recalculés avec succès (prix arrondis à l''entier)', v_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 5. Nettoyer les données existantes - Arrondir tous les prix à l'entier
UPDATE produits
SET
  prix_achat = ROUND(COALESCE(prix_achat, 0), 0),
  prix_vente_ht = ROUND(COALESCE(prix_vente_ht, 0), 0),
  prix_vente_ttc = ROUND(COALESCE(prix_vente_ttc, 0), 0),
  tva = ROUND(COALESCE(tva, 0), 0),
  centime_additionnel = ROUND(COALESCE(centime_additionnel, 0), 0),
  updated_at = NOW()
WHERE tenant_id IS NOT NULL;

-- 6. Arrondir les prix des lots existants
UPDATE lots
SET
  prix_achat_unitaire = ROUND(COALESCE(prix_achat_unitaire, 0), 0),
  prix_vente_suggere = ROUND(COALESCE(prix_vente_suggere, 0), 0),
  updated_at = NOW()
WHERE tenant_id IS NOT NULL;
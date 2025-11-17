-- Corriger les fonctions de recalcul pour éviter les dépassements numériques

-- Fonction corrigée pour recalculer les prix de tous les produits
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
      -- Calculer prix HT (prix achat × coefficient) avec arrondi à 2 décimales
      v_prix_ht := ROUND((product_record.prix_achat * category_record.coefficient_prix_vente)::NUMERIC, 2);
      
      -- Calculer centime additionnel (sur HT) avec arrondi à 2 décimales
      v_centime := ROUND((v_prix_ht * (category_record.taux_centime_additionnel / 100))::NUMERIC, 2);
      
      -- Calculer TVA (sur HT + centime additionnel) avec arrondi à 2 décimales
      v_tva := ROUND(((v_prix_ht + v_centime) * (category_record.taux_tva / 100))::NUMERIC, 2);
      
      -- Calculer prix TTC avec arrondi à 2 décimales
      v_prix_ttc := ROUND((v_prix_ht + v_centime + v_tva)::NUMERIC, 2);

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
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Corriger les triggers pour utiliser ROUND également
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
      -- Calculer prix HT (prix achat × coefficient) avec arrondi
      v_prix_ht := ROUND((NEW.prix_achat * category_record.coefficient_prix_vente)::NUMERIC, 2);
      
      -- Calculer centime additionnel (sur HT) avec arrondi
      v_centime := ROUND((v_prix_ht * (category_record.taux_centime_additionnel / 100))::NUMERIC, 2);
      
      -- Calculer TVA (sur HT + centime additionnel) avec arrondi
      v_tva := ROUND(((v_prix_ht + v_centime) * (category_record.taux_tva / 100))::NUMERIC, 2);
      
      -- Calculer prix TTC avec arrondi
      v_prix_ttc := ROUND((v_prix_ht + v_centime + v_tva)::NUMERIC, 2);

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

-- Corriger le trigger pour les lots
CREATE OR REPLACE FUNCTION trigger_calculate_lot_prices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_record RECORD;
  category_record RECORD;
  v_prix_ht NUMERIC;
  v_tva NUMERIC;
  v_centime NUMERIC;
  v_prix_ttc NUMERIC;
BEGIN
  -- Récupérer les informations du produit
  SELECT 
    p.prix_achat,
    p.prix_vente_ttc,
    p.categorie_tarification_id,
    p.tenant_id
  INTO product_record
  FROM produits p
  WHERE p.id = NEW.produit_id
    AND p.tenant_id = NEW.tenant_id;

  IF FOUND THEN
    -- Vérifier si le prix d'achat du lot est différent de celui du produit
    IF NEW.prix_achat_unitaire IS NOT NULL 
       AND NEW.prix_achat_unitaire != product_record.prix_achat 
       AND product_record.categorie_tarification_id IS NOT NULL 
       AND NEW.prix_achat_unitaire > 0 THEN
      
      -- Recalculer les prix du produit avec le nouveau prix d'achat
      SELECT 
        coefficient_prix_vente,
        taux_tva,
        taux_centime_additionnel
      INTO category_record
      FROM categorie_tarification
      WHERE id = product_record.categorie_tarification_id
        AND tenant_id = NEW.tenant_id;

      IF FOUND THEN
        -- Calculer les nouveaux prix avec arrondi
        v_prix_ht := ROUND((NEW.prix_achat_unitaire * category_record.coefficient_prix_vente)::NUMERIC, 2);
        v_centime := ROUND((v_prix_ht * (category_record.taux_centime_additionnel / 100))::NUMERIC, 2);
        v_tva := ROUND(((v_prix_ht + v_centime) * (category_record.taux_tva / 100))::NUMERIC, 2);
        v_prix_ttc := ROUND((v_prix_ht + v_centime + v_tva)::NUMERIC, 2);

        -- Mettre à jour le produit avec les nouveaux prix
        UPDATE produits
        SET
          prix_vente_ht = v_prix_ht,
          tva = v_tva,
          centime_additionnel = v_centime,
          prix_vente_ttc = v_prix_ttc,
          updated_at = NOW()
        WHERE id = NEW.produit_id
          AND tenant_id = NEW.tenant_id;

        -- Utiliser le nouveau prix TTC pour le lot
        NEW.prix_vente_suggere := v_prix_ttc;
      END IF;
    ELSE
      -- Si le prix d'achat est identique ou non défini, utiliser le prix du produit
      NEW.prix_vente_suggere := product_record.prix_vente_ttc;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
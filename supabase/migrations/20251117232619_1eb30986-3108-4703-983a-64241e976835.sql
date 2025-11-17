-- ÉTAPE 4: Triggers Automatiques - SOLUTION 2

-- ==========================================
-- TRIGGER 1: Calcul automatique des prix produits
-- ==========================================

-- Fonction trigger pour calculer automatiquement les prix d'un produit
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
      -- Calculer prix HT (prix achat × coefficient)
      v_prix_ht := NEW.prix_achat * category_record.coefficient_prix_vente;
      
      -- Calculer centime additionnel (sur HT)
      v_centime := v_prix_ht * (category_record.taux_centime_additionnel / 100);
      
      -- Calculer TVA (sur HT + centime additionnel)
      v_tva := (v_prix_ht + v_centime) * (category_record.taux_tva / 100);
      
      -- Calculer prix TTC
      v_prix_ttc := v_prix_ht + v_centime + v_tva;

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

-- Créer le trigger sur la table produits
DROP TRIGGER IF EXISTS trigger_calculate_product_prices ON produits;
CREATE TRIGGER trigger_calculate_product_prices
  BEFORE INSERT OR UPDATE OF prix_achat, categorie_tarification_id
  ON produits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_product_prices();

-- ==========================================
-- TRIGGER 2: Calcul automatique des prix lots
-- ==========================================

-- Fonction trigger pour calculer automatiquement les prix des lots
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
        -- Calculer les nouveaux prix
        v_prix_ht := NEW.prix_achat_unitaire * category_record.coefficient_prix_vente;
        v_centime := v_prix_ht * (category_record.taux_centime_additionnel / 100);
        v_tva := (v_prix_ht + v_centime) * (category_record.taux_tva / 100);
        v_prix_ttc := v_prix_ht + v_centime + v_tva;

        -- Mettre à jour le produit avec les nouveaux prix
        UPDATE produits
        SET
          prix_achat = NEW.prix_achat_unitaire,
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

-- Créer le trigger sur la table lots
DROP TRIGGER IF EXISTS trigger_calculate_lot_prices ON lots;
CREATE TRIGGER trigger_calculate_lot_prices
  BEFORE INSERT
  ON lots
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_lot_prices();

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION trigger_calculate_product_prices() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_calculate_lot_prices() TO authenticated;
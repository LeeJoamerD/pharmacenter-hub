-- Correction du trigger de calcul des prix produits
-- Pour respecter le prix arrondi fourni par le frontend et appliquer l'arrondi tenant

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
  v_rounding_precision NUMERIC := 25;
  v_rounding_method TEXT := 'ceil';
  v_param_value TEXT;
BEGIN
  -- Récupérer la précision d'arrondi du tenant
  SELECT valeur_parametre INTO v_param_value
  FROM parametres_systeme 
  WHERE tenant_id = NEW.tenant_id 
    AND cle_parametre = 'stock_rounding_precision'
  LIMIT 1;
  
  IF v_param_value IS NOT NULL THEN
    v_rounding_precision := v_param_value::NUMERIC;
  END IF;

  -- Récupérer la méthode d'arrondi du tenant
  SELECT valeur_parametre INTO v_param_value
  FROM parametres_systeme 
  WHERE tenant_id = NEW.tenant_id 
    AND cle_parametre = 'sales_tax'
  LIMIT 1;
  
  IF v_param_value IS NOT NULL THEN
    BEGIN
      v_rounding_method := COALESCE(v_param_value::json->>'taxRoundingMethod', 'ceil');
    EXCEPTION WHEN OTHERS THEN
      v_rounding_method := 'ceil';
    END;
  END IF;

  -- Si un prix_vente_ttc est déjà fourni et > 0, le respecter (déjà arrondi par le frontend)
  IF NEW.prix_vente_ttc IS NOT NULL AND NEW.prix_vente_ttc > 0 THEN
    -- Le prix est déjà arrondi par le frontend, on le garde tel quel
    RETURN NEW;
  END IF;

  -- Sinon, calculer automatiquement si catégorie et prix d'achat présents
  IF NEW.categorie_tarification_id IS NOT NULL AND NEW.prix_achat IS NOT NULL AND NEW.prix_achat > 0 THEN
    SELECT 
      coefficient_prix_vente,
      taux_tva,
      taux_centime_additionnel
    INTO category_record
    FROM categorie_tarification
    WHERE id = NEW.categorie_tarification_id
      AND tenant_id = NEW.tenant_id;

    IF FOUND THEN
      -- Calculer prix HT
      v_prix_ht := NEW.prix_achat * COALESCE(category_record.coefficient_prix_vente, 1);
      
      -- Calculer centime additionnel
      v_centime := v_prix_ht * (COALESCE(category_record.taux_centime_additionnel, 0) / 100);
      
      -- Calculer TVA
      v_tva := (v_prix_ht + v_centime) * (COALESCE(category_record.taux_tva, 0) / 100);
      
      -- Calculer prix TTC brut
      v_prix_ttc := v_prix_ht + v_centime + v_tva;

      -- Appliquer l'arrondi selon la méthode du tenant
      IF v_rounding_precision > 0 THEN
        IF v_rounding_method = 'ceil' THEN
          v_prix_ttc := CEIL(v_prix_ttc / v_rounding_precision) * v_rounding_precision;
        ELSIF v_rounding_method = 'floor' THEN
          v_prix_ttc := FLOOR(v_prix_ttc / v_rounding_precision) * v_rounding_precision;
        ELSIF v_rounding_method = 'round' THEN
          v_prix_ttc := ROUND(v_prix_ttc / v_rounding_precision) * v_rounding_precision;
        END IF;
        -- Si 'none', on garde la valeur telle quelle
      END IF;

      -- Appliquer les valeurs calculées
      NEW.prix_vente_ht := ROUND(v_prix_ht::NUMERIC, 2);
      NEW.tva := ROUND(v_tva::NUMERIC, 2);
      NEW.centime_additionnel := ROUND(v_centime::NUMERIC, 2);
      NEW.prix_vente_ttc := v_prix_ttc;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
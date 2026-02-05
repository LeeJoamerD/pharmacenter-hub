-- ═══════════════════════════════════════════════════════════════════════════════
-- CORRECTION DES FORMULES DE CALCUL DES PRIX
-- Alignement avec UnifiedPricingService et documentation officielle
-- ═══════════════════════════════════════════════════════════════════════════════
-- FORMULES CORRIGÉES:
-- 1. Prix HT = Prix Achat × Coefficient
-- 2. TVA = Prix HT × (Taux TVA / 100)          ← AVANT: (HT + Centime) × taux%
-- 3. Centime = TVA × (Taux Centime / 100)      ← AVANT: HT × taux%
-- 4. TTC = HT + TVA + Centime (+ arrondi final)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.recalculer_tous_les_prix_v2();

CREATE OR REPLACE FUNCTION public.recalculer_tous_les_prix_v2()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_precision INTEGER := 1;
  v_method TEXT := 'round';
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
      v_method := COALESCE(v_param_value::json->>'taxRoundingMethod', 'round');
    EXCEPTION WHEN OTHERS THEN
      v_method := 'round';
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
      -- FORMULES CORRIGÉES (alignées avec UnifiedPricingService)
      -- Étape 1: Prix HT = Prix Achat × Coefficient
      v_prix_ht := ROUND(product_record.prix_achat * category_record.coefficient_prix_vente);
      
      -- Étape 2: TVA = Prix HT × (Taux TVA / 100)
      v_tva := ROUND(v_prix_ht * (category_record.taux_tva / 100));
      
      -- Étape 3: Centime Additionnel = TVA × (Taux Centime / 100)
      v_centime := ROUND(v_tva * (category_record.taux_centime_additionnel / 100));
      
      -- Étape 4: TTC brut = HT + TVA + Centime
      v_prix_ttc_brut := v_prix_ht + v_tva + v_centime;
      
      -- Appliquer l'arrondi final selon la méthode configurée
      IF v_precision > 1 THEN
        IF v_method = 'ceil' THEN
          v_prix_ttc := CEIL(v_prix_ttc_brut / v_precision) * v_precision;
        ELSIF v_method = 'floor' THEN
          v_prix_ttc := FLOOR(v_prix_ttc_brut / v_precision) * v_precision;
        ELSIF v_method = 'none' THEN
          v_prix_ttc := ROUND(v_prix_ttc_brut);
        ELSE
          v_prix_ttc := ROUND(v_prix_ttc_brut / v_precision) * v_precision;
        END IF;
      ELSE
        v_prix_ttc := ROUND(v_prix_ttc_brut);
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
      -- FORMULES CORRIGÉES (alignées avec UnifiedPricingService)
      -- Étape 1: Prix HT = Prix Achat × Coefficient
      v_prix_ht := ROUND(lot_record.prix_achat_unitaire * category_record.coefficient_prix_vente);
      
      -- Étape 2: TVA = Prix HT × (Taux TVA / 100)
      v_tva := ROUND(v_prix_ht * (category_record.taux_tva / 100));
      
      -- Étape 3: Centime Additionnel = TVA × (Taux Centime / 100)
      v_centime := ROUND(v_tva * (category_record.taux_centime_additionnel / 100));
      
      -- Étape 4: TTC brut = HT + TVA + Centime
      v_prix_ttc_brut := v_prix_ht + v_tva + v_centime;
      
      -- Appliquer l'arrondi final selon la méthode configurée
      IF v_precision > 1 THEN
        IF v_method = 'ceil' THEN
          v_prix_ttc := CEIL(v_prix_ttc_brut / v_precision) * v_precision;
        ELSIF v_method = 'floor' THEN
          v_prix_ttc := FLOOR(v_prix_ttc_brut / v_precision) * v_precision;
        ELSIF v_method = 'none' THEN
          v_prix_ttc := ROUND(v_prix_ttc_brut);
        ELSE
          v_prix_ttc := ROUND(v_prix_ttc_brut / v_precision) * v_precision;
        END IF;
      ELSE
        v_prix_ttc := ROUND(v_prix_ttc_brut);
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
    'rounding_precision', v_precision,
    'rounding_method', v_method
  );
END;
$function$;

-- Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';
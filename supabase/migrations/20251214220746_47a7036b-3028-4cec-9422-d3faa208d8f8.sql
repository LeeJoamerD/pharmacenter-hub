-- =====================================================
-- Migration: Amélioration Réception Commandes
-- Ajout ASDI, Contrôle Qualité, Catégorie Tarification
-- =====================================================

-- 1. Table receptions_fournisseurs: Ajout colonnes Contrôle Qualité et ASDI
ALTER TABLE receptions_fournisseurs
ADD COLUMN IF NOT EXISTS emballage_conforme BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS temperature_respectee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS etiquetage_correct BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS montant_asdi NUMERIC(15,2) DEFAULT 0;

-- 2. Table lignes_reception_fournisseur: Ajout colonnes complètes pour traçabilité
ALTER TABLE lignes_reception_fournisseur
ADD COLUMN IF NOT EXISTS quantite_commandee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantite_acceptee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_lot TEXT,
ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'conforme',
ADD COLUMN IF NOT EXISTS commentaire TEXT,
ADD COLUMN IF NOT EXISTS emplacement TEXT,
ADD COLUMN IF NOT EXISTS categorie_tarification_id UUID REFERENCES categorie_tarification(id);

-- 3. Table lots: Ajout categorie_tarification_id
ALTER TABLE lots
ADD COLUMN IF NOT EXISTS categorie_tarification_id UUID REFERENCES categorie_tarification(id);

-- 4. Index pour performances
CREATE INDEX IF NOT EXISTS idx_lignes_reception_categorie_tarification 
ON lignes_reception_fournisseur(categorie_tarification_id);

CREATE INDEX IF NOT EXISTS idx_lots_categorie_tarification 
ON lots(categorie_tarification_id);

-- 5. Mettre à jour le trigger des lots pour utiliser la catégorie du lot si disponible
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
  v_categorie_id UUID;
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
    RETURN NEW;
  END IF;

  -- Utiliser le prix d'achat spécifique du lot si différent
  v_prix_achat := COALESCE(NEW.prix_achat_unitaire, product_record.product_prix_achat);

  -- AMÉLIORATION: Utiliser la catégorie du lot si disponible, sinon celle du produit
  v_categorie_id := COALESCE(NEW.categorie_tarification_id, product_record.categorie_tarification_id);

  -- Si le lot a un prix d'achat et une catégorie disponible, calculer le prix
  IF v_prix_achat > 0 AND v_categorie_id IS NOT NULL THEN
    -- Récupérer les paramètres de la catégorie
    SELECT 
      coefficient_prix_vente,
      taux_tva,
      taux_centime_additionnel
    INTO category_record
    FROM categorie_tarification
    WHERE id = v_categorie_id
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

-- Commentaires pour documentation
COMMENT ON COLUMN receptions_fournisseurs.emballage_conforme IS 'Contrôle qualité: emballage en bon état';
COMMENT ON COLUMN receptions_fournisseurs.temperature_respectee IS 'Contrôle qualité: chaîne du froid respectée';
COMMENT ON COLUMN receptions_fournisseurs.etiquetage_correct IS 'Contrôle qualité: étiquetage conforme';
COMMENT ON COLUMN receptions_fournisseurs.montant_asdi IS 'Acompte Sur Divers Impôts (ASDI)';
COMMENT ON COLUMN lignes_reception_fournisseur.categorie_tarification_id IS 'Catégorie de tarification pour cette ligne';
COMMENT ON COLUMN lots.categorie_tarification_id IS 'Catégorie de tarification appliquée au lot';
-- ============================================================
-- MIGRATION: Ajout des colonnes de prix détaillés à la table lots
-- et nettoyage des lots sans catégorie de tarification
-- ============================================================

-- Étape 1: Ajouter les nouvelles colonnes de prix si elles n'existent pas
ALTER TABLE public.lots 
ADD COLUMN IF NOT EXISTS prix_vente_ht NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_tva NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS taux_centime_additionnel NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_centime_additionnel NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prix_vente_ttc NUMERIC(15,2);

-- Étape 2: Créer un index sur categorie_tarification_id pour les performances
CREATE INDEX IF NOT EXISTS idx_lots_categorie_tarification ON public.lots(categorie_tarification_id);

-- Étape 3: Créer un index pour la recherche FIFO (date réception + péremption)
CREATE INDEX IF NOT EXISTS idx_lots_fifo_search ON public.lots(produit_id, date_reception, date_peremption) 
WHERE quantite_restante > 0;

-- Étape 4: Supprimer les lots sans catégorie de tarification
-- (Après discussion avec l'utilisateur)
DELETE FROM public.lots WHERE categorie_tarification_id IS NULL;

-- Étape 5: Ajouter un commentaire sur la table pour documenter
COMMENT ON TABLE public.lots IS 'Table des lots de produits avec prix calculés à la réception. Les prix de vente proviennent de cette table, pas de la table produits.';

COMMENT ON COLUMN public.lots.prix_achat_unitaire IS 'Prix d''achat unitaire du lot - BASE pour tous les calculs de prix de vente';
COMMENT ON COLUMN public.lots.prix_vente_ht IS 'Prix HT = prix_achat_unitaire × coefficient_catégorie';
COMMENT ON COLUMN public.lots.taux_tva IS 'Taux TVA appliqué (provient de la catégorie de tarification)';
COMMENT ON COLUMN public.lots.montant_tva IS 'Montant TVA = prix_vente_ht × (taux_tva / 100)';
COMMENT ON COLUMN public.lots.taux_centime_additionnel IS 'Taux centime additionnel (provient de la catégorie)';
COMMENT ON COLUMN public.lots.montant_centime_additionnel IS 'Montant centime = montant_tva × (taux_centime / 100)';
COMMENT ON COLUMN public.lots.prix_vente_ttc IS 'Prix TTC final arrondi selon précision configurée';
COMMENT ON COLUMN public.lots.prix_vente_suggere IS 'Alias de prix_vente_ttc pour compatibilité';
-- Phase 3: Supprimer la colonne physique stock_actuel et ses dépendances
-- Maintenant que la vue produits_with_stock calcule automatiquement le stock,
-- la colonne physique n'est plus nécessaire et crée un risque de désynchronisation

-- 1. Supprimer les triggers liés à stock_actuel (s'ils existent)
DROP TRIGGER IF EXISTS trigger_update_stock_actuel ON produits;
DROP TRIGGER IF EXISTS trigger_update_stock_actuel_timestamp ON produits;
DROP TRIGGER IF EXISTS trigger_sync_stock_actuel ON produits;

-- 2. Supprimer les fonctions de trigger associées (s'ils existent)
DROP FUNCTION IF EXISTS update_stock_actuel() CASCADE;
DROP FUNCTION IF EXISTS sync_stock_actuel() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_stock_actuel_timestamp() CASCADE;

-- 3. Supprimer les index sur stock_actuel (s'ils existent)
DROP INDEX IF EXISTS idx_produits_stock_actuel;
DROP INDEX IF EXISTS idx_stock_actuel;

-- 4. Supprimer la colonne stock_actuel avec CASCADE pour supprimer les vues dépendantes
ALTER TABLE produits DROP COLUMN IF EXISTS stock_actuel CASCADE;

-- 5. Recréer la vue v_produits_with_famille si elle existait (sans stock_actuel)
-- Cette vue sera maintenant basée sur produits_with_stock pour avoir stock_actuel calculé
CREATE OR REPLACE VIEW v_produits_with_famille AS
SELECT 
  p.*,
  f.libelle_famille
FROM produits_with_stock p
LEFT JOIN famille_produit f ON f.id = p.famille_id;

-- Accorder les permissions
GRANT SELECT ON v_produits_with_famille TO authenticated;

-- Documentation
COMMENT ON VIEW produits_with_stock IS 'Vue qui calcule automatiquement stock_actuel à partir des lots. Cette vue remplace définitivement la colonne stock_actuel qui a été supprimée de la table produits pour garantir la cohérence des données (source unique de vérité: lots.quantite_restante).';

COMMENT ON VIEW v_produits_with_famille IS 'Vue enrichie des produits avec les informations de famille. Utilise produits_with_stock pour obtenir stock_actuel calculé dynamiquement.';
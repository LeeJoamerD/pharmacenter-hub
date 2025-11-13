-- Supprimer le trigger et la fonction qui référencent stock_actuel
-- Cette colonne n'existe plus dans la table produits, le stock est calculé dynamiquement depuis les lots

-- Supprimer le trigger
DROP TRIGGER IF EXISTS trigger_update_product_stock_actuel ON lots;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS update_product_stock_actuel();

-- Supprimer la colonne stock_actuel si elle existe encore
ALTER TABLE public.produits DROP COLUMN IF EXISTS stock_actuel;

-- Supprimer l'index associé si il existe
DROP INDEX IF EXISTS idx_produits_stock_actuel;
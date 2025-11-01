-- Ajouter la colonne stock_actuel manquante à la table produits
-- Cette colonne est nécessaire pour l'analyse ABC et d'autres modules de stock

ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS stock_actuel INTEGER DEFAULT 0;

-- Créer un index pour optimiser les requêtes sur le stock
CREATE INDEX IF NOT EXISTS idx_produits_stock_actuel 
ON public.produits(tenant_id, stock_actuel);

-- Créer une fonction pour mettre à jour automatiquement le stock_actuel depuis les lots
CREATE OR REPLACE FUNCTION update_product_stock_actuel()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE produits
  SET stock_actuel = (
    SELECT COALESCE(SUM(quantite_restante), 0)
    FROM lots
    WHERE lots.produit_id = COALESCE(NEW.produit_id, OLD.produit_id)
    AND lots.tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
  )
  WHERE id = COALESCE(NEW.produit_id, OLD.produit_id)
  AND tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour maintenir le stock_actuel à jour
DROP TRIGGER IF EXISTS trigger_update_product_stock_actuel ON lots;
CREATE TRIGGER trigger_update_product_stock_actuel
AFTER INSERT OR UPDATE OR DELETE ON lots
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_actuel();

-- Initialiser le stock_actuel pour tous les produits existants
UPDATE produits p
SET stock_actuel = (
  SELECT COALESCE(SUM(l.quantite_restante), 0)
  FROM lots l
  WHERE l.produit_id = p.id
  AND l.tenant_id = p.tenant_id
);
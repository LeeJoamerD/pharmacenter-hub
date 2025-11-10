-- Ajouter la colonne stock_critique pour le seuil de stock critique personnalisé
ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS stock_critique INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.produits.stock_critique IS 
'Seuil de stock critique personnalisé par produit (optionnel). Si NULL, utilise critical_stock_threshold de alert_settings. Priorité: valeur produit > paramètres utilisateur > défaut (2)';

-- Renommer stock_alerte en stock_faible pour clarifier la sémantique
ALTER TABLE public.produits 
RENAME COLUMN stock_alerte TO stock_faible;

COMMENT ON COLUMN public.produits.stock_faible IS 
'Seuil de stock faible personnalisé par produit (optionnel). Si NULL, utilise low_stock_threshold de alert_settings. Priorité: valeur produit > paramètres utilisateur > défaut (10)';

-- Mettre à jour le commentaire de stock_limite pour clarifier qu'il s'agit du seuil MAXIMUM
COMMENT ON COLUMN public.produits.stock_limite IS 
'Seuil de stock MAXIMUM pour détecter le surstock (optionnel). Si NULL, utilise maximum_stock_threshold de alert_settings. Priorité: valeur produit > paramètres utilisateur > défaut (100)';
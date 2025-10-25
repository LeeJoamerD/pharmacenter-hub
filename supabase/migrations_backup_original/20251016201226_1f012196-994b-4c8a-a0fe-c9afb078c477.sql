-- Ajouter le champ maximum_stock_threshold à alert_settings
ALTER TABLE public.alert_settings 
ADD COLUMN IF NOT EXISTS maximum_stock_threshold INTEGER DEFAULT 100;

COMMENT ON COLUMN public.alert_settings.maximum_stock_threshold IS 
'Seuil de stock maximum par défaut (unités) - utilisé quand stock_limite du produit n''est pas renseigné';
-- Ajouter les colonnes manquantes pour la traçabilité des lots dans lignes_ventes
ALTER TABLE lignes_ventes 
ADD COLUMN IF NOT EXISTS numero_lot TEXT,
ADD COLUMN IF NOT EXISTS date_peremption_lot DATE;

-- Commenter les nouvelles colonnes
COMMENT ON COLUMN lignes_ventes.numero_lot IS 'Numéro du lot au moment de la vente (traçabilité)';
COMMENT ON COLUMN lignes_ventes.date_peremption_lot IS 'Date de péremption du lot au moment de la vente';

-- Index pour les recherches par lot
CREATE INDEX IF NOT EXISTS idx_lignes_ventes_numero_lot 
ON lignes_ventes(numero_lot) WHERE numero_lot IS NOT NULL;
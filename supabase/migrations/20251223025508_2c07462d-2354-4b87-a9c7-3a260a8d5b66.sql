-- Migration: Ajouter le support du Centime Additionnel dans tva_declaration
-- Conforme à la réglementation fiscale de la République du Congo

-- Ajouter les colonnes Centime Additionnel à tva_declaration
ALTER TABLE tva_declaration
ADD COLUMN IF NOT EXISTS centime_additionnel_collecte NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS centime_additionnel_deductible NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS centime_additionnel_a_payer NUMERIC(15,2) DEFAULT 0;

-- Ajouter le taux de centime additionnel à parametres_regionaux_fiscaux si absent
ALTER TABLE parametres_regionaux_fiscaux
ADD COLUMN IF NOT EXISTS taux_centime_additionnel NUMERIC(5,3) DEFAULT 5.0;

-- Mettre à jour le taux par défaut pour Congo-Brazzaville (5%)
UPDATE parametres_regionaux_fiscaux
SET taux_centime_additionnel = 5.0
WHERE pays IN ('Congo-Brazzaville', 'CG') AND taux_centime_additionnel IS NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN tva_declaration.centime_additionnel_collecte IS 'Centime Additionnel collecté (5% sur TVA collectée - République du Congo)';
COMMENT ON COLUMN tva_declaration.centime_additionnel_deductible IS 'Centime Additionnel déductible (5% sur TVA déductible)';
COMMENT ON COLUMN tva_declaration.centime_additionnel_a_payer IS 'Centime Additionnel net à payer (collecté - déductible)';
COMMENT ON COLUMN parametres_regionaux_fiscaux.taux_centime_additionnel IS 'Taux du Centime Additionnel en % (ex: 5.0 pour 5%)';
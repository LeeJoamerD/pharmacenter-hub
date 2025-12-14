-- Insert default coefficients for existing cost centers and allocation keys
-- This enables immediate use of the "Calculer Répartition" feature

INSERT INTO coefficients_repartition (tenant_id, cle_repartition_id, centre_cout_id, valeur_base, coefficient, date_debut)
SELECT 
  cr.tenant_id,
  cr.id AS cle_repartition_id,
  cc.id AS centre_cout_id,
  100 AS valeur_base, -- Default weight
  1.0 AS coefficient, -- Default coefficient (will be recalculated)
  CURRENT_DATE AS date_debut
FROM cles_repartition cr
CROSS JOIN centres_couts cc
WHERE cr.tenant_id = cc.tenant_id
  AND cr.est_active = true
  AND cc.est_actif = true
  AND NOT EXISTS (
    SELECT 1 FROM coefficients_repartition coef 
    WHERE coef.cle_repartition_id = cr.id 
      AND coef.centre_cout_id = cc.id
  );

-- Vérification finale : s'assurer que toutes les colonnes requises existent
-- et ajuster si nécessaire

-- Vérifier la structure des prix (si centime_additionnel n'est pas calculé automatiquement)
-- Cela devrait être une valeur calculée, pas stockée

-- Assurer que la colonne centime_additionnel stocke bien la valeur calculée
UPDATE produits 
SET centime_additionnel = CASE 
    WHEN tva > 0 AND taux_centime_additionnel > 0 
    THEN ROUND((tva * taux_centime_additionnel / 100), 2)
    ELSE 0 
END
WHERE tenant_id IS NOT NULL;
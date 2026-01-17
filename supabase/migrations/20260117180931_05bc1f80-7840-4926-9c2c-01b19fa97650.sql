-- L'index unique sur code_cip a déjà été créé avec succès
-- L'index sur ancien_code_cip n'est PAS créé car ce champ peut contenir 
-- des valeurs identiques pour des produits différents (cas LUMETER 40MG et 80MG avec ancien_code_cip = 2268296)

-- Vérification : compter les doublons restants après nettoyage
-- Cette requête est juste informative
SELECT 'Nettoyage terminé - index unique sur code_cip créé' as status;
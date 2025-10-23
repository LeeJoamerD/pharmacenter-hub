-- Migration finale pour nettoyer les données de test
-- Suppression en respectant toutes les contraintes de clés étrangères

-- 1. Supprimer les données de ventes et encaissements
DELETE FROM lignes_ventes;
DELETE FROM encaissements;

-- 2. Supprimer les mouvements de caisse
DELETE FROM mouvements_caisse;

-- 3. Supprimer les données de commandes et réceptions
DELETE FROM lignes_reception_fournisseur;
DELETE FROM lignes_commande_fournisseur;
DELETE FROM commandes_fournisseurs;
DELETE FROM lots;
DELETE FROM inventaire_sessions;

-- 4. Supprimer les données comptables
DELETE FROM lignes_ecriture;
DELETE FROM ecritures_comptables;
DELETE FROM balances;
DELETE FROM immobilisations;
DELETE FROM exercices_comptables;
DELETE FROM journaux_comptables;
DELETE FROM compte_depenses;

-- 5. Supprimer les produits et références
DELETE FROM famille_produit;
DELETE FROM categorie_tarification;

-- 6. Supprimer les partenaires et clients
DELETE FROM clients;
DELETE FROM fournisseurs;
DELETE FROM laboratoires;
DELETE FROM conventionnes;
DELETE FROM assureurs;

-- 7. Supprimer les données de messagerie réseau
DELETE FROM network_messages;
DELETE FROM channel_participants;
DELETE FROM network_channels;

-- 8. Supprimer les permissions et alertes
DELETE FROM cross_tenant_permissions;
DELETE FROM security_alerts;
DELETE FROM incident_comments;

-- 9. Supprimer les logs et tentatives de connexion
DELETE FROM audit_logs;
DELETE FROM login_attempts;
DELETE FROM journaux_configuration;

-- 10. Supprimer les sessions utilisateur
DELETE FROM user_sessions;

-- 11. Supprimer les politiques de mots de passe (contrainte avec pharmacies)
DELETE FROM password_policies;

-- 12. Supprimer le personnel
DELETE FROM personnel;

-- 13. Supprimer les pharmacies
DELETE FROM pharmacies;

-- 14. Supprimer les utilisateurs d'authentification
DELETE FROM auth.users WHERE email IS NOT NULL;
-- Migration pour nettoyer les données de test
-- Suppression dans l'ordre pour respecter les contraintes de clés étrangères

-- 1. Supprimer les données de ventes et encaissements
DELETE FROM lignes_ventes;
DELETE FROM encaissements;
DELETE FROM ventes;

-- 2. Supprimer les mouvements de caisse et sessions
DELETE FROM mouvements_caisse;
DELETE FROM sessions_caisse;

-- 3. Supprimer les données de stock et inventaire
DELETE FROM lignes_reception_fournisseur;
DELETE FROM receptions_fournisseurs;
DELETE FROM lignes_commande_fournisseur;
DELETE FROM commandes_fournisseurs;
DELETE FROM lots;
DELETE FROM mouvements_stock;
DELETE FROM inventaire_sessions;

-- 4. Supprimer les données comptables
DELETE FROM lignes_ecriture;
DELETE FROM ecritures_comptables;
DELETE FROM balances;

-- 5. Supprimer les produits et références
DELETE FROM produits;
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

-- 10. Supprimer les sessions de pharmacie
DELETE FROM pharmacy_sessions;

-- 11. Supprimer le personnel (table actuellement vide mais au cas où)
DELETE FROM personnel;

-- 12. Supprimer les pharmacies
DELETE FROM pharmacies;

-- 13. Supprimer les utilisateurs d'authentification (ATTENTION: Ceci supprime tous les comptes utilisateurs)
-- Cette opération est irréversible et supprimera tous les comptes Google connectés
DELETE FROM auth.users WHERE email IS NOT NULL;

-- 14. Réinitialiser les paramètres par défaut si nécessaire
-- (Les paramètres système sont préservés car ils contiennent la configuration de base)
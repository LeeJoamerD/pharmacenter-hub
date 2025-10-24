-- =====================================================
-- RESET COMPLET: Suppression de toutes les tables
-- ⚠️ ATTENTION: Cette migration supprime TOUTES les données
-- =====================================================

-- Désactiver temporairement les triggers pour éviter les erreurs
SET session_replication_role = replica;

-- Supprimer toutes les tables existantes (ordre inverse des dépendances)
DROP TABLE IF EXISTS public.rapports_comptables CASCADE;
DROP TABLE IF EXISTS public.immobilisations CASCADE;
DROP TABLE IF EXISTS public.tva_declaration CASCADE;
DROP TABLE IF EXISTS public.balances CASCADE;
DROP TABLE IF EXISTS public.lignes_ecriture CASCADE;
DROP TABLE IF EXISTS public.ecritures_comptables CASCADE;
DROP TABLE IF EXISTS public.journaux_comptables CASCADE;
DROP TABLE IF EXISTS public.exercices_comptables CASCADE;
DROP TABLE IF EXISTS public.plan_comptable CASCADE;
DROP TABLE IF EXISTS public.mouvements_caisse CASCADE;
DROP TABLE IF EXISTS public.encaissements CASCADE;
DROP TABLE IF EXISTS public.sessions_caisse CASCADE;
DROP TABLE IF EXISTS public.lignes_ventes CASCADE;
DROP TABLE IF EXISTS public.ventes CASCADE;
DROP TABLE IF EXISTS public.suggestions_vente CASCADE;
DROP TABLE IF EXISTS public.inventaire_sessions CASCADE;
DROP TABLE IF EXISTS public.stock_mouvements CASCADE;
DROP TABLE IF EXISTS public.lignes_reception_fournisseur CASCADE;
DROP TABLE IF EXISTS public.receptions_fournisseurs CASCADE;
DROP TABLE IF EXISTS public.lignes_commande_fournisseur CASCADE;
DROP TABLE IF EXISTS public.commandes_fournisseurs CASCADE;
DROP TABLE IF EXISTS public.lots CASCADE;
DROP TABLE IF EXISTS public.produits CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.sous_compte_depenses CASCADE;
DROP TABLE IF EXISTS public.compte_depenses CASCADE;
DROP TABLE IF EXISTS public.fournisseurs CASCADE;
DROP TABLE IF EXISTS public.laboratoires CASCADE;
DROP TABLE IF EXISTS public.rayon_produit CASCADE;
DROP TABLE IF EXISTS public.famille_produit CASCADE;
DROP TABLE IF EXISTS public.categorie_tarification CASCADE;
DROP TABLE IF EXISTS public.pharmacy_presence CASCADE;
DROP TABLE IF EXISTS public.network_messages CASCADE;
DROP TABLE IF EXISTS public.channel_participants CASCADE;
DROP TABLE IF EXISTS public.network_channels CASCADE;
DROP TABLE IF EXISTS public.security_alerts CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.personnel CASCADE;
DROP TABLE IF EXISTS public.pharmacies CASCADE;
DROP TABLE IF EXISTS public.backup_logs CASCADE;
DROP TABLE IF EXISTS public.print_templates CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.report_schedules CASCADE;
DROP TABLE IF EXISTS public.report_templates CASCADE;

-- Supprimer tous les types ENUM
DROP TYPE IF EXISTS public.mode_paiement CASCADE;
DROP TYPE IF EXISTS public.statut_vente CASCADE;
DROP TYPE IF EXISTS public.type_vente CASCADE;
DROP TYPE IF EXISTS public.statut_client CASCADE;
DROP TYPE IF EXISTS public.type_client CASCADE;
DROP TYPE IF EXISTS public.statut_contractuel CASCADE;
DROP TYPE IF EXISTS public.situation_familiale CASCADE;

-- Supprimer toutes les fonctions
DROP FUNCTION IF EXISTS public.generate_sales_suggestions(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.detect_cross_tenant_attempt() CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_trail() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_suggestions_vente_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_low_stock_metrics_v2(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_low_stock_metrics(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_low_stock_products(UUID, TEXT, UUID, TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.generate_inventaire_report(UUID, TEXT, UUID) CASCADE;

-- Réactiver les triggers
SET session_replication_role = DEFAULT;

-- Confirmation
SELECT 'Base de données nettoyée avec succès. Prêt pour la recréation.' as status;
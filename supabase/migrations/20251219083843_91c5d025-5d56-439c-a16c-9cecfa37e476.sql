-- Ajouter la permission "Encaisser les ventes" pour le mode séparé vente/caisse
INSERT INTO permissions (code_permission, nom_permission, description, categorie, is_system)
VALUES ('sales.cashier', 'Encaisser les ventes', 'Permet d''encaisser les transactions de vente en mode séparé', 'sales', true)
ON CONFLICT (code_permission) DO NOTHING;
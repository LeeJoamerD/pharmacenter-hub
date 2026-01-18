-- ======================================
-- Corrections SYSCOHADA Révisé 2025
-- Conformité République du Congo
-- Plan comptable: 8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4
-- ======================================

-- 1. Renommer compte 81 en V.C.E.I.
UPDATE comptes_globaux 
SET libelle_compte = 'V.C.E.I. (VALEUR COMPTABLE DES ELEMENTS D''ACTIF CEDES)',
    updated_at = now()
WHERE numero_compte = '81' 
  AND plan_comptable_id = '8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4';

-- 2. Renommer compte 82 en P.C.E.I.
UPDATE comptes_globaux 
SET libelle_compte = 'P.C.E.I. (PRODUITS DE CESSION DES ELEMENTS D''ACTIF)',
    updated_at = now()
WHERE numero_compte = '82' 
  AND plan_comptable_id = '8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4';

-- 3. Adapter compte 572 pour Mobile Money (contexte Congo)
UPDATE comptes_globaux 
SET libelle_compte = 'MONNAIE ELECTRONIQUE',
    updated_at = now()
WHERE numero_compte = '572' 
  AND plan_comptable_id = '8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4';

-- 4. Adapter sous-compte 5721 pour MTN Mobile Money
UPDATE comptes_globaux 
SET libelle_compte = 'MTN Mobile Money',
    updated_at = now()
WHERE numero_compte = '5721' 
  AND plan_comptable_id = '8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4';

-- 5. Adapter sous-compte 5722 pour Airtel Money
UPDATE comptes_globaux 
SET libelle_compte = 'Airtel Money',
    updated_at = now()
WHERE numero_compte = '5722' 
  AND plan_comptable_id = '8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4';

-- 6. Ajouter compte 358 - Autres services en cours (avec toutes les colonnes obligatoires)
INSERT INTO comptes_globaux (
  plan_comptable_id, 
  numero_compte, 
  libelle_compte, 
  classe,
  niveau, 
  type_compte,
  compte_parent_numero,
  is_active
)
SELECT 
  '8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 
  '358', 
  'AUTRES SERVICES EN COURS', 
  '3',
  2, 
  'Actif',
  '35',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM comptes_globaux 
  WHERE numero_compte = '358' 
    AND plan_comptable_id = '8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4'
);
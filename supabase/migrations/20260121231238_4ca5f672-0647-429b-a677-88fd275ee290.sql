-- Migration A: Create Journal ACH (Achats) and deductible tax accounts for tenant Pharmacie MAZAYU

-- 1. Create Journal des Achats (ACH) if not exists
INSERT INTO journaux_comptables (tenant_id, code_journal, libelle_journal, type_journal, is_active)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', 'ACH', 'Journal des Achats', 'Achats', true
WHERE NOT EXISTS (
  SELECT 1 FROM journaux_comptables 
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND code_journal = 'ACH'
);

-- 2. Create account 4467 - Centime Additionnel déductible sur achats
INSERT INTO plan_comptable (tenant_id, numero_compte, libelle_compte, type_compte, classe, nature_compte, is_active, niveau)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', '4467', 'Centime additionnel déductible sur achats', 'detail', 4, 'Passif', true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM plan_comptable 
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND numero_compte = '4467'
);

-- 3. Create account 4468 - ASDI déductible sur achats  
INSERT INTO plan_comptable (tenant_id, numero_compte, libelle_compte, type_compte, classe, nature_compte, is_active, niveau)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', '4468', 'ASDI déductible sur achats', 'detail', 4, 'Passif', true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM plan_comptable 
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND numero_compte = '4468'
);

-- 4. Verify account 6011 exists (Achats de marchandises détail)
INSERT INTO plan_comptable (tenant_id, numero_compte, libelle_compte, type_compte, classe, nature_compte, is_active, niveau)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', '6011', 'Achats de marchandises', 'detail', 6, 'Charge', true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM plan_comptable 
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND numero_compte = '6011'
);

-- 5. Verify account 4011 exists (Fournisseurs détail)
INSERT INTO plan_comptable (tenant_id, numero_compte, libelle_compte, type_compte, classe, nature_compte, is_active, niveau)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', '4011', 'Fournisseurs', 'detail', 4, 'Passif', true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM plan_comptable 
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND numero_compte = '4011'
);

# Plan d'implémentation - Comptes et Journaux Globaux SYSCOHADA

## Objectifs
1. Ajouter les 3 comptes manquants (4461, 4467, 4468) au plan SYSCOHADA Révisé global
2. Créer une table `journaux_comptables_globaux` pour stocker les journaux de référence par plan
3. Modifier la fonction RPC `import_global_accounting_plan` pour importer automatiquement les journaux

---

## Analyse des données

### Comptes manquants identifiés (présents chez MAZAYU mais pas dans le plan global)
| Numéro | Libellé | Classe | Niveau |
|--------|---------|--------|--------|
| 4461 | Centime additionnel sur chiffre d'affaires | 4 | 4 (detail) |
| 4467 | Centime additionnel déductible sur achats | 4 | 4 (detail) |
| 4468 | ASDI déductible sur achats | 4 | 4 (detail) |

### Journaux standards à intégrer (basés sur la pharmacie de référence)
| Code | Libellé | Type |
|------|---------|------|
| VT | Journal des Ventes | Ventes |
| AC | Journal des Achats | Achats |
| BQ | Journal de Banque | Banque |
| CA | Journal de Caisse | Caisse |
| OD | Journal des Opérations Diverses | Operations_Diverses |

---

## Modifications requises

### 1. Migration SQL - Créer la table `journaux_comptables_globaux`

Nouvelle table pour stocker les journaux de référence par plan comptable global :

```text
Table: journaux_comptables_globaux
+-------------------+--------------+--------------------------------+
| Colonne           | Type         | Description                    |
+-------------------+--------------+--------------------------------+
| id                | UUID (PK)    | Identifiant unique             |
| plan_comptable_id | UUID (FK)    | Référence au plan global       |
| code_journal      | VARCHAR(10)  | Code (VT, AC, BQ, etc.)        |
| libelle_journal   | TEXT         | Nom complet du journal         |
| type_journal      | TEXT         | Type (Ventes, Achats, etc.)    |
| description       | TEXT         | Description optionnelle        |
| is_active         | BOOLEAN      | Statut actif                   |
| created_at        | TIMESTAMPTZ  | Date de création               |
+-------------------+--------------+--------------------------------+
```

### 2. Migration SQL - Ajouter les 3 comptes manquants

Insérer les comptes fiscaux spécifiques au Congo dans `comptes_globaux` :
- 4461 sous le compte parent 446 (État, impôts et taxes)
- 4467 sous le compte parent 446
- 4468 sous le compte parent 446

### 3. Migration SQL - Ajouter les journaux SYSCOHADA

Insérer les 5 journaux standards dans `journaux_comptables_globaux` liés au plan SYSCOHADA Révisé.

### 4. Modifier la fonction `import_global_accounting_plan`

Ajouter une section après l'import des comptes pour :
1. Supprimer les journaux existants du tenant (optionnel - selon stratégie)
2. Copier les journaux depuis `journaux_comptables_globaux` vers `journaux_comptables`
3. Retourner le nombre de journaux importés dans la réponse

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/[timestamp]_add_global_journals_and_accounts.sql` | Nouvelle migration SQL |

---

## Détails techniques de la migration SQL

### Section 1 : Créer la table journaux_comptables_globaux

```sql
CREATE TABLE IF NOT EXISTS public.journaux_comptables_globaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_comptable_id UUID NOT NULL REFERENCES plans_comptables_globaux(id) ON DELETE CASCADE,
  code_journal VARCHAR(10) NOT NULL,
  libelle_journal TEXT NOT NULL,
  type_journal TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_comptable_id, code_journal)
);

-- RLS policies pour platform admin
ALTER TABLE journaux_comptables_globaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage global journals"
  ON journaux_comptables_globaux FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_platform_admin = true
    )
  );

CREATE POLICY "Authenticated users can view global journals"
  ON journaux_comptables_globaux FOR SELECT
  TO authenticated
  USING (true);
```

### Section 2 : Ajouter les comptes manquants

```sql
INSERT INTO comptes_globaux (
  plan_comptable_id, numero_compte, libelle_compte, 
  classe, niveau, compte_parent_numero, type_compte, is_active
)
VALUES 
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', '4461', 'Centime additionnel sur chiffre d''affaires', 4, 4, '446', 'Compte fiscal', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', '4467', 'Centime additionnel déductible sur achats', 4, 4, '446', 'Compte fiscal', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', '4468', 'ASDI déductible sur achats', 4, 4, '446', 'Compte fiscal', true)
ON CONFLICT (plan_comptable_id, numero_compte) DO NOTHING;
```

### Section 3 : Ajouter les journaux SYSCOHADA

```sql
INSERT INTO journaux_comptables_globaux (
  plan_comptable_id, code_journal, libelle_journal, type_journal, is_active
)
VALUES 
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'VT', 'Journal des Ventes', 'Ventes', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'AC', 'Journal des Achats', 'Achats', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'BQ', 'Journal de Banque', 'Banque', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'CA', 'Journal de Caisse', 'Caisse', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'OD', 'Journal des Opérations Diverses', 'Operations_Diverses', true)
ON CONFLICT (plan_comptable_id, code_journal) DO NOTHING;
```

### Section 4 : Mettre à jour la fonction d'import

Ajouter après l'insertion des comptes :

```sql
-- Supprimer les journaux existants du tenant (optionnel - conserver les personnalisés)
DELETE FROM journaux_comptables 
WHERE tenant_id = p_tenant_id 
AND code_journal IN (SELECT code_journal FROM journaux_comptables_globaux WHERE plan_comptable_id = p_plan_global_id);

-- Insérer les journaux depuis le référentiel global
INSERT INTO journaux_comptables (
  tenant_id, code_journal, libelle_journal, type_journal, 
  is_active, auto_generation, sequence_courante
)
SELECT 
  p_tenant_id,
  jcg.code_journal,
  jcg.libelle_journal,
  jcg.type_journal,
  jcg.is_active,
  false,
  1
FROM journaux_comptables_globaux jcg
WHERE jcg.plan_comptable_id = p_plan_global_id
ON CONFLICT (tenant_id, code_journal) DO UPDATE SET
  libelle_journal = EXCLUDED.libelle_journal,
  type_journal = EXCLUDED.type_journal,
  is_active = EXCLUDED.is_active;
```

---

## Résultat attendu

| Action | Avant | Après |
|--------|-------|-------|
| Comptes dans SYSCOHADA global | 1421 | 1424 |
| Journaux globaux SYSCOHADA | 0 | 5 |
| Import plan pour nouveau tenant | Comptes uniquement | Comptes + Journaux |

---

## Points d'attention

1. **Contrainte d'unicité** : Vérifier que la table `journaux_comptables` a une contrainte UNIQUE sur `(tenant_id, code_journal)` - sinon l'ajouter
2. **Rétrocompatibilité** : Les tenants existants ne seront pas impactés - seuls les nouveaux imports recevront les journaux
3. **Extensibilité** : Cette structure permet d'ajouter des journaux spécifiques à d'autres plans (PCG France, etc.)

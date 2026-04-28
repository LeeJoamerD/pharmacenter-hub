## Diagnostic

Tu m'as demandé de vérifier si `clone_tenant_referential('102232f2-…HOPE','2f7365aa-…Tests')` a fonctionné. **Réponse : non, pas correctement.**

État actuel après ton exécution :

| Table | Source (HOPE) | Cible (Tests) | Verdict |
|---|---|---|---|
| produits | 2 987 | **7 943** | ❌ cible plus volumineuse que la source |
| lots | 4 907 | **0** | ❌ aucun lot cloné |
| famille_produit | 45 | 72 | ❌ fusion, pas remplacement |
| classes_therapeutiques | 44 | 45 | ❌ idem |
| laboratoires | 846 | 892 | ❌ idem |

### Cause

1. Le script de nettoyage exécuté précédemment (#7549/v3) ne supprime que **stock + ventes + retours + commandes**. Il **ne touche pas au référentiel** (produits, familles, labos, DCI, classes, formes, rayons, catégories). Donc les 7 943 produits déjà présents dans Tests sont restés.
2. `clone_tenant_referential` utilise partout `ON CONFLICT DO NOTHING` → il **ajoute uniquement ce qui manque**, sans remplacer. Résultat : fusion sale.
3. `clone_tenant_referential` **ne clone pas les lots** (c'est le rôle de `clone_tenant_lots`, fonction qui existe bien dans la base). Il faut la lancer dans un second temps.

Aucune erreur SQL n'a été levée — la fonction a "réussi" techniquement mais le résultat ne correspond pas à ton besoin (cloner = obtenir l'identique).

## Action proposée

### Étape 1 — Script SQL de nettoyage du référentiel de Pharmacie Tests

Bloc `DO $$ ... $$` transactionnel, ordre respectant les FK :

```text
produits_dci (filtré par produit.tenant_id)
→ produits (tenant_id)              -- supprime les 7 943 produits
→ formes_galeniques (tenant_id)
→ famille_produit (tenant_id)
→ rayons_produits (tenant_id)
→ categorie_tarification (tenant_id)
→ dci (tenant_id)
→ classes_therapeutiques (tenant_id)
→ laboratoires (tenant_id)
```

Avec `RAISE NOTICE` du nombre de lignes supprimées par étape. Si une FK inattendue bloque (ex. `lignes_…` orphelines pointant vers un produit), je l'identifierai à partir du message d'erreur et adapterai.

### Étape 2 — Relancer le clonage du référentiel

```sql
SELECT clone_tenant_referential(
  '102232f2-6a8c-4555-b288-4c1f118a81a0',  -- HOPE
  '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'   -- Tests
);
```

Comme la cible sera vide, les `ON CONFLICT DO NOTHING` deviennent inoffensifs et la copie sera fidèle (2 987 produits, 45 familles, 846 labos, etc.).

### Étape 3 — Cloner les lots

```sql
SELECT clone_tenant_lots(
  '102232f2-6a8c-4555-b288-4c1f118a81a0',  -- HOPE
  '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'   -- Tests
);
```

### Étape 4 — Vérification finale

Requête de comptage produits/lots/familles/labos source vs cible. Les nombres doivent correspondre (au mapping près pour les déduplications).

## Livrable

Une fois approuvé, je te poste **dans le chat** :
1. Le script SQL de nettoyage du référentiel à coller dans le SQL Editor.
2. Les deux appels `SELECT clone_tenant_…(...)` à exécuter ensuite.
3. La requête de vérification finale.

Aucune modification du codebase. Aucune migration de schéma.

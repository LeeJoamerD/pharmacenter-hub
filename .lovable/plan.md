

# Export des produits Pharmacie Hope absents du catalogue global

## Résumé
Générer un fichier CSV téléchargeable contenant les 1 115 produits de Pharmacie Hope dont le code CIP ou l'ancien code CIP est absent du catalogue global.

## Exécution
Utiliser `psql` pour exporter directement en CSV :

```sql
COPY (
  SELECT 
    p.libelle_produit AS "Libellé Produit",
    p.code_cip AS "Code CIP",
    p.ancien_code_cip AS "Ancien Code CIP",
    p.code_barre_externe AS "Code Barre",
    p.prix_achat AS "Prix Achat",
    p.prix_vente_ttc AS "Prix Vente TTC",
    CASE WHEN p.code_cip IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = p.code_cip
    ) THEN 'Oui' ELSE 'Non' END AS "CIP Absent du Global",
    CASE WHEN p.ancien_code_cip IS NOT NULL AND p.ancien_code_cip != '' AND NOT EXISTS (
      SELECT 1 FROM catalogue_global_produits g WHERE g.ancien_code_cip = p.ancien_code_cip
    ) THEN 'Oui' ELSE 'Non' END AS "Ancien CIP Absent du Global"
  FROM produits p
  WHERE p.tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND (
    (p.code_cip IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = p.code_cip
    ))
    OR
    (p.ancien_code_cip IS NOT NULL AND p.ancien_code_cip != '' AND NOT EXISTS (
      SELECT 1 FROM catalogue_global_produits g WHERE g.ancien_code_cip = p.ancien_code_cip
    ))
  )
  ORDER BY p.libelle_produit
) TO STDOUT WITH CSV HEADER
```

Le fichier sera sauvegardé dans `/mnt/documents/Pharmacie_Hope_Produits_Absents_Catalogue_Global.csv`.

## Colonnes du fichier

| Colonne | Description |
|---|---|
| Libellé Produit | Nom du produit |
| Code CIP | Code CIP actuel |
| Ancien Code CIP | Ancien code CIP (souvent un nom de rayon par erreur) |
| Code Barre | Code barre externe |
| Prix Achat | Prix d'achat |
| Prix Vente TTC | Prix de vente TTC |
| CIP Absent du Global | Oui/Non - le code CIP n'existe pas dans le catalogue global |
| Ancien CIP Absent du Global | Oui/Non - l'ancien code CIP n'existe pas dans le catalogue global |

## Résultat
Un fichier CSV téléchargeable avec ~1 115 lignes, trié par nom de produit.


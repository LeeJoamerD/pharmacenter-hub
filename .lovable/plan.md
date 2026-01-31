
# Plan : Import Excel depuis le Catalogue Global (Prix Pointe-Noire)

## ✅ IMPLÉMENTÉ

**Statut**: Terminé le 2026-01-31

## Résumé

Nouveau bouton **"Importer depuis le Catalogue"** qui permet d'importer un fichier Excel simplifié contenant uniquement :
- Code CIP
- Quantité  
- Date de péremption

Le système enrichit automatiquement les données en recherchant les produits dans le **catalogue global** par Code CIP, en utilisant les **prix de référence Pointe-Noire** (`prix_achat_reference_pnr`).

## Structure du Fichier Excel Attendu

| Colonne | Champ | Utilisation |
|---------|-------|-------------|
| A | Libellé | Informatif (non utilisé pour le matching) |
| B | Code CIP | Clé de recherche dans le catalogue global |
| C | Date Péremption | Copié directement vers dateExpiration |
| D | Quantité | Copié vers quantiteRecue et quantiteAcceptee |

## Prix Utilisés (Pointe-Noire)

| Colonne DB | Description | Utilisée |
|------------|-------------|----------|
| `prix_achat_reference` | Prix d'achat Brazzaville | NON |
| `prix_achat_reference_pnr` | Prix d'achat Pointe-Noire | **OUI** |

## Fichiers Modifiés

| Fichier | Changement |
|---------|------------|
| `src/types/excelImport.ts` | Types `CatalogImportLine`, `CatalogParseResult` |
| `src/services/ExcelParserService.ts` | Méthode `parseCatalogImportFile()` |
| `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx` | Bouton + handler avec `prix_achat_reference_pnr` |

## Fonctionnalités

1. **Chunking** pour gérer >1000 lignes (lots de 200)
2. **Recherche fallback** : code_cip → ancien_code_cip
3. **Prix Pointe-Noire** : utilise `prix_achat_reference_pnr`
4. **Même flux final** : validation, édition, création commande, réception

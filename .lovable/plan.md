
# Plan : Import Excel depuis le Catalogue Global (Prix Pointe-Noire)

## Résumé

Ajouter un nouveau bouton **"Importer depuis le Catalogue"** qui permet d'importer un fichier Excel simplifié contenant uniquement :
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

## Colonnes de Prix dans le Catalogue Global

| Colonne | Description | Utilisée |
|---------|-------------|----------|
| `prix_achat_reference` | Prix d'achat Brazzaville | NON |
| `prix_vente_reference` | Prix de vente Brazzaville | NON |
| `prix_achat_reference_pnr` | Prix d'achat Pointe-Noire | **OUI** |
| `prix_vente_reference_pnr` | Prix de vente Pointe-Noire | NON (calculé via catégorie) |

## Flux de Traitement

```text
1. Utilisateur clique sur "Importer depuis le Catalogue"
   └─→ Sélection fichier Excel

2. Parsing du fichier (4 colonnes fixes : A, B, C, D)
   └─→ Extraction : libellé, code_cip, date_peremption, quantite

3. Recherche groupée dans catalogue_global_produits
   └─→ Par chunks de 200 codes (gestion >1000 lignes)
   └─→ Recherche code_cip puis ancien_code_cip

4. Enrichissement des données avec PRIX POINTE-NOIRE
   └─→ libelle_produit depuis catalogue
   └─→ libelle_categorie_tarification depuis catalogue  
   └─→ prix_achat_reference_pnr depuis catalogue (PAS prix_achat_reference)

5. Construction des ExcelReceptionLine
   └─→ Même format que l'import fournisseur

6. Validation automatique → Affichage tableau
   └─→ Même flux que l'import existant
```

## Fichiers à Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx` | MODIFIER | Ajouter bouton + handler + input file |
| `src/services/ExcelParserService.ts` | MODIFIER | Ajouter méthode `parseCatalogImportFile()` |
| `src/types/excelImport.ts` | MODIFIER | Ajouter nouveaux types |

## Détails Techniques

### 1. Nouveau Bouton (ReceptionExcelImport.tsx)

Position : À côté du bouton "Importer depuis le Site du Fournisseur"

```typescript
{/* Bouton Import depuis Catalogue */}
<Button
  variant="outline"
  onClick={() => catalogFileInputRef.current?.click()}
  disabled={catalogImporting}
  className="w-full md:w-auto"
>
  {catalogImporting ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Import en cours...
    </>
  ) : (
    <>
      <FileUp className="h-4 w-4 mr-2" />
      Importer depuis le Catalogue
    </>
  )}
</Button>

<input
  ref={catalogFileInputRef}
  type="file"
  accept=".xlsx,.xls,.csv"
  onChange={handleCatalogFileChange}
  className="hidden"
/>
```

### 2. Handler avec Prix Pointe-Noire

```typescript
const handleCatalogFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // ... parsing et recherche ...
  
  for (const rawLine of parseResult.lines) {
    const globalProduct = globalProductsMap.get(rawLine.codeCip);
    
    if (!globalProduct) {
      // Erreur: produit non trouvé
      continue;
    }
    
    // UTILISATION DES PRIX POINTE-NOIRE
    const prixAchat = globalProduct.prix_achat_reference_pnr || 0;
    
    enrichedLines.push({
      reference: globalProduct.code_cip,
      produit: globalProduct.libelle_produit,
      quantiteCommandee: rawLine.quantite,
      quantiteRecue: rawLine.quantite,
      quantiteAcceptee: rawLine.quantite,
      prixAchatReel: prixAchat,  // <-- Prix Pointe-Noire
      numeroLot: '',
      dateExpiration: rawLine.datePeremption,
      statut: 'conforme',
      rowNumber: rawLine.rowNumber,
    });
  }
};
```

### 3. Recherche Groupée avec Chunking (Gestion >1000 lignes)

```typescript
const searchGlobalCatalogBatch = async (codes: string[]): Promise<Map<string, GlobalCatalogProduct>> => {
  const CHUNK_SIZE = 200;
  const chunks = chunkArray(codes, CHUNK_SIZE);
  const resultsMap = new Map<string, GlobalCatalogProduct>();
  
  // Recherche par code_cip
  for (const chunk of chunks) {
    const { data } = await supabase
      .from('catalogue_global_produits')
      .select(`
        id,
        code_cip,
        ancien_code_cip,
        libelle_produit,
        libelle_categorie_tarification,
        prix_achat_reference_pnr,
        prix_vente_reference_pnr
      `)
      .in('code_cip', chunk);
    
    data?.forEach(p => resultsMap.set(p.code_cip, p));
  }
  
  // Recherche des non-trouvés par ancien_code_cip
  const notFound = codes.filter(c => !resultsMap.has(c));
  if (notFound.length > 0) {
    const notFoundChunks = chunkArray(notFound, CHUNK_SIZE);
    for (const chunk of notFoundChunks) {
      const { data } = await supabase
        .from('catalogue_global_produits')
        .select(`...`)
        .in('ancien_code_cip', chunk);
      
      data?.forEach(p => {
        if (p.ancien_code_cip) {
          resultsMap.set(p.ancien_code_cip, p);
        }
      });
    }
  }
  
  return resultsMap;
};
```

### 4. Nouvelle Méthode de Parsing (ExcelParserService.ts)

```typescript
interface CatalogImportLine {
  libelle: string;
  codeCip: string;
  datePeremption: string;
  quantite: number;
  rowNumber: number;
}

static async parseCatalogImportFile(file: File): Promise<CatalogParseResult> {
  // Colonnes fixes : A=Libellé, B=Code CIP, C=Date Péremption, D=Quantité
  const COL_LIBELLE = 0;
  const COL_CODE_CIP = 1;
  const COL_DATE_PEREMPTION = 2;
  const COL_QUANTITE = 3;
  
  // Parsing avec gestion des codes CIP au format scientifique
  // et validation des quantités > 0
}
```

## Interface Utilisateur

```text
┌─────────────────────────────────────────────────────────────┐
│  Notes / Observations                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Remarques sur la réception...                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────┐  ┌────────────────────┐   │
│  │ Importer depuis le Site      │  │ Importer depuis    │   │
│  │ du Fournisseur               │  │ le Catalogue       │   │ ← NOUVEAU
│  └──────────────────────────────┘  └────────────────────┘   │
│                                                             │
│  Fichier Excel                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Glissez votre fichier Excel ici ou cliquez...        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Différences avec l'Import Fournisseur

| Aspect | Import Fournisseur | Import Catalogue |
|--------|-------------------|------------------|
| Mapping colonnes | Configurable par fournisseur | Fixe (A, B, C, D) |
| Source de données | Fichier Excel du fournisseur | Catalogue global |
| Prix d'achat | Depuis fichier Excel | `prix_achat_reference_pnr` (Pointe-Noire) |
| Enrichissement | Catalogue local tenant | Catalogue global |

## Gestion des Erreurs

| Cas | Message |
|-----|---------|
| Produit non trouvé | "Produit non trouvé dans le catalogue global: {code}" |
| Prix PNR = 0 ou null | Warning "Prix Pointe-Noire non renseigné, utilisez 0" |
| Quantité ≤ 0 | "Quantité doit être supérieure à 0" |
| Code CIP manquant | "Code CIP manquant" |

## Résumé des Modifications

| Fichier | Changement |
|---------|------------|
| `ReceptionExcelImport.tsx` | Bouton + états + handler avec `prix_achat_reference_pnr` |
| `ExcelParserService.ts` | Nouvelle méthode `parseCatalogImportFile()` |
| `excelImport.ts` | Nouveaux types `CatalogImportLine`, `CatalogParseResult` |

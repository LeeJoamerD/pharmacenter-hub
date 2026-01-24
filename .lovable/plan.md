

# Plan de correction - Affichage des informations sur les étiquettes

## Problèmes identifiés

### Problème 1 : DCI, Lot et Date d'expiration absents
La fonction `getLabelsData()` dans `useLabelPrinting.ts` ne transmet pas les champs `date_peremption` et `numero_lot` aux données d'étiquettes :

```typescript
// Code actuel (ligne 172-181)
.map(product => ({
  id: product.id,
  nom: product.libelle_produit,
  ...
  dci: product.dci_nom || null,
  pharmacyName,
  supplierPrefix: ...
  // date_peremption MANQUANT
  // numero_lot MANQUANT
}));
```

### Problème 2 : Données de lot/péremption non disponibles
Les produits du catalogue (`produits`) ne contiennent pas de lot/date d'expiration directement. Ces informations sont dans la table `stock` (lots en stock). Pour le moment, le système ne peut pas afficher ces infos car elles ne sont pas récupérées.

### Problème 3 : Affichage pharmacie/fournisseur incorrect
Sur la capture, on voit "DJL - Computer Sc..." qui semble être le nom de pharmacie tronqué, mais le formatage n'est pas celui attendu : "PHARMACIE [LAB]".

---

## Solution proposée

### Fichier 1 : `src/hooks/useLabelPrinting.ts`

**Modification 1 : Étendre l'interface `ProductForLabel`**
Ajouter les champs `date_peremption` et `numero_lot` à l'interface.

**Modification 2 : Récupérer les infos de stock**
Faire une jointure avec la table `stock` pour récupérer le premier lot disponible (le plus proche de l'expiration) pour chaque produit.

**Modification 3 : Transmettre les champs manquants dans `getLabelsData()`**
```typescript
.map(product => ({
  ...
  date_peremption: product.date_peremption || null,
  numero_lot: product.numero_lot || null,
}));
```

### Fichier 2 : `src/utils/labelPrinterEnhanced.ts`

**Vérification** : Le code de dessin des étiquettes (`drawLabel`) gère déjà correctement les conditions `config.includeDci`, `config.includeLot` et `config.includeExpiry`. Pas de modification nécessaire si les données sont correctement transmises.

---

## Détail technique des modifications

### Modification de l'interface ProductForLabel

```typescript
export interface ProductForLabel {
  id: string;
  libelle_produit: string;
  code_cip: string | null;
  code_barre_externe: string | null;
  prix_vente_ttc: number | null;
  dci_nom: string | null;
  laboratoire_libelle: string | null;
  // Nouveaux champs
  date_peremption: string | null;
  numero_lot: string | null;
}
```

### Modification de fetchProducts

Après avoir récupéré les produits, charger les informations de stock associées :

```typescript
// Récupérer les lots en stock pour chaque produit (lot le plus proche de l'expiration)
const { data: stockData } = await supabase
  .from('stock')
  .select('produit_id, numero_lot, date_peremption')
  .eq('tenant_id', tenantId)
  .gt('quantite_disponible', 0)
  .order('date_peremption', { ascending: true });

// Créer une map produit -> premier lot disponible
const stockMap = new Map<string, { numero_lot: string | null; date_peremption: string | null }>();
if (stockData) {
  stockData.forEach(s => {
    if (!stockMap.has(s.produit_id)) {
      stockMap.set(s.produit_id, {
        numero_lot: s.numero_lot,
        date_peremption: s.date_peremption
      });
    }
  });
}
```

### Modification du mapping des produits

```typescript
const productsWithNames: ProductForLabel[] = (data || []).map(product => {
  const stockInfo = stockMap.get(product.id);
  return {
    id: product.id,
    libelle_produit: product.libelle_produit,
    code_cip: product.code_cip,
    code_barre_externe: product.code_barre_externe,
    prix_vente_ttc: product.prix_vente_ttc,
    dci_nom: product.dci_id ? dciMap.get(product.dci_id) || null : null,
    laboratoire_libelle: product.laboratoires_id ? labMap.get(product.laboratoires_id) || null : null,
    // Ajouter les infos de stock
    date_peremption: stockInfo?.date_peremption || null,
    numero_lot: stockInfo?.numero_lot || null
  };
});
```

### Modification de getLabelsData

```typescript
.map(product => ({
  id: product.id,
  nom: product.libelle_produit,
  code_cip: product.code_cip,
  code_barre_externe: product.code_barre_externe,
  prix_vente: product.prix_vente_ttc || 0,
  dci: product.dci_nom || null,
  date_peremption: product.date_peremption || null,  // AJOUTÉ
  numero_lot: product.numero_lot || null,             // AJOUTÉ
  pharmacyName,
  supplierPrefix: product.laboratoire_libelle?.substring(0, 3).toUpperCase() || '---'
}));
```

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useLabelPrinting.ts` | Ajouter champs à l'interface, charger données stock, transmettre lot/expiration |

## Résultat attendu

Après cette correction :
- Le DCI s'affichera sous le nom du produit (si coché et disponible)
- Le numéro de lot s'affichera à droite du prix (si coché et disponible)
- La date d'expiration s'affichera en bas (si cochée et disponible)
- Le préfixe fournisseur [LAB] apparaîtra en haut à droite de l'étiquette
- Le nom de la pharmacie s'affichera en haut à gauche


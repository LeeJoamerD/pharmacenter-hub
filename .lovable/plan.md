
# Correction du Retour Stock Non Réintégré

## Diagnostic

Le stock n'est pas réintégré après validation du retour car **le `lot_id` n'est jamais enregistré dans `lignes_retours`**.

### Chaîne de Données Actuelle (DÉFAILLANTE)

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  VENTE ORIGINALE                                                                        │
│  lignes_ventes : produit_id, quantite, numero_lot = "20012601", date_peremption_lot     │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ searchOriginalTransaction() - LIGNE 198-204
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  RECHERCHE TRANSACTION                                                                  │
│  ❌ NE RÉCUPÈRE PAS numero_lot NI date_peremption_lot                                   │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ ReturnExchangeModal.tsx - LIGNE 113
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  CRÉATION RETOUR                                                                        │
│  ❌ lot_id: undefined (valeur fixe)                                                     │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ processReturnMutation - LIGNES 375-378
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  TRAITEMENT RETOUR                                                                      │
│  ❌ Filtre: l.lot_id existe => AUCUNE LIGNE NE PASSE                                    │
│  ❌ Stock non réintégré                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Données en Base

| Element | Valeur |
|---------|--------|
| Retour | `RET-20260203-0001` (statut: Approuvé) |
| Ligne retour lot_id | `NULL` ❌ |
| Vente originale | `POS-20260203-0001` |
| Ligne vente numero_lot | `20012601` ✅ |
| Lot correspondant | `8bea2565-f939-48fb-b9d4-04591305ad7b` |
| Stock actuel lot | 1 (devrait être 2 après retour) |

---

## Solution

### Fichier 1: `src/hooks/useReturnsExchanges.ts`

**Modification 1** - Ajouter `numero_lot` dans `searchOriginalTransaction` (ligne 198-204)

Ajouter les champs `numero_lot` et `date_peremption_lot` dans la requête pour que le modal puisse les transmettre.

```typescript
lignes_ventes(
  id,
  quantite,
  prix_unitaire_ttc,
  produit_id,
  numero_lot,           // ← AJOUTER
  date_peremption_lot,  // ← AJOUTER
  produit:produits(libelle_produit, code_cip)
)
```

---

### Fichier 2: `src/components/dashboard/modules/pos/ReturnExchangeModal.tsx`

**Modification 2** - Ajouter `lotNumber` dans l'interface `returnItems` (lignes 22-30)

```typescript
const [returnItems, setReturnItems] = useState<Array<{
  productId: string;
  productName: string;
  quantityReturned: number;
  maxQuantity: number;
  unitPrice: number;
  condition: 'Neuf' | 'Ouvert' | 'Défectueux';
  reason: string;
  lotNumber?: string;          // ← AJOUTER
  lotExpirationDate?: string;  // ← AJOUTER
}>>([]);
```

**Modification 3** - Mapper les données de lot (lignes 55-66)

```typescript
const items = transaction.lignes_ventes.map((ligne: any, idx: number) => {
  return {
    productId: ligne.produit_id || '',
    productName: ligne.produit?.libelle_produit || 'Produit inconnu',
    quantityReturned: 0,
    maxQuantity: ligne.quantite || 0,
    unitPrice: ligne.prix_unitaire_ttc || 0,
    condition: 'Neuf' as const,
    reason: '',
    lotNumber: ligne.numero_lot || null,              // ← AJOUTER
    lotExpirationDate: ligne.date_peremption_lot || null  // ← AJOUTER
  };
});
```

**Modification 4** - Résoudre le `lot_id` avant création (lignes 107-122)

Au lieu de passer `lot_id: undefined`, résoudre l'ID du lot via le `numero_lot` et `produit_id` :

```typescript
// Avant la création du retour, résoudre les lot_id
const lignesAvecLot = await Promise.all(
  itemsToReturn.map(async (item) => {
    let lot_id = null;
    
    if (item.lotNumber) {
      // Récupérer l'ID du lot via numero_lot + produit_id
      const { data: lot } = await supabase
        .from('lots')
        .select('id')
        .eq('numero_lot', item.lotNumber)
        .eq('produit_id', item.productId)
        .maybeSingle();
      
      lot_id = lot?.id || null;
    }

    return {
      produit_id: item.productId,
      lot_id: lot_id,  // ← Maintenant résolu
      quantite_retournee: item.quantityReturned,
      prix_unitaire: item.unitPrice,
      montant_ligne: item.unitPrice * item.quantityReturned,
      etat_produit: item.condition === 'Neuf' ? 'Parfait' : 
                    item.condition === 'Ouvert' ? 'Endommagé' : 'Non conforme',
      taux_remboursement: 100,
      motif_ligne: item.reason,
      remis_en_stock: false
    };
  })
);

await createReturn({
  ...
  lignes: lignesAvecLot
});
```

---

## Résumé des Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useReturnsExchanges.ts` | Ajouter `numero_lot`, `date_peremption_lot` dans `searchOriginalTransaction` |
| `src/components/dashboard/modules/pos/ReturnExchangeModal.tsx` | Stocker et résoudre le `lot_id` via `numero_lot` avant création |

---

## Résultat Attendu

Après correction :

1. La recherche de transaction récupérera les infos de lot (`numero_lot`, `date_peremption_lot`)
2. Le modal stockera ces informations dans `returnItems`
3. Avant création du retour, le `lot_id` sera résolu via une requête sur la table `lots`
4. Le `lignes_retours` sera créé avec un `lot_id` valide
5. Lors du traitement du retour, le filtre `l.lot_id` passera
6. Le stock sera correctement réintégré dans le lot

---

## Section Technique

### Flux de Données Corrigé

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  VENTE ORIGINALE                                                                        │
│  lignes_ventes : produit_id, quantite, numero_lot = "20012601", date_peremption_lot     │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ searchOriginalTransaction() - MODIFIÉ
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  RECHERCHE TRANSACTION                                                                  │
│  ✅ RÉCUPÈRE numero_lot ET date_peremption_lot                                          │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ ReturnExchangeModal.tsx - MODIFIÉ
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  CRÉATION RETOUR                                                                        │
│  ✅ Résout lot_id via: lots.numero_lot = "20012601" AND lots.produit_id = ...           │
│  ✅ lot_id: "8bea2565-f939-48fb-b9d4-04591305ad7b"                                       │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ processReturnMutation - INCHANGÉ
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  TRAITEMENT RETOUR                                                                      │
│  ✅ Filtre: l.lot_id existe => LIGNE PASSE                                              │
│  ✅ Stock réintégré: quantite_restante += quantite_retournee                            │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

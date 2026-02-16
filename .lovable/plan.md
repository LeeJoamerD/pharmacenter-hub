

# Correction du Dialog de modification de prix a la vente

## Problemes identifies

### 1. Labels en anglais
Les cles de traduction suivantes n'existent pas dans `LanguageContext.tsx` : `editSalePrice`, `currentPriceTTC`, `newPriceTTC`, `priceHT`, `additionalCentime`, `vatAmount`. Le systeme affiche donc la cle brute (en anglais) au lieu du libelle traduit.

### 2. Calcul inverse incorrect
Le coefficient `coefficient_prix_vente` n'est PAS charge dans les donnees produit du POS (ni `POSProduct`, ni le RPC `get_pos_products`). Le code fait :
```
product?.coefficient_prix_vente ?? product?.categorie_tarification?.coefficient_prix_vente ?? 1
```
Les deux premieres valeurs sont `undefined`, donc le coefficient vaut toujours **1**. Resultat : Prix Achat = HT / 1 = HT, ce qui est faux.

Verification en base : PARACETAMOL UBI 500MG est dans la categorie "MEDICAMENTS" avec `coefficient_prix_vente = 1.41`. Donc pour TTC = 10 000 (TVA 0%) : HT = 10 000 et Prix Achat devrait etre 10 000 / 1.41 = 7 092 FCFA, pas 10 000.

## Solution

### Fichier 1 : `src/contexts/LanguageContext.tsx` -- Ajouter les traductions manquantes

Ajouter les cles suivantes dans les 4 langues (FR, EN, ES, LN) :

| Cle | Francais | English | Espanol | Lingala |
|-----|----------|---------|---------|---------|
| editSalePrice | Modifier le prix de vente | Edit sale price | Modificar precio de venta | Kobongola prix ya koteka |
| currentPriceTTC | Prix TTC actuel | Current price (incl. tax) | Precio actual (con impuestos) | Prix TTC ya lelo |
| newPriceTTC | Nouveau prix TTC | New price (incl. tax) | Nuevo precio (con impuestos) | Prix TTC ya sika |
| priceHT | Prix HT | Price excl. tax | Precio sin impuestos | Prix HT |
| vatAmount | TVA | VAT | IVA | TVA |
| additionalCentime | Centime Add. | Additional centime | Centimo adicional | Centime Add. |
| priceUpdatedSuccess | Prix mis a jour avec succes | Price updated successfully | Precio actualizado con exito | Prix ebongwani malamu |

### Fichier 2 : `src/components/dashboard/modules/sales/pos/PriceEditDialog.tsx` -- Charger le coefficient depuis la DB

Le changement principal : au lieu de lire le coefficient depuis les donnees produit (ou il n'existe pas), **charger la categorie de tarification depuis Supabase** quand le dialog s'ouvre.

Logique modifiee :
1. Quand le dialog s'ouvre, recuperer `categorie_tarification_id` du produit via une requete `supabase.from('produits').select('categorie_tarification_id, categorie_tarification(coefficient_prix_vente, taux_tva, taux_centime_additionnel)')` 
2. Utiliser les taux et le coefficient de la `categorie_tarification` (source de verite) pour le calcul inverse
3. Si pas de categorie, fallback aux valeurs du produit avec coefficient = 1

Cela garantit que le calcul inverse utilise les memes parametres que le calcul direct fait a l'approvisionnement.

### Fichier 3 : `src/services/UnifiedPricingService.ts` -- Aucune modification

La methode `reversePriceFromTTC` est mathematiquement correcte. Le probleme etait uniquement que le coefficient passe en parametre valait 1 au lieu de la vraie valeur.

## Details techniques

### Requete Supabase dans PriceEditDialog

```typescript
// Charger la categorie de tarification du produit
useEffect(() => {
  if (open && product?.id) {
    supabase.from('produits')
      .select('categorie_tarification_id, categorie_tarification(coefficient_prix_vente, taux_tva, taux_centime_additionnel)')
      .eq('id', product.id)
      .single()
      .then(({ data }) => {
        if (data?.categorie_tarification) {
          setCategorieData(data.categorie_tarification);
        }
      });
  }
}, [open, product?.id]);
```

### Calcul avec les bonnes valeurs

```typescript
const tauxTVA = categorieData?.taux_tva ?? product?.taux_tva ?? 0;
const tauxCentime = categorieData?.taux_centime_additionnel ?? product?.taux_centime_additionnel ?? 0;
const coefficient = categorieData?.coefficient_prix_vente ?? 1;
```

### Verification du calcul (PARACETAMOL UBI, categorie MEDICAMENTS, coeff 1.41, TVA 0%)

- TTC = 10 000
- Facteur = 1 + 0 + 0 = 1
- HT = 10 000 / 1 = 10 000
- TVA = 0
- Centime = 0
- Prix Achat = 10 000 / 1.41 = **7 092 FCFA**


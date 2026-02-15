

# Modifier le prix de vente a la vente (POS)

## Objectif

Permettre au vendeur de modifier le prix TTC d'un produit directement dans le panier du Point de Vente, avec recalcul inverse des composants (Centime Additionnel, TVA, HT, Prix Achat) et mise a jour en base de donnees (tables `produits` et `lots`).

## Vue d'ensemble

```text
+-------------------------------+       +-----------------------------+
| Configuration Ventes/General  |       | Panier (POS)                |
|                               |       |                             |
| [x] Modifier prix a la vente |------>| Prix TTC  [icone crayon]    |
|     (nouveau toggle)          |       | Clic -> Dialog de saisie    |
+-------------------------------+       +-----------------------------+
                                                     |
                                                     v
                                        +-----------------------------+
                                        | Recalcul inverse            |
                                        | TTC -> Centime -> TVA -> HT |
                                        | -> Prix Achat               |
                                        +-----------------------------+
                                                     |
                                                     v
                                        +-----------------------------+
                                        | Mise a jour DB              |
                                        | Table produits + lots       |
                                        +-----------------------------+
```

## Modifications par fichier

### 1. `src/hooks/useSalesSettings.ts` -- Ajouter le champ de configuration

- Ajouter `allowPriceEditAtSale: boolean` dans `SalesSettings.general`
- Valeur par defaut : `false`

### 2. `src/components/dashboard/modules/sales/SalesConfiguration.tsx` -- Ajouter le toggle dans l'UI

- Ajouter un nouveau toggle **"Modifier prix a la vente"** dans la colonne gauche de la section "Configuration Generale", juste apres "Info client obligatoire" (emplacement encadre en rouge sur l'image 1)
- Libelle : "Modifier prix a la vente"
- Lie a `settings.general.allowPriceEditAtSale`

### 3. `src/services/UnifiedPricingService.ts` -- Ajouter la methode de calcul inverse

Nouvelle methode `reversePriceFromTTC` qui effectue le calcul inverse :

```text
Formule directe (approvisionnement) :
  HT = Achat x Coefficient
  TVA = HT x (taux_tva / 100)
  Centime = TVA x (taux_centime / 100)
  TTC = HT + TVA + Centime

Formule inverse (depuis TTC) :
  Facteur = 1 + (taux_tva/100) + (taux_tva/100 * taux_centime/100)
  HT = TTC / Facteur
  TVA = HT x (taux_tva / 100)
  Centime = TVA x (taux_centime / 100)
  Achat = HT / Coefficient
```

Chaque composant sera arrondi individuellement (Math.round pour XAF) pour respecter la regle comptable : TTC = HT + TVA + Centime exactement.

Parametres requis : `newTTC`, `tauxTVA`, `tauxCentimeAdditionnel`, `coefficientPrixVente`, `currencyCode`

Retour : `{ prixAchat, prixVenteHT, montantTVA, montantCentimeAdditionnel, prixVenteTTC }`

### 4. `src/components/dashboard/modules/sales/pos/ShoppingCartComponent.tsx` -- Bouton d'edition du prix

- Ajouter une prop `allowPriceEdit: boolean` et une callback `onEditPrice: (productId: number) => void`
- A cote du montant total de chaque article dans le panier (la zone encadree en rouge sur l'image 2), afficher un petit bouton icone crayon (Pencil de lucide-react) **uniquement si** `allowPriceEdit` est `true`
- Le bouton est discret (variant ghost, taille sm) pour ne pas encombrer l'interface
- Au clic, appeler `onEditPrice(item.product.id)`

### 5. Nouveau composant : `src/components/dashboard/modules/sales/pos/PriceEditDialog.tsx`

Dialog de modification du prix :
- Titre : "Modifier le prix de vente"
- Affiche le nom du produit et le prix TTC actuel
- Champ de saisie du nouveau prix TTC
- Affiche en temps reel le detail recalcule (HT, TVA, Centime, Prix Achat) via `reversePriceFromTTC`
- Boutons "Annuler" et "Confirmer"
- Au clic sur "Confirmer" :
  1. Met a jour la table `produits` (prix_vente_ht, tva, centime_additionnel, prix_vente_ttc, prix_achat)
  2. Met a jour la table `lots` pour le lot FIFO actif (prix_vente_ht, prix_vente_ttc, montant_tva, montant_centime_additionnel)
  3. Met a jour le panier local (unitPrice et total)
  4. Invalide les query caches ('produits', 'lots', 'products', 'product-lots')
  5. Affiche un toast de succes

### 6. `src/components/dashboard/modules/sales/POSInterface.tsx` -- Integration mode non-separe

- Lire `salesSettings.general.allowPriceEditAtSale`
- Ajouter un state `priceEditProduct` (le produit dont on edite le prix)
- Passer `allowPriceEdit` et `onEditPrice` au `ShoppingCartComponent`
- Rendre le `PriceEditDialog` avec les callbacks de mise a jour du panier et de la DB
- Apres confirmation, recalculer le total du panier

### 7. `src/components/dashboard/modules/sales/pos/SalesOnlyInterface.tsx` -- Integration mode separe

- Meme logique que POSInterface : lire le parametre, ajouter le state, passer les props, rendre le dialog
- Les deux modes de vente (separe/non-separe) auront un comportement identique

### Aucune migration SQL necessaire

Les colonnes `prix_vente_ht`, `prix_vente_ttc`, `tva`, `centime_additionnel`, `prix_achat` existent deja dans la table `produits`, et `prix_vente_ht`, `prix_vente_ttc`, `montant_tva`, `montant_centime_additionnel` existent dans `lots`.




# Rendre le Reapprovisionnement operationnel depuis Produits Critiques et Produits en Rupture

## Probleme identifie

- Le bloc **Produits Critiques** (`CriticalStock.tsx`) utilise `OrderLowStockModal` qui charge les fournisseurs via le hook `useSuppliers` -- ce hook s'appuie sur les politiques RLS qui ne fonctionnent pas correctement dans ce contexte, d'ou la liste vide.
- Le bloc **Produits en Rupture** (`StockRupture.tsx`) n'a aucun bouton de commande ni modal de reapprovisionnement.
- Le `QuickSupplyDialog` (utilise par "Actions Rapides") fonctionne car il charge les fournisseurs manuellement avec un filtre `tenant_id` explicite.

## Solution

Remplacer `OrderLowStockModal` par `QuickSupplyDialog` dans les deux blocs, car ce dernier fonctionne correctement.

## Modifications

### 1. CriticalStock.tsx

- Remplacer l'import de `OrderLowStockModal` par `QuickSupplyDialog`
- Adapter le bouton "Commander" pour ouvrir `QuickSupplyDialog` en passant `productId` (au lieu de l'objet complet)
- Supprimer les imports inutilises (`useAlertSettings`, etc.)

### 2. StockRupture.tsx

- Ajouter un bouton "Commander" et un bouton "Details" sur chaque produit en rupture (meme design que CriticalStock)
- Integrer `QuickSupplyDialog` avec le `productId` du produit selectionne
- Ajouter `ProductDetailsModal` pour le bouton "Details"
- Ajouter les states necessaires (`selectedProduct`, `isOrderModalOpen`, `isDetailsModalOpen`)

### Aucune migration SQL necessaire

Le `QuickSupplyDialog` existant gere deja correctement le chargement des fournisseurs et la creation de commandes.


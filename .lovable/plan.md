
# Plan d'Implémentation : Modification du Prix d'Achat avec Recalcul Automatique

## Objectif
Ajouter la possibilité de modifier le prix d'achat unitaire dans la modal "Détails du Lot" (onglet Stock & Valeurs), avec recalcul automatique et affichage en temps réel des prix HT, TVA, Centime Additionnel et TTC.

## Architecture Actuelle

La section "Valorisation" dans `LotDetailsDialog.tsx` affiche actuellement :
- Prix d'achat unitaire (lecture seule)
- Prix de vente suggéré (lecture seule)  
- Valeur stock restant (calculée)

La base de données dispose déjà d'un **trigger** qui recalcule automatiquement les prix lors de la modification du `prix_achat_unitaire` d'un lot.

## Solution Proposée

### Composant 1 : Hook de Récupération de la Catégorie de Tarification

**Objectif** : Récupérer le coefficient et les taux de la catégorie liée au produit du lot.

**Fichier** : Modification de `src/hooks/useLots.ts`

- Étendre la requête `useLotQuery` pour inclure la catégorie de tarification :
```text
produit:produits!inner(
  id, libelle_produit, code_cip, famille_id,
  categorie_tarification:categorie_tarification(
    id, coefficient_prix_vente, taux_tva, taux_centime_additionnel
  )
)
```

### Composant 2 : Section de Valorisation Éditable

**Objectif** : Transformer la section "Valorisation" pour permettre l'édition du prix d'achat.

**Fichier** : `src/components/dashboard/modules/stock/LotDetailsDialog.tsx`

**Modifications** :
1. Ajouter les imports nécessaires :
   - `useState` pour gérer le mode édition et les valeurs
   - `Input` pour le champ de saisie
   - `usePricingConfig` pour les paramètres d'arrondi
   - `unifiedPricingService` pour le recalcul des prix
   - Icônes `Edit`, `Save`, `Loader2`

2. Ajouter les états locaux :
   - `isEditingPrice` : boolean pour le mode édition
   - `newPrixAchat` : string pour la saisie
   - `calculatedPrices` : objet avec les prix recalculés (HT, TVA, CA, TTC)
   - `isSaving` : boolean pour l'état de sauvegarde

3. Créer une fonction `handlePrixAchatChange(value: string)` :
   - Récupérer le coefficient depuis la catégorie de tarification du produit
   - Appeler `unifiedPricingService.calculateSalePrice()` avec les bons paramètres
   - Afficher en temps réel les prix recalculés

4. Créer une fonction `handleSavePrixAchat()` :
   - Appeler `updateLot` avec le nouveau `prix_achat_unitaire`
   - Le trigger DB recalculera et persistera tous les prix
   - Invalider le cache React Query pour rafraîchir les données

5. Refondre l'interface de la carte "Valorisation" :
   - Afficher le prix d'achat avec un bouton "Éditer"
   - En mode édition : input + boutons Annuler/Sauvegarder
   - Afficher les 4 prix détaillés : HT, TVA, Centime Additionnel, TTC
   - Prévisualisation en temps réel avant sauvegarde

### Interface Utilisateur

```text
┌─────────────────────────────────────────────┐
│  💶 Valorisation                    [Éditer]│
├─────────────────────────────────────────────┤
│  Prix d'achat unitaire                      │
│  ┌─────────────────────────────────────┐    │
│  │ 1 390                           FCFA│    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ── Prix de Vente Calculés ──              │
│                                             │
│  Prix HT                         1 960 FCFA │
│  TVA (19.25%)                        0 FCFA │
│  Centime Additionnel (0.175%)        0 FCFA │
│  Prix TTC                        1 975 FCFA │
│                                             │
│  Valeur stock restant            5 850 FCFA │
│                                             │
│         [Annuler]  [💾 Sauvegarder]         │
└─────────────────────────────────────────────┘
```

## Flux de Données

```text
Utilisateur modifie prix d'achat
           │
           ▼
┌─────────────────────────────────┐
│  handlePrixAchatChange(value)   │
│  - Parse la valeur              │
│  - Récupère catégorie produit   │
│  - Récupère params pricing      │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  unifiedPricingService          │
│  .calculateSalePrice()          │
│  - Applique coefficient         │
│  - Calcule TVA                  │
│  - Calcule Centime Additionnel  │
│  - Applique arrondi configureé  │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Mise à jour UI temps réel      │
│  - Affiche prévisualisation     │
│  - HT, TVA, CA, TTC             │
└─────────────────────────────────┘
           │
     (Clic Sauvegarder)
           │
           ▼
┌─────────────────────────────────┐
│  updateLot({ prix_achat... })   │
│  - Supabase UPDATE              │
│  - Trigger DB recalcule tout    │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Invalidation cache + Refresh   │
│  - Toast succès                 │
│  - Retour mode lecture          │
└─────────────────────────────────┘
```

## Validations

1. **Prix d'achat** : doit être > 0
2. **Catégorie de tarification** : doit exister pour le produit (sinon afficher message d'erreur)
3. **Format numérique** : validation de la saisie

## Détails Techniques

### Modifications de Fichiers

| Fichier | Type | Description |
|---------|------|-------------|
| `src/hooks/useLots.ts` | Modification | Étendre `useLotQuery` pour inclure `categorie_tarification` |
| `src/components/dashboard/modules/stock/LotDetailsDialog.tsx` | Modification | Ajouter le mode édition, calcul temps réel, sauvegarde |

### Dépendances Utilisées

- `unifiedPricingService.calculateSalePrice()` - Calcul des prix
- `usePricingConfig()` - Paramètres d'arrondi
- `useLots().updateLot()` - Mise à jour BD
- Trigger DB existant - Recalcul automatique côté serveur

### Formules Appliquées (depuis PRICING_RULES.md)

```text
Prix HT = Prix Achat × Coefficient
Montant TVA = Prix HT × (Taux TVA / 100)
Montant Centime = Montant TVA × (Taux Centime / 100)
Prix TTC = Prix HT + Montant TVA + Montant Centime
Prix TTC Final = Arrondi(Prix TTC, précision, méthode)
```

## Estimation

- **Complexité** : Moyenne
- **Fichiers impactés** : 2
- **Risque** : Faible (utilise les services existants et le trigger DB)

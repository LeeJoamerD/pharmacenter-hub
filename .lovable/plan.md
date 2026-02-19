
# Importer depuis une Session de Caisse (au lieu d'une transaction)

## Changement fonctionnel

Le modal "Importer depuis une vente" devient "Importer depuis une session de caisse". Au lieu de lister des transactions individuelles, il liste les sessions de caisse. Quand l'utilisateur en selectionne une, tous les produits de niveau 1 vendus pendant cette session sont charges dans un tableau avec quantites agregees (sans doublons).

## Flux utilisateur

```text
1. Ouverture du modal
   --> Liste des sessions de caisse recentes (numero, date, caissier, total ventes)
   --> Barre de recherche par numero de session

2. Selection d'une session
   --> Chargement de tous les produits vendus (niveau_detail = 1)
   --> Deduplication : chaque produit apparait une seule fois avec la quantite totale
   --> Tableau avec colonne de selection (checkbox) + bouton "Selectionner tout"

3. Import
   --> L'utilisateur coche les produits souhaites
   --> Clic sur "Importer" --> ajout dans la commande en cours
```

## Modifications techniques

### Fichier 1 : `src/hooks/useSmartOrderSuggestions.ts`

**A) Remplacer la query `recentSales`** (lignes 155-194) : Au lieu de fetcher depuis `ventes`, fetcher depuis `sessions_caisse` :
- Champs : id, numero_session, date_ouverture, montant_total_ventes, statut, agent (noms/prenoms)
- Filtre : tenant_id, statut = 'Fermee' (sessions cloturees)
- Ordre : date_ouverture DESC, limit 50

**B) Remplacer `searchSales`** (lignes 197-229) : Recherche par numero_session au lieu de numero_vente.

**C) Remplacer `getProductsFromSale`** (lignes 232-283) : Nouvelle logique :
1. Recuperer toutes les ventes de la session via `ventes.session_caisse_id = sessionId`
2. Pour chaque vente, recuperer les `lignes_ventes` avec le produit
3. Filtrer `niveau_detail = 1`
4. Agreger par `produit_id` : sommer les quantites, garder un seul enregistrement par produit
5. Exclure les produits deja dans la commande

**D) Mettre a jour l'interface `SaleForImport`** (lignes 32-39) : Renommer en `SessionForImport` avec les champs adaptes (numero_session, date_ouverture, agent_name, montant_total_ventes).

### Fichier 2 : `src/components/dashboard/modules/stock/SaleSelectionDialog.tsx`

**A) Textes du modal** :
- Titre : "Importer depuis une session de caisse"
- Description : "Selectionnez une session de caisse pour importer les produits vendus"
- Placeholder recherche : "Rechercher par numero de session..."

**B) Carte de session** (lignes 172-207) : Afficher le numero de session, la date d'ouverture, le nom du caissier et le total des ventes au lieu du numero de vente/client.

**C) Le reste du modal** (step 'select-products') reste identique : tableau avec checkboxes, bouton "Selectionner tout", bouton "Importer".

### Fichier 3 : `src/components/dashboard/modules/stock/OrderForm.tsx` (ligne 529)

Mettre a jour le titre du bouton : "Importer depuis une session de caisse".

### Fichier 4 : `src/components/dashboard/modules/stock/EditOrderTab.tsx`

Meme mise a jour du titre si present.

## Ce qui ne change pas

- L'interface `SmartOrderSuggestion` reste la meme (les produits importes ont la meme structure)
- Le mecanisme d'import dans la commande (`handleImportFromSale` / `addProductsFromSuggestions`) ne change pas
- Les suggestions par alertes de stock et demandes clients ne sont pas affectees

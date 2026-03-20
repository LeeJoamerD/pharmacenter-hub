

# Plan : Indicateur de retour sur les transactions en attente (Encaissement)

## Objectif
Afficher un bouton d'état de retour sur chaque transaction en attente dans l'Encaissement (mode Separé via `CashRegisterInterface` et mode Non-Séparé). Ce bouton reflète le statut du retour associé et permet d'ouvrir le modal "Traiter le retour" quand le retour est approuvé.

## Comportement du bouton

| Statut retour | Apparence | Cliquable | Action |
|---|---|---|---|
| En attente | Bouton grisé (icône Package) | Non | Aucune |
| Approuvé | Bouton vert actif (icône Package) | Oui | Ouvre le modal ReturnProcessDialog |
| Rejeté | Bouton rouge | Non | Aucune |
| Aucun retour | Pas de bouton | - | - |

## Emplacement
Le bouton sera placé juste avant le badge "En attente" dans la zone droite de chaque carte de transaction, exactement comme indiqué dans l'image (zone encadrée en rouge).

## Modifications

### 1. Enrichir `usePendingTransactions` avec les données de retour
**Fichier** : `src/hooks/usePendingTransactions.ts`

- Ajouter un query séparé (ou enrichir le query existant) pour récupérer les retours associés aux ventes en attente via `retours.vente_origine_id`
- Exposer un map `returnsByVenteId: Record<string, { id: string, numero_retour: string, statut: string }>` qui associe chaque `vente_id` au retour le plus récent

### 2. Ajouter le bouton retour dans `CashRegisterInterface` (mode séparé)
**Fichier** : `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx`

- Importer `ReturnProcessDialog` et `Package` icon
- Dans la boucle de rendu des transactions en attente (ligne ~525), avant le badge "En attente" (ligne ~546), ajouter conditionnellement le bouton :
  - Si retour "En attente" : bouton grisé avec `disabled`, icône `Package` en `text-muted-foreground`
  - Si retour "Approuvé" : bouton vert actif, icône `Package` en `text-green-600`, `onClick` ouvre `ReturnProcessDialog`
  - Si retour "Rejeté" : bouton rouge avec `disabled`, icône `Package` en `text-destructive`
- Ajouter le state `processDialog` et le composant `ReturnProcessDialog` dans le rendu
- Appeler `processReturn` du hook `useReturnsExchanges` lors de la confirmation, puis `refetchPending` + invalider les caches

### 3. Ajouter le même bouton dans le mode non-séparé (si applicable)
**Fichier** : `src/components/dashboard/modules/sales/POSInterface.tsx`

- Le mode non-séparé n'affiche pas de liste de transactions en attente (la vente et l'encaissement sont combinés). Donc ce mode n'est pas impacté directement. Si le mode non séparé a une section "Encaissement" avec des transactions pendantes, elle passe par `CashRegisterInterface` qui sera déjà modifié.

### 4. Ajouter un hook dédié `useReturnStatusForSales`
**Fichier** : `src/hooks/useReturnStatusForSales.ts` (nouveau)

- Accepte une liste de `vente_id[]`
- Query Supabase `retours` filtré par `vente_origine_id IN (...)` et `tenant_id`
- Retourne `Record<string, { id: string, numero_retour: string, statut: string }>` (le retour le plus récent par vente)
- Se rafraîchit avec les pending transactions (même `refetchInterval`)

### Fichiers modifiés
- `src/hooks/useReturnStatusForSales.ts` (nouveau)
- `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx`
- Réutilisation de `ReturnProcessDialog` existant

### Résultat attendu
- Chaque transaction en attente ayant un retour associé affiche un bouton visuel avant le badge "En attente"
- Le bouton est grisé si le retour est en attente, vert si approuvé (cliquable pour traiter), rouge si rejeté
- Le traitement du retour depuis l'encaissement met à jour la liste en temps réel


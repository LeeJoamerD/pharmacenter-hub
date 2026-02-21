
# Correction du composant InvoiceManager.tsx (Module Comptabilite)

## Probleme identifie

Les modifications precedentes ont ete appliquees au mauvais composant. Il existe **deux composants de facturation distincts** :

1. `src/components/dashboard/modules/sales/invoice/InvoiceFormDialog.tsx` -- utilise dans le Module Ventes (deja corrige mais pas utilise par l'utilisateur)
2. `src/components/dashboard/modules/accounting/InvoiceManager.tsx` -- utilise dans le Module Comptabilite/Factures (celui que l'utilisateur utilise, **jamais corrige**)

Le composant `InvoiceManager.tsx` a encore uniquement les types `'client' | 'fournisseur'` dans son Select, pas de type `'assureur'`. C'est pourquoi "Facture Assureur" n'apparait pas.

De plus, la fonction `handleTransactionSelection` ne gere pas le mode assureur, et le `TransactionSelector` n'est pas connecte avec un `assureurId`.

## Corrections a appliquer

### Fichier : `src/components/dashboard/modules/accounting/InvoiceManager.tsx`

**1. Ajouter l'import de `AssureurSelector`**
```tsx
import { AssureurSelector } from '@/components/accounting/AssureurSelector';
```

**2. Modifier le state `newInvoice`**
Ajouter le support du type `'assureur'` et le champ `assureur_id` dans le state initial.

**3. Modifier le Select "Type de facture" (ligne 581-592)**
Ajouter `'assureur'` comme option :
- `client` -> Facture Client
- `assureur` -> Facture Assureur
- `fournisseur` -> Facture Fournisseur

La valeur `onValueChange` doit accepter `'client' | 'fournisseur' | 'assureur'`.

**4. Modifier le selecteur Client/Fournisseur/Assureur (ligne 594-609)**
Ajouter une condition pour le type `'assureur'` qui affiche le composant `AssureurSelector`.

**5. Modifier le `TransactionSelector` (ligne 613-619)**
- Passer `type='assureur'` quand le type de facture est `'assureur'`
- Passer `assureurId` au composant

**6. Modifier `handleTransactionSelection` (ligne 98-182)**
Ajouter un bloc pour le type `'assureur'` qui :
- Utilise `montant_part_assurance` au lieu de `montant_total_ttc` pour les montants
- Genere les lignes de facture avec la part assurance
- Genere le libelle "Facture assureur - X vente(s)"

**7. Modifier `handleSaveInvoice` (ligne 392-413)**
Ajouter la validation pour le type `'assureur'` (verifier que `assureur_id` est renseigne).
Passer `assureur_id` dans les donnees de la facture, avec `type: 'client'` pour la base de donnees (la table `factures` n'a que `'client'` ou `'fournisseur'` comme type).

**8. Modifier `resetInvoiceForm` (ligne 415-447)**
Ajouter `assureur_id: ''` dans le reset.

**9. Ajouter un onglet "Factures Assureurs" dans les Tabs (ligne 742-748)**
Ajouter un `TabsTrigger` "Factures Assureurs" pour filtrer et afficher les factures ayant un `assureur_id`.

### Fichier : `src/hooks/useInvoiceManager.ts`

**10. Modifier `Invoice` interface (ligne 14)**
Ajouter `assureur_id?: string` et `assureur_nom?: string`.

**11. Modifier `generateInvoiceNumber` (ligne 246)**
Supporter le type `'assureur'` en le traitant comme `'client'` (meme prefixe FC ou un nouveau prefixe FA).

**12. Modifier `getInvoicesByType`**
Ajouter un filtre pour les factures assureur (celles ayant un `assureur_id` non null).

## Resume des modifications

| Fichier | Modifications |
|---------|-------------|
| `InvoiceManager.tsx` | Ajout type assureur dans Select, AssureurSelector, TransactionSelector en mode assureur, handleTransactionSelection pour assureur, handleSaveInvoice pour assureur, onglet Factures Assureurs |
| `useInvoiceManager.ts` | Interface Invoice etendue, support assureur dans generateInvoiceNumber et getInvoicesByType |

## Resultat attendu

- Le dropdown "Type de facture" affichera 3 options : Facture Client, Facture Assureur, Facture Fournisseur
- Quand "Facture Assureur" est selectionne, un selecteur d'assureur apparait
- Les ventes non facturees affichent la part assurance (pas le TTC complet)
- Les lignes de facture sont generees avec les montants de la part assurance
- Un nouvel onglet "Factures Assureurs" liste les factures assureur creees

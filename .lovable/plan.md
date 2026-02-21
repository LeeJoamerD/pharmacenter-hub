

# Correction de l'erreur 400 a la creation de facture assureur

## Probleme identifie

La table `factures` a une contrainte `check_client_or_fournisseur` qui impose :
- Si `type = 'client'` alors `client_id IS NOT NULL` et `fournisseur_id IS NULL`
- Si `type = 'fournisseur'` alors `fournisseur_id IS NOT NULL` et `client_id IS NULL`

Le code actuel dans `handleSaveInvoice` (ligne 442) convertit le type `'assureur'` en `'client'` pour le stockage en base, mais ne fournit PAS de `client_id`. Seul `assureur_id` est renseigne. La contrainte rejette donc l'insertion avec une erreur 400.

## Solution

### Migration SQL

Modifier la contrainte `check_client_or_fournisseur` pour accepter un 3e cas : les factures assureur (type = 'client', assureur_id IS NOT NULL, client_id IS NULL).

```sql
ALTER TABLE factures DROP CONSTRAINT check_client_or_fournisseur;
ALTER TABLE factures ADD CONSTRAINT check_client_or_fournisseur CHECK (
  (type = 'client' AND client_id IS NOT NULL AND fournisseur_id IS NULL)
  OR (type = 'client' AND assureur_id IS NOT NULL AND fournisseur_id IS NULL)
  OR (type = 'fournisseur' AND fournisseur_id IS NOT NULL AND client_id IS NULL)
);
```

Cela permet de stocker une facture de type `'client'` sans `client_id` a condition qu'un `assureur_id` soit renseigne.

### Correction du warning DialogContent

Ajouter un `DialogDescription` (meme visuellement cache) dans le dialog de creation de facture pour satisfaire l'accessibilite Radix.

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| **Migration SQL** | Mise a jour de la contrainte `check_client_or_fournisseur` |
| `InvoiceManager.tsx` | Ajout d'un `DialogDescription` dans le dialog de creation de facture |

### Resultat attendu

- La creation de facture assureur ne declenchera plus l'erreur 400
- Le warning "Missing Description" dans la console disparaitra


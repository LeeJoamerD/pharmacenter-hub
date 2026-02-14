
# Fix: Contrainte CHECK sur statut commande fournisseur

## Probleme

L'insertion echoue avec l'erreur `commandes_fournisseurs_statut_check` car le code envoie `'En attente'` comme statut, mais cette valeur n'est pas autorisee par la contrainte CHECK de la table.

## Valeurs autorisees par la base de donnees

`Brouillon`, `En cours`, `Confirme`, `Expedie`, `En transit`, `Livre`, `Receptionne`, `Annule`

## Modification

**Fichier** : `src/components/dashboard/modules/stock/dashboard/dialogs/QuickSupplyDialog.tsx`

Remplacer `statut: 'En attente'` par `statut: 'Brouillon'` dans la fonction `handleSubmit` (ligne 88).

Un seul caractere de difference, aucune migration SQL necessaire.

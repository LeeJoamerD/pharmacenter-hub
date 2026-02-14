
# Fix: Erreur 400 sur creation commande rapide

## Probleme

L'insertion dans `commandes_fournisseurs` echoue car le code envoie des colonnes inexistantes :
- `statut_commande` -- la colonne s'appelle `statut`
- `notes` -- cette colonne n'existe pas dans la table

## Colonnes reelles de `commandes_fournisseurs`

`id`, `tenant_id`, `fournisseur_id`, `agent_id`, `date_commande`, `statut`, `created_at`, `updated_at`, `valide_par_id`, `montant_ht`, `montant_tva`, `montant_centime_additionnel`, `montant_asdi`, `montant_ttc`

## Modification

**Fichier** : `src/components/dashboard/modules/stock/dashboard/dialogs/QuickSupplyDialog.tsx`

Dans la fonction `handleSubmit`, remplacer l'objet d'insertion :

```text
AVANT :
{
  tenant_id: personnelData.tenant_id,
  fournisseur_id: formData.fournisseur,
  statut_commande: 'En attente',
  notes: formData.notes
}

APRES :
{
  tenant_id: personnelData.tenant_id,
  fournisseur_id: formData.fournisseur,
  statut: 'En attente'
}
```

- `statut_commande` devient `statut`
- `notes` est supprime de l'insertion (colonne inexistante)
- Le champ "Notes" du formulaire sera conserve visuellement mais ne sera pas persiste (la table ne le supporte pas)

Optionnel : supprimer le champ "Notes" du formulaire pour eviter la confusion utilisateur, ou le garder en tant que reference future.

Un seul fichier modifie, aucune migration SQL necessaire.

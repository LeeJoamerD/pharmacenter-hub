

# Plan : Correction de la gestion des retours sur les ventes, sessions et rapports

## Diagnostic

Le problème est dans `processReturnMutation` (`src/hooks/useReturnsExchanges.ts`, lignes 375-494). Quand un retour est traité :
- Le stock est bien réintégré via RPC
- Le retour est marqué "Terminé"
- Le statut de la vente est mis à "Remboursée" si tout est retourné

**Mais il manque :**
1. Aucun mouvement de caisse de type "Remboursement" n'est créé → le solde théorique reste gonflé
2. Pour les retours complets après encaissement : la vente et ses lignes ne sont pas supprimées
3. Pour les retours partiels : la vente et ses lignes ne sont pas mises à jour avec les nouvelles quantités/montants

Le rapport de session (`useCashRegister.ts` lignes 469-471) calcule `totalSales` en sommant les `mouvements_caisse` de type "Vente". La RPC `calculate_expected_closing` fait pareil. Sans mouvement correctif, les montants retournés restent comptés.

---

## Stratégie de correction

Toute la logique se concentre dans **un seul fichier** : `src/hooks/useReturnsExchanges.ts`, dans le `processReturnMutation`.

### Cas 2 : Retour total après encaissement

Après la vérification `toutRetourne === true` :

1. Supprimer les `mouvements_caisse` liés à cette vente (`reference_id = vente_origine_id`)
2. Supprimer les `lignes_ventes` de la vente
3. Supprimer la vente elle-même

Résultat : la transaction disparaît complètement du rapport, comme si elle n'avait jamais eu lieu.

### Cas 3 : Retour partiel

Quand `toutRetourne === false` :

1. **Mettre à jour les `lignes_ventes`** :
   - Pour chaque ligne retournée, réduire la `quantite` et recalculer `montant_ligne_ttc`
   - Supprimer les lignes dont la quantité tombe à 0

2. **Recalculer les totaux de la vente** :
   - Requêter les `lignes_ventes` restantes
   - Recalculer : `montant_total_ht`, `montant_tva`, `montant_centime_additionnel`, `montant_total_ttc`
   - Recalculer : `remise_globale`, `montant_part_assurance`, `montant_part_patient`, `montant_net`
   - Les calculs reprennent les taux stockés dans la vente (assurance, remise, ticket modérateur) depuis `metadata.client_info`

3. **Créer un mouvement de caisse "Remboursement"** :
   - Montant = différence entre ancien `montant_net` et nouveau `montant_net`
   - Lié à la session de caisse de la vente
   - Le rapport et `calculate_expected_closing` gèrent déjà les remboursements comme négatifs

4. **Mettre à jour le `mouvement_caisse` original** (type "Vente") :
   - Réduire son montant au nouveau `montant_net`
   - Alternative : créer un mouvement "Remboursement" (déjà supporté par le rapport, lignes 257-261 et RPC ligne 31)

### Choix : Remboursement plutôt que modification

Créer un mouvement "Remboursement" est préférable car :
- La RPC `calculate_expected_closing` le traite déjà comme négatif (ligne 31)
- Le rapport affiche déjà une ligne "Remboursements" (CashReport lignes 257-261)
- L'audit trail est préservé

---

## Détail technique des modifications

### Fichier unique : `src/hooks/useReturnsExchanges.ts`

Dans `processReturnMutation`, après le bloc existant (lignes 439-493) qui vérifie `toutRetourne` :

**Retour total** (remplacer le simple `update statut → Remboursée`) :
```
// 1. Supprimer mouvements_caisse liés
await supabase.from('mouvements_caisse').delete()
  .eq('reference_id', retour.vente_origine_id)
  .eq('tenant_id', tenantId);

// 2. Supprimer lignes_ventes
await supabase.from('lignes_ventes').delete()
  .eq('vente_id', retour.vente_origine_id)
  .eq('tenant_id', tenantId);

// 3. Supprimer la vente
await supabase.from('ventes').delete()
  .eq('id', retour.vente_origine_id)
  .eq('tenant_id', tenantId);
```

**Retour partiel** (nouveau bloc `else`) :
```
// 1. Récupérer lignes_ventes complètes
// 2. Pour chaque ligne_retour, réduire quantité dans ligne_vente
// 3. Supprimer lignes à quantité 0
// 4. Recalculer totaux vente depuis lignes restantes
// 5. Appliquer taux assurance/remise/ticket depuis metadata
// 6. Mettre à jour la vente
// 7. Créer mouvement_caisse "Remboursement" pour la différence
```

### Cas 1 : Retour total sans encaissement (déjà fonctionnel)

Le code existant gère déjà ce cas : la vente avec statut "En cours" (sans mouvement de caisse) est marquée "Remboursée". Mais pour cohérence avec le cas 2, on appliquera la même logique de suppression totale.

---

## Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useReturnsExchanges.ts` (processReturnMutation) |

Aucune migration SQL nécessaire. Aucun nouveau composant. La RPC `calculate_expected_closing` et le rapport `CashReport` supportent déjà les remboursements.


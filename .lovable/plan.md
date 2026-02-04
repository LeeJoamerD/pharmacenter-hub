
# Correction de la Réintégration du Stock via RPC Atomique

## Diagnostic Confirmé

Le `processReturnMutation` (lignes 369-430) appelle `getReturnById(returnId)` qui retourne la structure brute Supabase avec `lignes_retours` au lieu de `lignes`. Résultat : `retour.lignes` est `undefined`, donc `lignesAReintegrer` est vide et le stock n'est jamais mis à jour.

---

## Solution : Option B - Utilisation de `rpc_stock_record_movement`

### Modifications dans `src/hooks/useReturnsExchanges.ts`

#### 1. Corriger `getReturnById` - Mapper `lignes_retours` vers `lignes`

**Emplacement** : Lignes 164-185

Actuellement :
```typescript
return data as Return;
```

Après correction :
```typescript
// Mapper lignes_retours vers lignes pour cohérence avec l'interface Return
const mappedReturn = {
  ...data,
  lignes: data.lignes_retours,
};
return mappedReturn as Return;
```

#### 2. Refactoriser `processReturnMutation` - Utiliser la RPC atomique

**Emplacement** : Lignes 368-430

Modifications :
- Ajouter un filtre `!l.remis_en_stock` pour éviter la double réintégration
- Remplacer les opérations manuelles read/update par un appel à `rpc_stock_record_movement`
- Ajouter une gestion d'erreur explicite si la RPC échoue
- Ne pas passer en "Terminé" si une erreur se produit

**Logique de réintégration corrigée** :

```typescript
// Filtrer les lignes éligibles (état OK, lot_id présent, pas encore réintégré)
const lignesAReintegrer = retour.lignes?.filter(l => 
  (l.etat_produit === 'Parfait' || l.etat_produit === 'Endommagé') && 
  l.lot_id &&
  !l.remis_en_stock  // Éviter double réintégration
);

if (lignesAReintegrer && lignesAReintegrer.length > 0) {
  for (const ligne of lignesAReintegrer) {
    // Utiliser la RPC atomique pour réintégrer le stock
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'rpc_stock_record_movement',
      {
        p_type_mouvement: 'entree',
        p_produit_id: ligne.produit_id,
        p_quantite_mouvement: ligne.quantite_retournee,
        p_lot_id: ligne.lot_id,
        p_prix_unitaire: ligne.prix_unitaire,
        p_reference_id: retour.id,
        p_reference_type: 'retour',
        p_reference_document: retour.numero_retour,
        p_motif: retour.motif_retour || 'Réintégration stock suite retour'
      }
    );

    // Vérifier le résultat de la RPC
    if (rpcError) {
      throw new Error(`Erreur RPC: ${rpcError.message}`);
    }
    
    const result = rpcResult as { success: boolean; error?: string };
    if (!result.success) {
      throw new Error(`Échec réintégration: ${result.error}`);
    }

    // Marquer comme remis en stock
    const { error: updateError } = await supabase
      .from('lignes_retours')
      .update({ remis_en_stock: true })
      .eq('id', ligne.id)
      .eq('tenant_id', tenantId);

    if (updateError) {
      throw new Error(`Erreur mise à jour ligne: ${updateError.message}`);
    }
  }
}
```

---

## Avantages de l'Option B

| Aspect | Ancien code | Nouveau code (RPC) |
|--------|-------------|-------------------|
| Atomicité | Read puis Update séparés (race condition possible) | Transaction atomique côté serveur |
| Traçabilité | Aucune trace de mouvement | Enregistrement dans `mouvements_lots` + `stock_mouvements` |
| Multi-tenant | Pas de vérification tenant_id sur lots | Vérification automatique via `get_current_user_tenant_id()` |
| Gestion erreurs | Erreurs ignorées silencieusement | Erreurs remontées et traitement interrompu |

---

## Fichier Impacté

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useReturnsExchanges.ts` | 1. Mapper `lignes_retours` → `lignes` dans `getReturnById` |
| | 2. Ajouter filtre `!l.remis_en_stock` |
| | 3. Remplacer update manuel par `rpc_stock_record_movement` |
| | 4. Ajouter gestion d'erreur stricte |

---

## Flux de Données Corrigé

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  TRAITEMENT RETOUR                                                                      │
│  processReturnMutation(returnId)                                                        │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ getReturnById() - CORRIGÉ
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  RÉCUPÉRATION RETOUR                                                                    │
│  ✅ lignes_retours → lignes (mapping appliqué)                                          │
│  ✅ retour.lignes contient les données                                                  │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ Filter lignes éligibles
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  FILTRE LIGNES                                                                          │
│  ✅ etat_produit = 'Parfait' ou 'Endommagé'                                             │
│  ✅ lot_id présent                                                                      │
│  ✅ remis_en_stock = false                                                              │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ Pour chaque ligne
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  RPC rpc_stock_record_movement                                                          │
│  ✅ p_type_mouvement = 'entree'                                                         │
│  ✅ p_lot_id = ligne.lot_id                                                             │
│  ✅ p_quantite_mouvement = quantite_retournee                                           │
│  ✅ Met à jour lots.quantite_restante atomiquement                                      │
│  ✅ Crée entrée dans mouvements_lots (traçabilité)                                      │
│  ✅ Crée entrée dans stock_mouvements                                                   │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ Marquer ligne
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  UPDATE lignes_retours                                                                  │
│  ✅ remis_en_stock = true                                                               │
└──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                   │
                                   ▼ Finaliser
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  UPDATE retours                                                                         │
│  ✅ statut = 'Terminé'                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Résultat Attendu

Après implémentation :
- Vente de 1 unité : stock passe de 3 à 2
- Création et validation du retour
- Traitement du retour : stock revient à 3
- Trace visible dans `mouvements_lots` avec type "entree" et reference_type "retour"

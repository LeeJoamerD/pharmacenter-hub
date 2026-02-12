

# Ajouter le bouton "Voir" sur les mouvements de type Vente dans le rapport de session

## Contexte

Dans le bloc "Detail des Mouvements" du rapport de session de caisse (`CashReport.tsx`), les mouvements de type **Vente** sont lies a une transaction via les colonnes `reference_id` (UUID de la vente) et `reference_type` (= `"vente"`). Le bouton "Voir" doit ouvrir le meme modal de details de transaction que celui utilise dans Module Ventes > Historique > Liste.

## Modifications

### Fichier : `src/components/dashboard/modules/sales/cash/CashReport.tsx`

1. **Importer** `TransactionDetailsModal` depuis `../history/TransactionDetailsModal` et les icones/composants necessaires (`Eye` de lucide-react)
2. **Importer** `supabase` et `useTenant` pour pouvoir charger une transaction par ID
3. **Ajouter des etats** :
   - `selectedTransaction` : la transaction chargee (type `Transaction | null`)
   - `detailsModalOpen` : booleen pour ouvrir/fermer le modal
   - `loadingTransaction` : booleen pour l'indicateur de chargement
4. **Creer une fonction `handleViewTransaction(referenceId)`** qui :
   - Requete Supabase sur la table `ventes` avec le meme select que `useTransactionHistory` (client, agent, caisse, lignes_ventes avec produits)
   - Met a jour `selectedTransaction` et ouvre le modal
5. **Dans le rendu des mouvements** (boucle `movements.map`), ajouter conditionnellement un bouton "Voir" (icone Eye) pour les mouvements ou `reference_type === 'vente'` et `reference_id` est present
6. **Ajouter le composant `TransactionDetailsModal`** en bas du JSX, connecte aux etats

### Aucun autre fichier a modifier

Le `TransactionDetailsModal` de `history/` accepte deja un objet `Transaction` complet et gere son propre affichage. Il suffit de lui passer la transaction chargee.

## Section technique

### Structure des donnees des mouvements

Les mouvements de caisse ont les colonnes pertinentes :
- `reference_id` : UUID pointant vers `ventes.id`
- `reference_type` : `"vente"` pour les encaissements
- `type_mouvement` : `"Vente"` pour les ventes

### Requete de chargement de la transaction

```typescript
const { data } = await supabase
  .from('ventes')
  .select(`
    *,
    client:client_id(nom_complet, telephone, email),
    agent:agent_id(noms, prenoms),
    caisse:caisse_id(nom_caisse),
    session_caisse:session_caisse_id(numero_session),
    lignes_ventes!lignes_ventes_vente_id_fkey(
      quantite, prix_unitaire_ttc, montant_ligne_ttc,
      produit:produits!lignes_ventes_produit_id_fkey(libelle_produit)
    )
  `)
  .eq('id', referenceId)
  .eq('tenant_id', tenantId)
  .single();
```

### Modification du JSX des mouvements (ligne ~271-295)

Ajout d'un bouton "Voir" entre le contenu du mouvement et le montant, visible uniquement pour les mouvements lies a une vente :

```typescript
{movement.reference_type === 'vente' && movement.reference_id && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleViewTransaction(movement.reference_id)}
    disabled={loadingTransaction}
  >
    <Eye className="h-4 w-4" />
  </Button>
)}
```


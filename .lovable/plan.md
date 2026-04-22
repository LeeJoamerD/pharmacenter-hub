

## Diagnostic — Modal "Diffuser une Alerte Réseau" : aucune officine, aucune région

### Cause
`NetworkAlertDialog.tsx` (lignes 56-75) charge les officines via :
```ts
supabase.from('pharmacies').select('id, name, city, region').neq('id', tenantId)
```
La RLS de `pharmacies` ne renvoie que la pharmacie courante → après `.neq('id', tenantId)`, la liste est **vide**. Conséquences en cascade :
- "Toutes les officines (0)" dans le sélecteur Destinataires
- "Sélection personnalisée" : aucune officine listée, recherche inutile
- "Par région" : `regions = [...new Set(pharmacies.map(p => p.region))]` est vide → liste de régions vide

C'est exactement le même problème déjà résolu dans `NewMessageDialog.tsx` et `CreateCollaborationDialog.tsx`. La RPC `SECURITY DEFINER` `get_network_pharmacy_directory` retourne déjà `id, name, city, region, …` pour l'ensemble du réseau.

### Correctif

**Fichier unique** : `src/components/dashboard/modules/chat/dialogs/NetworkAlertDialog.tsx`

1. **`loadPharmacies()`** — remplacer la lecture directe par la RPC :
```ts
const { data, error } = await supabase.rpc('get_network_pharmacy_directory');
if (error) throw error;
setPharmacies(
  (data || [])
    .filter((p: any) => p.id !== tenantId)
    .map((p: any) => ({
      id: p.id,
      name: p.name || '',
      city: p.city || '',
      region: p.region || ''
    }))
);
```

2. **Affichage région** — gérer le cas où aucune région n'est renseignée en base (fallback "Région non renseignée") pour éviter une liste vide silencieuse :
```ts
const regions = [...new Set(pharmacies.map(p => p.region).filter(Boolean))];
// Si regions.length === 0 → afficher SelectItem disabled "Aucune région disponible"
```

3. **État vide "Sélection personnalisée"** — afficher un message contextuel quand `filteredPharmacies.length === 0` ("Aucune officine ne correspond à la recherche" si `searchTerm`, sinon "Aucune officine disponible").

### Tableau récap

| Fichier | Changement |
|---|---|
| `NetworkAlertDialog.tsx` (loadPharmacies, l.56-75) | Remplacer `from('pharmacies').select(...)` par `rpc('get_network_pharmacy_directory')` + filtre client `id !== tenantId` |
| `NetworkAlertDialog.tsx` (sélecteur Région, l.293-309) | Ajouter état vide explicite si `regions.length === 0` |
| `NetworkAlertDialog.tsx` (liste personnalisée, l.324-337) | Ajouter message contextuel si `filteredPharmacies.length === 0` |

Aucune migration SQL nécessaire — la RPC existe déjà et expose `region`.

### Résultat attendu
- "Toutes les officines (**13**)" affiche le bon nombre.
- "Sélection personnalisée" : les 13 officines apparaissent, recherche par nom/ville fonctionnelle.
- "Par région" : la liste se peuple avec les régions distinctes du réseau et leur nombre d'officines.
- Cohérence parfaite avec les modals "Nouveau Message Réseau" et "Créer une Collaboration".


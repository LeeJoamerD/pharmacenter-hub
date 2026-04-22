

## Diagnostic — Modal "Créer une Collaboration" : aucune officine trouvée

### Cause
`CreateCollaborationDialog.tsx` charge la liste des officines via :
```ts
supabase.from('pharmacies').select('id, name, city, type').neq('id', tenantId)
```
La RLS de la table `pharmacies` ne permet à un tenant de voir **que sa propre pharmacie**. Après le filtre `.neq('id', tenantId)`, le résultat est **vide** → "Aucune officine trouvée".

C'est exactement le même problème que celui résolu dans `NewMessageDialog.tsx`, où l'on a remplacé la lecture directe par l'appel à la RPC `SECURITY DEFINER` `get_network_pharmacy_directory` qui retourne les 13 officines actives du réseau.

### Correctif

**Fichier unique** : `src/components/dashboard/modules/chat/dialogs/CreateCollaborationDialog.tsx`

Modifier `loadPharmacies()` pour utiliser la même RPC que `NewMessageDialog` :

```ts
const loadPharmacies = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.rpc('get_network_pharmacy_directory');
    if (error) throw error;

    setPharmacies(
      (data || [])
        .filter((p: any) => p.id !== tenantId)
        .map((p: any) => ({
          id: p.id,
          name: p.name || '',
          city: p.city || '',
          type: p.type || ''
        }))
    );
  } catch (error) {
    console.error('Erreur chargement pharmacies:', error);
  } finally {
    setLoading(false);
  }
};
```

Aligner aussi le message vide pour être cohérent : afficher "Aucune officine ne correspond à la recherche" quand `searchTerm` n'est pas vide, sinon "Aucune officine disponible".

### Tableau récap

| Fichier | Changement |
|---|---|
| `CreateCollaborationDialog.tsx` (loadPharmacies) | Remplacer `supabase.from('pharmacies').select(...)` par `supabase.rpc('get_network_pharmacy_directory')` + filtre client `id !== tenantId` |
| `CreateCollaborationDialog.tsx` (état vide) | Affiner le message ("ne correspond à la recherche" vs "Aucune officine disponible") |

Aucune migration SQL nécessaire — la RPC `get_network_pharmacy_directory` existe déjà et est utilisée avec succès dans `NewMessageDialog`.

### Résultat attendu
- Le champ "Ajouter des participants" affiche les 13 officines du réseau (hors officine courante).
- La recherche par nom ou ville filtre la liste correctement.
- Le message "Aucune officine trouvée" ne s'affiche plus que si le filtre de recherche ne renvoie rien.
- Cohérence parfaite avec le modal "Nouveau Message Réseau".


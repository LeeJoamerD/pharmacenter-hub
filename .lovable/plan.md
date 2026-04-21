

## Diagnostic — Recherche destinataires vide (même cause RLS)

### Cause
`NewMessageDialog.tsx` ligne 65 :
```ts
supabase.from('pharmacies').select('id, name, city, type').neq('id', currentTenant?.id)
```
La policy RLS sur `pharmacies` limite déjà la sélection à la seule officine de l'utilisateur (Pharmacie Jeannelle). Le `.neq('id', currentTenant?.id)` exclut ensuite cette unique ligne → **liste totalement vide**. Quand l'utilisateur tape « Pharmacie SIRACDE », `filteredPharmacies` est vide, donc aucun résultat n'apparaît dans la zone de scroll.

### Correctif
Réutiliser la RPC `SECURITY DEFINER` déjà créée pour le répertoire (`get_network_pharmacy_directory`) qui renvoie les 14 officines en contournant la RLS, puis exclure l'officine courante côté client.

**Étape unique — Refactor `loadData` dans `NewMessageDialog.tsx`**

Remplacer (ligne 61-76) :
```ts
const loadData = async () => {
  setLoading(true);
  try {
    const [pharmaciesRes, channelsRes] = await Promise.all([
      supabase.rpc('get_network_pharmacy_directory'),
      supabase.from('network_channels').select('id, name, description')
    ]);

    const mappedPharmacies = (pharmaciesRes.data || [])
      .filter((p: any) => p.id !== currentTenant?.id)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        city: p.city,
        type: p.type
      }));

    setPharmacies(mappedPharmacies as Pharmacy[]);
    setChannels(channelsRes.data || []);
  } catch (error) {
    console.error('Erreur chargement données:', error);
  } finally {
    setLoading(false);
  }
};
```

Aucun changement d'UI ni de logique d'envoi. La recherche `filteredPharmacies` (ligne 176-179) fonctionnera dès que la liste contient bien les 13 autres officines.

### Tableau récap

| Fichier | Changement |
|---|---|
| `src/components/dashboard/modules/chat/dialogs/NewMessageDialog.tsx` | Remplacer le `from('pharmacies')` direct par `rpc('get_network_pharmacy_directory')` + filtrage client de l'officine courante |

### Résultat attendu
- La recherche « Pharmacie SIRACDE » affiche bien la pharmacie correspondante.
- Les 13 autres officines du réseau apparaissent dans la liste de sélection (Pharmacie Jeannelle exclue).
- La sélection multiple et l'envoi de messages directs fonctionnent normalement.


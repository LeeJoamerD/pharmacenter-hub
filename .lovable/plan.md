

## Diagnostic — Répertoire Officines bloqué par RLS

### Cause
`PharmacyDirectory.tsx` (ligne 41-44) appelle `supabase.from('pharmacies').select('*')` directement. La policy RLS sur `pharmacies` filtre à la seule pharmacie de l'utilisateur → 1 résultat. Idem pour les compteurs `personnel` (ligne 50-54) et `network_messages` (ligne 57-63), eux aussi tenant-scopés.

La carte verte « Officines Connectées : 14 » fonctionne car elle utilise déjà la RPC `get_network_global_stats()` SECURITY DEFINER. Le répertoire, lui, lit encore les tables en direct.

### Correctif

**Étape 1 — Migration SQL : RPC `get_network_pharmacy_directory()`**

```sql
CREATE OR REPLACE FUNCTION public.get_network_pharmacy_directory()
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  region text,
  pays text,
  type text,
  status text,
  email text,
  telephone_appel text,
  created_at timestamptz,
  personnel_count bigint,
  last_activity timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    p.id, p.name, p.city, p.region, p.pays, p.type, p.status,
    p.email, p.telephone_appel, p.created_at,
    (SELECT count(*) FROM personnel pe 
       WHERE pe.tenant_id = p.id AND pe.is_active = true) AS personnel_count,
    COALESCE(
      (SELECT max(nm.created_at) FROM network_messages nm 
         WHERE nm.sender_pharmacy_id = p.id),
      p.created_at
    ) AS last_activity
  FROM pharmacies p
  ORDER BY p.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_pharmacy_directory() TO authenticated;
```

Ne renvoie que des informations légitimes du répertoire réseau (nom, ville, région, type, statut, email, téléphone, compteurs agrégés) — pas de PII sensible au-delà de ce qui est déjà exposé dans le module Chat-PharmaSoft pour permettre la communication inter-officines.

**Étape 2 — Refactor `PharmacyDirectory.tsx`**

Remplacer la fonction `loadPharmacies` (lignes 38-87) :

```ts
const loadPharmacies = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.rpc('get_network_pharmacy_directory');
    if (error) throw error;

    const mapped = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name || 'Pharmacie',
      city: p.city,
      region: p.region,
      pays: p.pays,
      type: p.type,
      status: p.status,
      email: p.email,
      phone: p.telephone_appel,
      personnel_count: Number(p.personnel_count) || 0,
      last_activity: p.last_activity
    }));

    setPharmacies(mapped);
  } catch (error) {
    console.error('Erreur chargement pharmacies:', error);
    toast.error('Erreur lors du chargement des pharmacies');
  } finally {
    setLoading(false);
  }
};
```

Cela élimine également le N+1 query (1 SELECT + 2×N requêtes par pharmacie → 1 seul appel RPC).

### Tableau récap

| Fichier | Changement |
|---|---|
| Migration SQL | Créer la RPC `get_network_pharmacy_directory()` SECURITY DEFINER |
| `src/components/dashboard/modules/chat/PharmacyDirectory.tsx` | Remplacer le `from('pharmacies')` + N+1 par un seul `rpc('get_network_pharmacy_directory')` |

### Résultat attendu
- Le répertoire affiche les **14 officines** au lieu d'1.
- Description : « 14 officines connectées au réseau PharmaSoft ».
- Chaque carte officine montre son compteur d'utilisateurs réel et sa dernière activité.
- L'officine courante reste mise en évidence via `currentTenant?.id` (logique UI inchangée).
- Performance améliorée (1 requête au lieu de 1 + 2N).


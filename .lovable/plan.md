

## Diagnostic

Erreur `22P02 invalid input value for enum statut_client: "actif"` levée par la RPC `run_ai_diagnostic` à la ligne 53 :

```sql
WHERE tenant_id = p_tenant_id AND statut = 'actif';
```

L'enum `statut_client` réel n'a que 3 valeurs : **`Actif`**, **`Inactif`**, **`Suspendu`** (capitalisées). La RPC utilise `'actif'` minuscule → cast invalide → 400.

## Correction

Migration SQL : `CREATE OR REPLACE FUNCTION public.run_ai_diagnostic` à l'identique, en remplaçant uniquement la ligne 53 par :

```sql
WHERE tenant_id = p_tenant_id AND statut = 'Actif';
```

Aucune autre modification (signature, sécurité, logique inchangées). Pas de changement côté client (le bouton "Lancer Diagnostic" rappelle simplement la RPC corrigée).

### Fichier concerné

| Fichier | Changement |
|---|---|
| `supabase/migrations/<new>.sql` | `CREATE OR REPLACE FUNCTION run_ai_diagnostic` avec `statut = 'Actif'` |

### Résultat attendu
- Le bouton « Lancer Diagnostic » s'exécute sans erreur 400.
- Le score clients reflète correctement le nombre de clients actifs du tenant.


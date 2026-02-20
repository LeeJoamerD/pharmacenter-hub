
# Correction complète de la génération d'écritures comptables à la fermeture de session

## Contexte et diagnostic

Après analyse approfondie de la base de données, voici l'état exact du problème :

### Tenants et leur configuration

| Tenant ID (abrégé) | `vente_comptant` | `tva_collectee` | `centime_additionnel` | Journal VT | Compte 4461 |
|---|---|---|---|---|---|
| b51e3719 (DJL) | MANQUANT | MANQUANT | MANQUANT | OK | OK |
| 5b752062 | MANQUANT | MANQUANT | MANQUANT | OK | OK |
| 0752eb7e | MANQUANT | MANQUANT | MANQUANT | OK | OK |
| 102232f2 | MANQUANT | MANQUANT | MANQUANT | OK | OK |
| 549bc80a | MANQUANT | MANQUANT | MANQUANT | OK | OK |
| e20cc350 | MANQUANT | MANQUANT | MANQUANT | OK | OK |
| 58a29961 | MANQUANT | MANQUANT | MANQUANT | ABSENT | ABSENT |
| 2f7365aa | OK | MANQUANT | MANQUANT | OK | ABSENT |
| aa8717d1 | OK | OK | OK | OK | OK |

### Sessions fermées sans écriture comptable

- Tenant `0752eb7e` : 4 sessions (1 560 900 FCFA de ventes)
- Tenant `5b752062` : 12 sessions (1 137 600 FCFA de ventes)
- Tenant `b51e3719` (DJL) : 1 session (78 993 FCFA de ventes)

**Total : 17 sessions sans écriture comptable**

---

## Plan d'action en 4 parties

### Partie 1 — Insérer la configuration manquante pour les tenants existants

Une migration SQL va insérer les 3 lignes de configuration dans `accounting_default_accounts` pour tous les tenants qui ont :
- Le plan comptable importé (comptes 571 et 701 présents)
- Le journal VT actif
- Mais pas encore la configuration `vente_comptant`

La logique utilisera un `INSERT ... ON CONFLICT DO NOTHING` pour ne pas écraser les configs déjà existantes.

Pour le tenant `58a29961` qui n'a ni journal VT ni compte 4461, la configuration sera insérée uniquement pour `vente_comptant` (sans `centime_additionnel` puisque le compte est absent), et le journal sera créé.

Pour la configuration `tva_collectee` et `centime_additionnel`, seuls les tenants qui possèdent les comptes 4431 et 4461 respectivement recevront ces configurations.

### Partie 2 — Modifier `import_global_accounting_plan` pour inclure automatiquement la configuration

La fonction RPC `import_global_accounting_plan` sera enrichie pour qu'à chaque import de plan comptable, elle insère automatiquement les 3 configurations dans `accounting_default_accounts` :

```text
vente_comptant  → Débit: 571 (Caisse), Crédit: 701 (Ventes), Journal: VT
vente_client    → Débit: 411 (Créances), Crédit: 701 (Ventes), Journal: VT
tva_collectee   → Crédit: 4431 (TVA facturée), Journal: VT
centime_additionnel → Crédit: 4461 (Centime add.), Journal: VT
```

L'insertion se fait avec `ON CONFLICT DO NOTHING` pour ne pas écraser les configurations personnalisées existantes.

### Partie 3 — Génération rétroactive des écritures comptables (fonction SQL)

Une nouvelle fonction RPC `generate_missing_session_accounting_entries()` sera créée (SECURITY DEFINER). Elle parcourt toutes les sessions fermées sans écriture comptable pour tous les tenants et génère les écritures manquantes en utilisant la même logique que `AccountingEntriesService.generateSessionAccountingEntries`.

La fonction :
1. Identifie les sessions fermées sans écriture comptable via `NOT EXISTS`
2. Pour chaque session, récupère les ventes validées et calcule les totaux (HT, TVA, centime, TTC)
3. Vérifie que le tenant a bien la config `accounting_default_accounts`, un exercice ouvert et le journal VT
4. Crée l'écriture comptable avec les lignes correspondantes
5. Retourne un rapport de ce qui a été généré et ce qui a été ignoré (tenant non configuré)

Cette fonction sera appelée une seule fois depuis le SQL Editor Supabase après la migration.

### Partie 4 — Amélioration du `CloseSessionModal.tsx`

Le modal de fermeture de session sera modifié pour afficher un toast d'avertissement explicite si la génération d'écriture échoue (configuration manquante, journal absent, exercice non ouvert). Actuellement, l'échec est silencieux.

---

## Fichiers modifiés

| Fichier | Type de modification |
|---|---|
| Migration SQL (nouvelle) | Insertion des configs manquantes + nouvelle fonction RPC rétroactive + mise à jour de `import_global_accounting_plan` |
| `src/components/dashboard/modules/sales/cash/CloseSessionModal.tsx` | Ajout d'un toast d'avertissement si génération d'écriture échoue |

## Cas particuliers gérés

- Tenant sans journal VT : le journal sera créé automatiquement lors de la migration
- Tenant sans compte 4461 : `centime_additionnel` non inséré pour ce tenant
- Tenant avec config partielle (ex : `2f7365aa`) : seules les configs manquantes sont ajoutées
- Sessions avec 0 FCFA de ventes : écriture générée quand même (cohérence comptable)
- Exercice comptable absent : session ignorée dans la rétroactivité (logged)

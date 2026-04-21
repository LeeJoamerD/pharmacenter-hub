

## Diagnostic — RPC `send_direct_network_message` : `column p.user_id does not exist`

### Cause
Dans la RPC créée à l'étape précédente, le bloc qui identifie la pharmacie de l'expéditeur fait :

```sql
SELECT p.id, p.name INTO v_sender_pharmacy_id, v_sender_name
FROM public.pharmacies p
WHERE p.user_id = auth.uid()
LIMIT 1;
```

Or la table `pharmacies` **n'a pas** de colonne `user_id`. Schéma vérifié : `id, code, name, …, tenant_id, niu, password_hash`. Le rattachement utilisateur ⇄ pharmacie passe par la table `personnel` (colonne `auth_user_id`), comme le confirment les policies RLS existantes :

```sql
id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid())
```

D'où l'erreur `42703 column p.user_id does not exist` et le code 400 sur la RPC.

### Correctif

**Étape unique — Recréer la RPC `send_direct_network_message`** en remplaçant la résolution de l'expéditeur par une jointure via `personnel` :

```sql
SELECT p.id, p.name
INTO v_sender_pharmacy_id, v_sender_name
FROM public.pharmacies p
JOIN public.personnel pe ON pe.tenant_id = p.id
WHERE pe.auth_user_id = auth.uid()
LIMIT 1;
```

Tout le reste de la fonction (find-or-create canal direct, insertion participants, insertion message, retour `jsonb`) reste inchangé.

### Tableau récap

| Fichier | Changement |
|---|---|
| Nouvelle migration SQL | `CREATE OR REPLACE FUNCTION public.send_direct_network_message(...)` avec résolution de l'expéditeur via `personnel.auth_user_id = auth.uid()` au lieu de `pharmacies.user_id` |

### Résultat attendu
- Plus d'erreur `400 / 42703 column p.user_id does not exist`.
- L'envoi d'un message direct vers N pharmacies retourne `{ sent_count, failed_count, channel_ids, errors }` correctement.
- Les canaux directs et les messages sont effectivement créés en base.
- Le toast Succès/Échec côté client reflète la réalité.




# Plan - Garantir la Creation Systematique des Comptes Client pour chaque Personnel

## Diagnostic

### Mecanisme Actuel
Les 3 points d'entree de creation d'utilisateur utilisent tous la meme Edge Function `create-user-with-personnel` :
1. **Bouton "Connecter votre Pharmacie"** (AdminCreationDialog via `useAdminCreation`)
2. **Bouton Utilisateur du header** (UserCreationForm)
3. **Module Parametres/Utilisateurs** (UserSettings via UserCreationForm)

Le flux est : Edge Function cree Auth User + Personnel, puis le trigger DB `trigger_create_client_for_personnel` cree automatiquement le Client.

### Probleme Identifie
Le trigger existe et fonctionne correctement pour les nouvelles insertions. Cependant :
- **4 personnels** de la Pharmacie MAZAYU (`aa8717d1`) ont des clients associes a un ancien tenant (`2f7365aa` = Pharmacie TESTS) - probablement suite a un transfert de tenant sans mise a jour des clients
- Le trigger UPDATE ne gere pas les changements de `tenant_id` : il cherche `WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id`, mais le client a encore l'ancien tenant_id
- Le trigger INSERT a un `EXCEPTION WHEN OTHERS` qui avale silencieusement les erreurs

### Donnees Impactees

| Personnel | Tenant Personnel | Tenant Client | Probleme |
|-----------|-----------------|---------------|----------|
| MASSAMBA GANGA Alma Christie | Pharmacie MAZAYU | Pharmacie TESTS | tenant_id divergent |
| VINDOU-MPANDOU Emma Leonce Grace | Pharmacie MAZAYU | Pharmacie TESTS | tenant_id divergent |
| BIYELEKESSA Lynda Olivelle | Pharmacie MAZAYU | Pharmacie TESTS | tenant_id divergent |
| BATANGOUNA Nada | Pharmacie MAZAYU | Pharmacie TESTS | tenant_id divergent |

---

## Plan de Correction

### Phase 1 : Migration SQL (3 actions)

**1. Corriger les donnees existantes** - Mettre a jour le `tenant_id` des 4 clients pour correspondre a leur personnel.

**2. Ameliorer le trigger UPDATE** - Gerer les changements de `tenant_id` :
```text
-- Si le tenant_id a change, mettre a jour le client avec le nouveau tenant_id
IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
  UPDATE clients SET tenant_id = NEW.tenant_id, ... WHERE personnel_id = NEW.id AND tenant_id = OLD.tenant_id;
ELSE
  UPDATE clients SET ... WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id;
END IF;
```

**3. Ajouter une verification dans le trigger INSERT** - S'assurer que le client est bien cree et logguer plus clairement en cas d'echec (remplacer le `EXCEPTION WHEN OTHERS` silencieux par un mecanisme plus robuste qui re-essaie ou log de maniere exploitable).

### Phase 2 : Renforcer l'Edge Function

Modifier `create-user-with-personnel/index.ts` pour :
- Apres la creation du personnel, **verifier explicitement** qu'un client a bien ete cree par le trigger
- Si le client n'existe pas (trigger silencieusement echoue), le creer manuellement dans l'Edge Function comme filet de securite

```text
// Apres creation personnel reussie :
// 4. Verifier que le client a ete cree par le trigger
const { data: clientCheck } = await supabaseAdmin
  .from('clients')
  .select('id')
  .eq('personnel_id', personnelData.id)
  .eq('tenant_id', tenant_id)
  .maybeSingle()

// 5. Si pas de client, le creer manuellement (filet de securite)
if (!clientCheck) {
  await supabaseAdmin.from('clients').insert({...})
}
```

---

## Fichiers a Modifier/Creer

| Fichier | Action | Description |
|---------|--------|-------------|
| Migration SQL | Creer | Corriger les 4 clients + ameliorer les triggers UPDATE et INSERT |
| `supabase/functions/create-user-with-personnel/index.ts` | Modifier | Ajouter verification post-creation du client |

---

## Garanties Apres Correction

| Scenario | Garanti |
|----------|---------|
| Creation via "Connecter votre Pharmacie" | Le trigger cree le client, l'Edge Function verifie |
| Creation via bouton header | Idem |
| Creation via Parametres/Utilisateurs | Idem |
| Transfert de tenant d'un personnel | Le trigger UPDATE met a jour le tenant_id du client |
| Echec silencieux du trigger | L'Edge Function cree le client en fallback |
| Donnees existantes incorrectes | Corrigees par la migration |


Contexte (ce que montrent tes logs)
- L’appel HTTP vers la RPC échoue : `POST /rest/v1/rpc/generate_lot_barcode → 404 Not Found`.
- Le message Supabase indique : “Could not find the function … in the schema cache”.
- Dans la base, la fonction `public.generate_lot_barcode` n’existe pas (confirmé).
- La colonne `lots.code_barre` n’existe pas non plus (confirmé via `information_schema`).
- La RPC `search_product_by_barcode` a bien été remplacée et contient déjà une logique qui référence `l.code_barre` — mais comme la colonne n’existe pas, elle pourrait planter au runtime dès qu’elle sera exécutée sur ce chemin de code.

Cause racine probable
1) La migration qui devait ajouter `lots.code_barre` + créer `lot_barcode_sequences` + créer la RPC `generate_lot_barcode` n’a pas été appliquée (ou n’existe pas dans l’historique des migrations actuellement déployées).
2) Même quand une fonction est créée, PostgREST peut ne pas la “voir” tout de suite à cause du cache de schéma, d’où l’erreur “schema cache”. Il faut déclencher un `NOTIFY pgrst, 'reload schema';` après les DDL.

Objectif du correctif
- Ajouter réellement la colonne `code_barre` à `public.lots`.
- Créer la table `public.lot_barcode_sequences` (compteur par tenant + date) pour garantir l’unicité même avec plusieurs réceptions dans la même journée, y compris pour un même fournisseur.
- Créer la RPC `public.generate_lot_barcode(p_tenant_id uuid, p_fournisseur_id uuid)` avec exactement ces noms/ordre de paramètres (pour correspondre à l’appel frontend).
- Recharger le schéma PostgREST pour que `/rpc/generate_lot_barcode` cesse de répondre 404.
- S’assurer que tout cela sera aussi disponible sur l’URL publiée (Live) après publication.

Plan d’implémentation (base de données)

Phase A — Migration “schéma lots + séquences + RPC”
1) Ajouter la colonne `code_barre` à `public.lots`
   - `ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS code_barre text;`
   - Ajouter un index unique partiel par tenant pour éviter les doublons :
     - `CREATE UNIQUE INDEX IF NOT EXISTS lots_tenant_code_barre_uniq ON public.lots(tenant_id, code_barre) WHERE code_barre IS NOT NULL;`
   - Ajouter un index de recherche (optionnel mais recommandé) :
     - `CREATE INDEX IF NOT EXISTS lots_code_barre_lookup ON public.lots(code_barre) WHERE code_barre IS NOT NULL;`

2) Créer la table `public.lot_barcode_sequences`
   - Colonnes : `id`, `tenant_id`, `date_key` (YYMMDD), `last_sequence`, timestamps.
   - Point important Supabase : utiliser `extensions.gen_random_uuid()` (et pas `gen_random_uuid()` nu) pour éviter les soucis de `search_path`.
   - Contrainte unique : `(tenant_id, date_key)`.

3) RLS sur `lot_barcode_sequences`
   - Activer RLS.
   - Ajouter politique “tenant access” basée sur la fonction existante `get_current_user_tenant_id()` (déjà utilisée ailleurs dans le projet).
   - Objectif : empêcher un tenant d’incrémenter la séquence d’un autre tenant.

4) Créer la RPC `public.generate_lot_barcode(p_tenant_id uuid, p_fournisseur_id uuid) returns text`
   - Récupérer `fournisseurs.nom` via `p_fournisseur_id`.
   - Produire un préfixe “4 lettres” :
     - uppercase
     - sans espaces
     - sans accents (via `translate`)
     - complété avec `X` si < 4 caractères
   - `date_key = to_char(current_date, 'YYMMDD')`
   - Incrément atomique :
     - `INSERT ... ON CONFLICT (tenant_id, date_key) DO UPDATE SET last_sequence = lot_barcode_sequences.last_sequence + 1 RETURNING last_sequence`
   - Format final :
     - `LOT-{FOUR}-{YYMMDD}-{00001}` (séquence sur 5 chiffres)
   - Permissions :
     - `GRANT EXECUTE ... TO authenticated`
   - (Optionnel) ajouter `SECURITY DEFINER` + `SET search_path TO public` comme déjà fait pour d’autres RPC, et garder le code strictement borné à `p_tenant_id` et à des tables publiques.

5) Recharger le schéma PostgREST en fin de migration
   - Ajouter :
     - `NOTIFY pgrst, 'reload schema';`
   - Ceci est crucial pour résoudre immédiatement le 404 `/rpc/generate_lot_barcode`.

Phase B — Vérifications après migration (Test/Preview)
6) Vérifier que le schéma est bien présent (requêtes de contrôle)
   - Colonne :
     - `select column_name from information_schema.columns where table_schema='public' and table_name='lots' and column_name='code_barre';`
   - Fonction :
     - `select proname, oidvectortypes(proargtypes) from pg_proc ... where proname='generate_lot_barcode';`
   - Test exécution :
     - appeler la fonction via SQL (ou depuis l’app) et vérifier le format.

7) Vérifier le flux “Réception”
   - Refaire une réception sur Preview :
     - les lots créés doivent avoir `code_barre` non null.
     - plus de 404 sur `/rpc/generate_lot_barcode`.
   - Vérifier le cas “2 réceptions même jour même fournisseur” :
     - les codes doivent continuer : `...-00001`, `...-00002`, etc. (pas de remise à zéro).

Phase C — Publication vers Live
8) Publier (Test → Live)
   - La migration doit être publiée pour que l’URL publiée (Live) ait aussi la colonne + la RPC.
   - Après publication, si Live renvoie encore 404, déclencher un reload schema via SQL Editor Live (rare si la migration contient déjà le NOTIFY, mais possible si délai de propagation).

Plan d’implémentation (application) — petites sécurisations
9) Ajuster le comportement si la RPC est indisponible (déjà partiellement fait)
   - Dans `useReceptions.ts`, conserver le try/catch, mais :
     - ne pas logguer “Lot créé avec code-barres: undefined” comme un succès.
     - stocker explicitement `null` dans `code_barre` si génération échoue.
   - Objectif : éviter de donner l’impression que tout est OK quand la RPC n’a pas répondu.

10) (Optionnel) Ajouter une “action correctrice” de backfill
   - Pour les lots déjà créés pendant la période où la RPC était absente :
     - soit un bouton admin “Générer code-barres manquants” (batch par tenant)
     - soit une requête SQL côté dashboard.
   - À décider après stabilisation.

Notes importantes (pour expliquer ce que tu as observé)
- Voir “la colonne dans Supabase” : si tu regardes le Table Editor mais que la migration n’a jamais ajouté la colonne, tu ne la verras pas. Et même si la colonne est ajoutée, PostgREST peut mettre un petit moment à refléter le schéma, d’où l’intérêt du `NOTIFY pgrst, 'reload schema'`.
- Le 404 sur `/rpc/generate_lot_barcode` est le symptôme direct : la fonction n’est pas exposée (car inexistante ou non vue par PostgREST).

Livrables attendus après implémentation
- `lots.code_barre` visible dans Supabase + accessible via PostgREST.
- `public.generate_lot_barcode` appelable via `supabase.rpc('generate_lot_barcode', { p_tenant_id, p_fournisseur_id })`.
- Réceptions : chaque lot nouvellement créé possède un code-barres au format demandé basé sur les 4 premières lettres du fournisseur.
- POS : la recherche prioritaire par `lots.code_barre` devient réellement fonctionnelle (puisque la colonne existe).

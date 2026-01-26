
Contexte et constat (diagnostic profond)
- Le problème actuel n’est pas lié à “date_peremption NULL” côté UI, mais au fait que l’appel RPC Supabase échoue avant même de renvoyer des produits.
- Le navigateur appelle : POST /rest/v1/rpc/get_pos_products avec un body contenant :
  - p_tenant_id
  - p_search
  - p_page_size
  - p_page
- Or, dans la base (environnement test), la fonction existante est :
  - public.get_pos_products(p_tenant_id uuid, p_search text, p_limit integer, p_offset integer)
  - et elle RETURNS TABLE (colonnes), pas RETURNS json.
- Avec PostgREST, si les noms d’arguments envoyés ne correspondent pas à la signature exposée, l’endpoint RPC renvoie typiquement une 404 (“No function matches …”), ce qui explique :
  - la roue qui tourne longtemps (retries / react-query)
  - puis “0 produits disponibles”
  - et surtout le 404 persistant sur /rpc/get_pos_products partout (preview + site publié) après les migrations.
- Une ancienne migration (20260126110706_34a6b259-3f0c-493a-b834-d1c727e21d35.sql) avait bien une version compatible avec le frontend :
  - arguments p_page_size / p_page
  - retour JSON { products, total_count, page, page_size, total_pages }
  - logique “NULL = valide” correctement intégrée
  - mais elle référence une table inexistante “categories” (et p.categorie_id), d’où la nécessité de la corriger en “famille_produit / famille_id”.
- Ensuite, une migration plus récente (20260126111735…) a écrasé la fonction avec p_limit/p_offset + RETURNS TABLE, ce qui casse le frontend et recrée le 404.

Objectif de correction
1) Restaurer une version unique et stable de get_pos_products :
   - signature attendue par le frontend (p_page_size, p_page)
   - RETURNS json (structure déjà attendue par usePOSProductsPaginated.ts)
   - jointure catégorie correcte : famille_produit via p.famille_id
   - conserver la logique demandée : (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
   - conserver earliest_expiration_date en excluant NULL (MIN sur lots date_peremption IS NOT NULL)
   - notifier PostgREST pour recharger le schéma (NOTIFY pgrst, 'reload schema')
2) Faire la même remise en cohérence pour search_product_by_barcode (utilisé dans l’autre flux POS), pour éviter un prochain blocage.
3) S’assurer que les droits d’exécution permettent l’usage réel dans l’app :
   - Si le POS est accessible sans session Supabase (anon), il faut GRANT à anon
   - Si le POS nécessite login (authenticated), il faut GRANT à authenticated
   - Pour maximiser la robustesse immédiate, on accordera aux deux (tout en notant la considération sécurité plus bas).

Étapes détaillées (implémentation)
A) Vérification / préparation
- Confirmer les colonnes réelles :
  - produits.famille_id existe (oui)
  - famille_produit.libelle_famille existe (oui)
  - produits.is_active existe (oui)
- Identifier et remplacer la fonction actuellement active (p_limit/p_offset).

B) Migration SQL (nouvelle migration)
1. Supprimer les fonctions incompatibles (toutes les variantes pertinentes) :
   - DROP FUNCTION IF EXISTS public.get_pos_products(uuid, text, integer, integer);
   - DROP FUNCTION IF EXISTS public.search_product_by_barcode(uuid, text);
2. Recréer public.get_pos_products avec la signature exacte attendue par le frontend :
   - (p_tenant_id uuid, p_search text default '', p_page_size integer default 50, p_page integer default 1)
   - RETURNS json
3. Dans le SELECT principal, remplacer :
   - LEFT JOIN categories c ON c.id = p.categorie_id
   par
   - LEFT JOIN famille_produit f ON f.id = p.famille_id
   et remplacer
   - COALESCE(c.libelle_categorie, 'Non catégorisé')
   par
   - COALESCE(f.libelle_famille, 'Non catégorisé')
4. Conserver/assurer la logique “date NULL = valide” :
   - has_valid_stock : AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
   - all_lots_expired : NOT EXISTS(...) avec la même condition
5. Conserver earliest_expiration_date sans que NULL “écrase” une vraie date :
   - MIN(l.date_peremption) avec filtre l.date_peremption IS NOT NULL
6. Recréer public.search_product_by_barcode en RETURNS json cohérent avec usePOSData.ts :
   - même jointure famille_produit / famille_id
   - même logique NULL = valide
7. Permissions :
   - GRANT EXECUTE ON FUNCTION … TO authenticated, anon;
8. Recharger le cache PostgREST :
   - NOTIFY pgrst, 'reload schema';

C) Contrôles après migration (test)
- Test SQL direct (dans l’éditeur SQL Supabase) :
  - SELECT public.get_pos_products('5b752062-3e24-47bd-93b8-004a4dcfb5b0'::uuid, 'VERMOX', 50, 1);
  - Vérifier que le JSON contient products (non vide) et que les champs utilisés par le frontend existent :
    - libelle_produit, dci_nom, code_cip
    - prix_vente_ht, prix_vente_ttc, taux_tva, tva_montant, taux_centime_additionnel, centime_additionnel_montant
    - stock_disponible
    - category
    - earliest_expiration_date, has_valid_stock, all_lots_expired
- Test UI (preview) :
  - Aller POS > Recherche de produits
  - Taper “VE” puis “VERMOX”
  - Confirmer que la liste apparaît, que le compteur n’est plus à 0, et que le bouton “Ajouter” n’est pas bloqué quand date_peremption est NULL.

D) Déploiement / propagation au site publié
- Une fois validé en preview (test), publier pour propager la migration au live.
- Refaire un test rapide sur l’URL publiée.

Risques / points d’attention
- Sécurité (important) :
  - Ces fonctions sont SECURITY DEFINER et prennent p_tenant_id en paramètre. Si on autorise anon, un utilisateur non authentifié pourrait théoriquement interroger un autre tenant en devinant l’UUID.
  - Correctif robuste (optionnel mais recommandé ensuite) :
    - exiger authenticated uniquement
    - et/ou vérifier auth.uid() appartient au tenant via un RPC de vérification (ex: verify_user_belongs_to_tenant) à l’intérieur de la fonction.
  - Pour corriger l’urgence (réafficher les produits), l’objectif prioritaire est d’éliminer le 404 et de restaurer la compatibilité. Une passe “durcissement sécurité” pourra suivre.

Pourquoi ce plan va corriger ton symptôme “0 produits disponibles + 404”
- Le 404 vient d’un mismatch de signature (p_page_size/p_page envoyés, p_limit/p_offset attendus).
- En restaurant la signature et le type de retour attendus, PostgREST “trouve” la fonction et renvoie le JSON.
- Le frontend peut alors mapper correctement products → POSProduct, et l’écran se remplit à nouveau.

Livrables attendus (après approbation et exécution)
- Une nouvelle migration SQL qui :
  - remplace définitivement la version “p_limit/p_offset RETURNS TABLE”
  - recrée get_pos_products + search_product_by_barcode compatibles frontend
  - corrige categories → famille_produit
  - conserve la logique NULL date_peremption = valide
- Résultat visible : la recherche produit refonctionne (Séparé et Non séparé), et les produits avec date_peremption NULL ne sont plus bloqués ni affichés comme expirés.

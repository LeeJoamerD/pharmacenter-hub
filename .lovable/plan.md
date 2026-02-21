

# Implementation des sous-fonctionnalites VIDAL manquantes

## 1. Bug fix : Action `search-atc` manquante dans l'Edge Function

**Probleme** : Le composant `TherapeuticClassManager.tsx` (ligne 161) appelle `action: 'search-atc'` mais cette action n'existe pas dans `supabase/functions/vidal-search/index.ts`. L'Edge Function retourne `INVALID_ACTION`.

**Solution** : Ajouter un bloc `search-atc` dans l'Edge Function utilisant l'endpoint VIDAL `/rest/api/atc-classifications?q={query}`. Le parsing XML reutilisera le meme pattern que `get-atc-children` (extraction de `id`, `code`, `label`) et retournera `{ classifications: [...] }` comme attendu par le frontend.

**Fichier modifie** : `supabase/functions/vidal-search/index.ts`

---

## 2. Synchronisation periodique : Diff automatique des produits

**Probleme** : L'action `check-version` detecte une nouvelle version VIDAL et met a jour `VIDAL_LAST_VERSION`, mais il n'y a aucun mecanisme pour identifier les produits nouveaux ou supprimes entre deux versions.

**Solution** : Ajouter une action `diff-catalog` dans l'Edge Function qui :
1. Recupere tous les `vidal_product_id` du `catalogue_global_produits`
2. Pour un lot de produits (par pages), interroge VIDAL pour verifier leur statut de commercialisation
3. Signale les produits dont le `marketStatus` a change (retires, suspendus)
4. Retourne un rapport `{ changed: [...], removed: [...], checkedCount }` 

Cote frontend, ajouter un bouton "Verifier les changements" dans `GlobalCatalogManager.tsx` qui appelle cette action et affiche le resultat dans un dialogue.

**Fichiers modifies** :
- `supabase/functions/vidal-search/index.ts` (action `diff-catalog`)
- `src/components/platform-admin/GlobalCatalogManager.tsx` (bouton + dialogue de diff)

---

## 3. Donnees de conditionnement dans la fiche produit

**Probleme** : `VidalProductSheet.tsx` affiche la conservation (`storageCondition`) mais pas les informations de conditionnement (nombre d'unites par boite, type de contenant, etc.).

**Solution** : Dans l'action `get-product-info` de l'Edge Function, extraire les champs supplementaires du XML produit :
- `<vidal:packagingDetails>` ou `<vidal:itemQuantity>` pour le nombre d'unites
- `<vidal:container>` pour le type de contenant

Cote frontend dans `VidalProductSheet.tsx`, ajouter une sous-section "Conditionnement" sous la section "Conservation" existante.

**Fichiers modifies** :
- `supabase/functions/vidal-search/index.ts` (enrichir `get-product-info`)
- `src/components/shared/VidalProductSheet.tsx` (afficher conditionnement)

---

## 4. Widget Actualites Therapeutiques (fonctionnalite 5 - completement absente)

**Probleme** : Aucune implementation n'existe pour les actualites VIDAL. Il n'y a ni action backend, ni composant frontend.

**Solution** :

### Backend (Edge Function)
Ajouter une action `get-news` dans `vidal-search/index.ts` :
- Appelle `GET /rest/news?{authParams}` 
- Parse le flux Atom pour extraire les entrees avec : `id`, `title`, `summary`, `updated`, `category`, liens
- Retourne `{ news: [...] }`

### Frontend
Creer un composant `src/components/shared/VidalNewsWidget.tsx` :
- Appel lazy (au montage) de l'action `get-news`
- Affiche les actualites dans une carte compacte avec :
  - Icone d'alerte pour les retraits/ruptures
  - Badge de categorie (ANSM, HAS, EMA)
  - Date et titre cliquable
  - Skeleton loading et gestion d'erreur
- Limite a 10 actualites les plus recentes
- Bouton "Rafraichir"

### Integration dans le tableau de bord
Integrer `VidalNewsWidget` dans `PlatformOverview.tsx` (admin plateforme) comme carte supplementaire en bas de page.

**Fichiers modifies/crees** :
- `supabase/functions/vidal-search/index.ts` (action `get-news`)
- `src/components/shared/VidalNewsWidget.tsx` (nouveau composant)
- `src/components/platform-admin/PlatformOverview.tsx` (integration du widget)

---

## Resume technique

| Tache | Fichiers | Complexite |
|-------|---------|------------|
| Bug `search-atc` | Edge Function | Faible - ajout d'un bloc de 30 lignes |
| Diff catalogue | Edge Function + GlobalCatalogManager | Moyenne - logique de comparaison en lots |
| Conditionnement | Edge Function + VidalProductSheet | Faible - extraction XML + affichage |
| Actualites VIDAL | Edge Function + nouveau composant + PlatformOverview | Moyenne - nouveau flux complet |

## Ordre d'implementation

1. Bug `search-atc` (correctif critique, debloque le referentiel)
2. Actualites VIDAL (fonctionnalite completement absente)
3. Conditionnement produit (enrichissement mineur)
4. Diff catalogue (fonctionnalite avancee)

## Ce qui ne change PAS

- `VidalSubstitutionsPanel.tsx` : deja 100% operationnel
- Les actions existantes (`search`, `check-version`, `get-product-info`, `get-generic-group`, etc.) : toutes fonctionnelles
- `GlobalCatalogVidalSearch.tsx` : import VIDAL operationnel
- `TherapeuticClassManager.tsx` : le frontend est deja correct, seul le backend manque


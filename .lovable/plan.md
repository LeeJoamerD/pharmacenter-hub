
# Substitutions Generiques VIDAL

## Objectif

Enrichir la fiche produit VIDAL existante (`VidalProductSheet`) avec un onglet/section "Substitutions" qui affiche les alternatives therapeutiques via 4 sources VIDAL : groupe generique, groupe biosimilaire, meme VMP et meme classe ATC.

---

## 1. Nouvelles actions Edge Function

### Fichier : `supabase/functions/vidal-search/index.ts`

Ajouter 3 nouvelles actions (la 4e `get-atc-children` existe deja et peut etre reutilisee) :

**Action `get-generic-group`** :
- Appelle `GET /rest/api/product/{productId}/generic-group`
- Parse les entries XML pour extraire les produits du groupe generique (id, nom, laboratoire, forme)
- Retourne un tableau de produits generiques

**Action `get-biosimilar-group`** :
- Appelle `GET /rest/api/product/{productId}/biosimilar-group`
- Parse les entries XML de la meme facon
- Retourne un tableau de produits biosimilaires

**Action `get-vmp-products`** :
- Necessite d'abord d'extraire le VMP id depuis la fiche produit (deja disponible via `get-product-info`)
- Appelle `GET /rest/api/vmp/{vmpId}/products`
- Parse les entries pour lister tous les produits partageant la meme VMP
- Retourne un tableau de produits

**Action `get-product-atc`** :
- Appelle `GET /rest/api/product/{productId}/atc-classification`
- Retourne la classification ATC du produit (id, code, libelle)
- Le frontend pourra ensuite utiliser `get-atc-children` pour naviguer ou lister les produits de meme classe

Pour chaque action, le parsing des entries XML suit le pattern existant : extraction de l'id depuis `<id>`, du nom depuis `<title>` ou `<summary>`, et des champs VIDAL specifiques (laboratoire, forme, etc.).

---

## 2. Nouveau composant : `VidalSubstitutionsPanel.tsx`

### Fichier : `src/components/shared/VidalSubstitutionsPanel.tsx`

Composant reutilisable qui prend en props :
- `productId` : identifiant VIDAL du produit
- `productName` : nom du produit (pour l'affichage)

Le composant :
1. Affiche 4 sections avec des Accordions ou Tabs :
   - **Groupe generique** : appelle `get-generic-group`, affiche la liste des generiques avec nom, laboratoire
   - **Groupe biosimilaire** : appelle `get-biosimilar-group`, affiche les biosimilaires
   - **Meme substance active (VMP)** : appelle `get-vmp-products`, affiche les produits partageant la meme VMP
   - **Meme classe ATC** : appelle `get-product-atc` puis affiche le code ATC avec possibilite de naviguer
2. Chaque section se charge a la demande (lazy loading) quand l'utilisateur l'ouvre
3. Affiche un compteur de resultats dans l'en-tete de chaque section
4. Chaque produit affiche : nom, laboratoire, forme galenique (si disponible)

---

## 3. Integration dans `VidalProductSheet.tsx`

### Fichier : `src/components/shared/VidalProductSheet.tsx`

Modifications :
- Ajouter le composant `VidalSubstitutionsPanel` en tant que nouvelle section apres "Monographie"
- Section titree "Substitutions et equivalences"
- Le panel se charge uniquement quand la fiche est ouverte et les donnees principales sont chargees
- Utilise le `productId` deja disponible dans le composant parent

---

## 4. Integration dans le modal de substitution stock

### Fichier : `src/components/dashboard/modules/stock/current/modals/SubstituteProductSearchModal.tsx`

Enrichir la recherche de substituts existante :
- Ajouter un bouton "Chercher dans VIDAL" pour chaque produit en rupture
- Si le produit a un `vidal_product_id` (resolu via `catalogue_global_produits` par `code_cip`) :
  - Appelle `get-generic-group` et `get-vmp-products`
  - Affiche les resultats VIDAL dans une section separee "Suggestions VIDAL"
  - Chaque suggestion VIDAL affiche le nom et indique si le produit existe dans le stock local (par comparaison de code CIP)
- Cela combine les suggestions locales (basees sur famille/classe) avec les suggestions VIDAL (basees sur les donnees reglementaires)

---

## Section technique

### Endpoints VIDAL utilises

```text
GET /rest/api/product/{id}/generic-group       -> produits du meme groupe generique
GET /rest/api/product/{id}/biosimilar-group     -> produits biosimilaires
GET /rest/api/vmp/{vmpId}/products              -> produits partageant la meme VMP
GET /rest/api/product/{id}/atc-classification   -> classification ATC du produit
```

### Structure des reponses attendues

Les entries XML suivent le meme format ATOM :
```xml
<entry>
  <id>vidal://product/15070</id>
  <title>AMOXICILLINE BIOGARAN 500 mg glules</title>
  <summary>AMOXICILLINE BIOGARAN 500 mg glules</summary>
  <vidal:company name="BIOGARAN"/>
  <vidal:galenicForm name="gelule"/>
</entry>
```

### Extraction du VMP id

Le VMP id est extrait depuis la reponse de `get-product-info` (tag `<link title="VMP">` ou `<vidal:vmp>`) ou via un appel dedie. L'action `get-vmp-products` acceptera soit un `vmpId` direct, soit un `productId` et resoudra le VMP en interne.

### Resolution pour le modal de substitution stock

Le `SubstituteProductSearchModal` recoit des `CurrentStockItem` qui ont un `code_cip`. La resolution VIDAL se fait via :
1. Chercher dans `catalogue_global_produits` le `vidal_product_id` correspondant au `code_cip`
2. Si trouve, appeler les actions VIDAL de substitution
3. Croiser les resultats VIDAL avec le stock local pour indiquer la disponibilite

### Fichiers modifies / crees

- `supabase/functions/vidal-search/index.ts` : 4 nouvelles actions (get-generic-group, get-biosimilar-group, get-vmp-products, get-product-atc)
- `src/components/shared/VidalSubstitutionsPanel.tsx` : nouveau composant (panel de substitutions)
- `src/components/shared/VidalProductSheet.tsx` : integration du panel de substitutions
- `src/components/dashboard/modules/stock/current/modals/SubstituteProductSearchModal.tsx` : enrichissement avec suggestions VIDAL

Aucune migration SQL n'est necessaire.

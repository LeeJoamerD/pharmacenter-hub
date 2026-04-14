
Objectif: corriger définitivement la RPC `search_product_by_barcode(uuid, text)` car la version actuellement déployée référence encore des colonnes inexistantes dans `produits`, ce qui bloque toute recherche code-barres.

1. Confirmer l’état réel en base avant toute nouvelle correction
- Lire la définition active de `public.search_product_by_barcode(uuid, text)` dans Supabase.
- Vérifier les colonnes réelles de `produits`, `lots`, `dci` et `famille_produit`.
- But: éviter de patcher encore “à l’aveugle”, car les migrations du repo montrent plusieurs versions contradictoires.

2. Réécrire proprement la RPC active avec uniquement des colonnes vérifiées
- Remplacer les champs obsolètes actuellement utilisés par la dernière migration:
  - `p.tva_montant` -> ne pas l’utiliser si absent
  - `p.centime_additionnel_montant` -> ne pas l’utiliser si absent
  - `p.ordonnance_requise` -> `p.prescription_requise`
- Conserver les jointures correctes déjà identifiées:
  - `LEFT JOIN dci d ON d.id = p.dci_id`
  - `LEFT JOIN famille_produit f ON f.id = p.famille_id`
- Conserver la recherche dans le bon ordre:
  - code-barres lot exact
  - numéro de lot exact
  - préfixe lot
  - code produit (`code_cip`, `code_barre_externe`, `ancien_code_cip`)

3. Calculer les montants au lieu de lire des colonnes inexistantes
- Retour RPC à stabiliser pour le frontend actuel:
  - `taux_tva`
  - `tva_montant`
  - `taux_centime_additionnel`
  - `centime_additionnel_montant`
- Source de vérité:
  - si lot trouvé: utiliser `lots.montant_tva` et `lots.montant_centime_additionnel`
  - sinon: calculer depuis le produit à partir de `prix_vente_ht`, `taux_tva`, `tva`, `taux_centime_additionnel` ou `centime_additionnel` selon les colonnes réellement présentes
- Cela évite les nouvelles erreurs `42703`.

4. Préserver la compatibilité frontend
- Garder la signature TABLE attendue par:
  - `src/hooks/usePOSData.ts`
  - `src/hooks/usePOSProductsPaginated.ts`
- Conserver les champs déjà consommés:
  - `dci`
  - `category`
  - `requires_prescription`
  - `lot_id`
  - `numero_lot`
  - `date_peremption`
  - `prix_achat_unitaire`
- Réajouter `code_barre_lot` si nécessaire, car `usePOSData` l’utilise déjà pour remplir `lot.code_barre`.

5. Vérification après migration
- Tester de nouveau les cas suivants:
  - scan code-barres lot exact
  - scan numéro de lot
  - scan code produit (`code_cip`, `code_barre_externe`, `ancien_code_cip`)
- Vérifier en console:
  - disparition des erreurs `400`
  - disparition des erreurs `42703`
  - retour d’une ligne RPC quand le produit existe

Détail technique
```text
Constat le plus probable:
la migration 20260414021625... a réintroduit un mauvais schéma:
- p.tva_montant
- p.centime_additionnel_montant
- p.ordonnance_requise

Alors que l’historique du projet montre plutôt:
- p.tva
- p.centime_additionnel
- p.prescription_requise

Et le frontend attend toujours:
- tva_montant
- centime_additionnel_montant
Donc la RPC doit exposer ces champs en sortie, mais pas forcément les lire tels quels depuis `produits`.
```

Fichiers / zones concernées
- `supabase/migrations/new migration`
- vérification de compatibilité avec:
  - `src/hooks/usePOSData.ts`
  - `src/hooks/usePOSProductsPaginated.ts`

Résultat attendu
- Le scan ne casse plus côté SQL.
- Le produit est retrouvé quand le code existe.
- Les montants fiscaux retournés restent compatibles avec le POS existant.
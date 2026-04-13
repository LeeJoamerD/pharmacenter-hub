
Objectif: corriger la vraie cause du blocage et finaliser le flux de scan au POS.

Constat confirmé
- Je ne me suis pas “arrêté” volontairement: le blocage réel est maintenant identifié.
- La RPC `search_product_by_barcode` actuellement déployée contient encore:
  - `p.code_ean`
  - `p.code_interne`
- Or, dans la table `public.produits`, ces colonnes n’existent pas. Les colonnes présentes sont:
  - `code_cip`
  - `code_barre_externe`
  - `ancien_code_cip`
- Résultat: dès qu’un scan arrive et que la recherche tombe sur l’étape “code produit”, Postgres renvoie `42703`, donc:
  - le champ est vidé par le gestionnaire du scanner,
  - aucun produit n’est ajouté,
  - le toast d’erreur s’affiche.

Plan de correction
1. Corriger la fonction SQL `search_product_by_barcode`
- Remplacer les références invalides:
  - supprimer `p.code_ean`
  - supprimer `p.code_interne`
- Utiliser les bonnes colonnes:
  - `p.code_cip`
  - `p.code_barre_externe`
  - `p.ancien_code_cip`
- Garder la priorité déjà voulue:
  1. `lots.code_barre`
  2. `lots.numero_lot`
  3. recherche produit via colonnes valides
- Conserver la normalisation `° -> -` côté SQL.

2. Renforcer la normalisation du scanner AZERTY/QWERTY
- Étendre le mapping du scanner pour couvrir aussi les majuscules:
  - `Q -> A`, `A -> Q`, `W -> Z`, `Z -> W`
- Vérifier que le scan `LOT°LQBO°260401°00083` soit bien reconstruit en une valeur exploitable.
- Garder la conversion en majuscules et la longueur max à 50.

3. Éviter le “vide silencieux” côté UX
- Conserver l’effacement du champ après scan, mais améliorer le comportement d’erreur:
  - si la RPC échoue, afficher un message plus explicite dans le toast/console
  - éviter que l’échec paraisse silencieux.
- Vérifier les callbacks dans:
  - `src/components/dashboard/modules/sales/pos/SalesOnlyInterface.tsx`
  - `src/components/dashboard/modules/sales/POSInterface.tsx`

4. Vérifier les flux de recherche concernés
- `src/hooks/usePOSData.ts`
- `src/hooks/usePOSProductsPaginated.ts`
- S’assurer que les deux chemins utilisent une logique cohérente:
  - normalisation du code-barres
  - même RPC corrigée
  - même comportement en cas d’erreur.

Fichiers concernés
- `supabase/migrations/...` : nouvelle migration pour redéfinir `public.search_product_by_barcode`
- `src/utils/barcodeScanner.ts`
- éventuellement ajustements mineurs dans:
  - `src/hooks/usePOSData.ts`
  - `src/hooks/usePOSProductsPaginated.ts`

Résultat attendu après correction
- Un scan lecteur ne provoque plus d’erreur 400.
- Le code lot est correctement normalisé même avec le clavier/scanner AZERTY.
- Le produit correspondant est retrouvé ou un message d’erreur clair est affiché.
- Le flux redevient fonctionnel pour les scans réels au Point de Vente.

Détail technique
```text
Cause principale actuelle:
RPC déployée invalide
-> référence p.code_ean / p.code_interne
-> erreur Postgres 42703
-> requête RPC 400
-> scan vidé, aucun produit ajouté

Cause secondaire probable:
mapping scanner incomplet sur certaines lettres majuscules
-> LQBO au lieu de LABO
```


Objectif: reprendre là où ça s’est bloqué et corriger la régression complète du scan + de la saisie manuelle.

Constat confirmé dans le code actuel
- Le vrai blocage principal est toujours présent dans la migration la plus récente de `search_product_by_barcode`:
  - `supabase/migrations/20260413222101_d35314f1-6b6a-4922-88ec-b56255d2e54d.sql`
  - elle référence encore `p.code_ean` et `p.code_interne`
- Donc même après le “correctif” précédent, la version réellement retenue dans le repo reste incompatible avec le schéma réel (`code_cip`, `code_barre_externe`, `ancien_code_cip`).
- Côté frontend, il y a aussi un conflit de listeners:
  - `POSInterface.tsx` enregistre encore un scanner global avec `setupBarcodeScanner(...)`
  - `POSBarcodeActions.tsx` enregistre aussi un scanner
  - résultat probable: scans traités deux fois, comportement incohérent, champ vidé puis flux interrompu.
- La logique d’effacement du champ dans `barcodeScanner.ts` repose sur `currentVal.endsWith(scannedText)`, mais le texte visible dans l’input peut être différent du buffer normalisé (`)` vs `°`, `q` vs `A`, etc.), donc le nettoyage peut échouer ou devenir incohérent.
- La recherche manuelle a aussi régressé:
  - `ProductSearch.tsx` force bien `.toUpperCase()`
  - mais il n’existe pas de normalisation partagée frontend pour aligner la saisie manuelle avec la logique scanner et la RPC.

Plan de correction
1. Corriger définitivement la RPC `search_product_by_barcode`
- Créer une nouvelle migration qui remplace la fonction actuelle.
- Supprimer toute référence à:
  - `p.code_ean`
  - `p.code_interne`
- Utiliser uniquement:
  - `p.code_cip`
  - `p.code_barre_externe`
  - `p.ancien_code_cip`
- Conserver:
  - priorité lot (`lots.code_barre`, `lots.numero_lot`)
  - matching partiel/préfixe
  - normalisation serveur `° -> -`

2. Centraliser la normalisation des codes-barres côté frontend
- Introduire une fonction partagée du type `normalizeBarcodeInput(...)` utilisée à la fois par:
  - le scanner physique
  - le champ `ProductSearch`
  - `usePOSData`
  - `usePOSProductsPaginated`
- Cette normalisation devra:
  - forcer en majuscules
  - convertir les caractères AZERTY parasites
  - garder `°` côté UI si nécessaire
  - produire une valeur cohérente pour la RPC

3. Corriger le moteur du scanner
- Refactorer `src/utils/barcodeScanner.ts` pour ne plus dépendre d’une comparaison fragile entre:
  - valeur réellement injectée dans l’input
  - buffer normalisé
- Intercepter/annuler plus tôt les frappes détectées comme scan rapide afin d’éviter que le champ soit pollué.
- Garder le support Caps Lock activé et désactivé.
- Vérifier les mappings AZERTY/QWERTY déjà ajoutés et les compléter si besoin.

4. Supprimer le doublon de scanner sur le POS
- Dans `POSInterface.tsx`, retirer le `useEffect` qui appelle directement `setupBarcodeScanner(...)`.
- Garder une seule source de scan via `POSBarcodeActions.tsx`.
- Vérifier que `SalesOnlyInterface.tsx` reste bien sans doublon.

5. Réparer la saisie manuelle
- Dans `ProductSearch.tsx`, appliquer la normalisation partagée sur chaque saisie utilisateur, pas seulement `toUpperCase()`.
- S’assurer qu’un code entré manuellement suit exactement le même chemin qu’un code scanné.
- Réviser le minimum de déclenchement et la détection `looksLikeBarcode(...)` si nécessaire pour ne pas bloquer les lots fournisseur.

6. Améliorer le retour d’erreur
- Quand la RPC échoue, afficher un toast explicite avec un message métier clair au lieu d’un simple “produit non trouvé”.
- Distinguer:
  - erreur technique RPC
  - aucun produit trouvé
- Ajouter des logs frontend ciblés temporaires si nécessaire pour confirmer:
  - valeur brute scannée
  - valeur normalisée
  - résultat RPC

Fichiers à modifier
- `supabase/migrations/...` nouvelle migration corrective
- `src/utils/barcodeScanner.ts`
- `src/components/dashboard/modules/sales/POSInterface.tsx`
- `src/components/dashboard/modules/sales/pos/POSBarcodeActions.tsx`
- `src/components/dashboard/modules/sales/pos/ProductSearch.tsx`
- `src/hooks/usePOSData.ts`
- `src/hooks/usePOSProductsPaginated.ts`

Résultat attendu
- Scan fonctionnel avec Caps Lock activé ou désactivé
- Plus de double traitement du scan
- Plus de vidage silencieux incompréhensible
- Recherche manuelle restaurée
- RPC alignée avec le vrai schéma SQL
- Le code lot scanné ou saisi retrouve à nouveau le produit quand il existe

Détail technique
```text
Causes racines identifiées:
1. Migration la plus récente toujours erronée
   -> p.code_ean / p.code_interne
   -> casse la RPC réelle

2. Deux listeners scanner en parallèle
   -> POSInterface + POSBarcodeActions
   -> scans doublés / effets de bord

3. Nettoyage input fragile
   -> compare texte affiché vs buffer normalisé
   -> comportement incohérent selon Caps Lock / layout clavier

4. Saisie manuelle non unifiée
   -> uppercase seule
   -> pas de normalisation partagée complète
```

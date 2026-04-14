
Correction ciblée à faire : la RPC `search_product_by_barcode(uuid, text)` encore active est toujours basée sur un corps obsolète. L’erreur actuelle `column d.nom does not exist` montre que la dernière migration n’a corrigé que la famille, pas la colonne DCI. En relisant les migrations, on voit aussi d’anciens restes de schéma (`code_ean`, `code_interne`) qui peuvent encore casser la recherche produit même après correction du DCI.

Plan proposé :

1. Réécrire complètement la RPC active
- Créer une nouvelle migration `CREATE OR REPLACE FUNCTION public.search_product_by_barcode(p_tenant_id uuid, p_barcode text)`.
- Repartir d’une version “saine” au lieu de patcher la version cassée.
- Conserver la logique actuelle utile :
  - recherche prioritaire par `lots.code_barre`
  - fallback `lots.numero_lot`
  - fallback par préfixe
  - fallback produit
  - retour du lot trouvé + stock total

2. Aligner la RPC sur le vrai schéma
- Remplacer `d.nom` par `d.nom_dci`
- Garder `famille_produit` + `libelle_famille`
- Pour la recherche produit, ne garder que les colonnes réelles :
  - `produits.code_cip`
  - `produits.code_barre_externe`
  - `produits.ancien_code_cip`
- Supprimer toute référence à :
  - `familles`
  - `f.nom`
  - `code_ean`
  - `code_interne`

3. Stabiliser les champs retournés
- Vérifier que la signature de retour reste compatible avec le frontend actuel :
  - `dci`
  - `category`
  - `lot_id`
  - `numero_lot`
  - `date_peremption`
  - `prix_achat_unitaire`
  - idéalement `code_barre_lot` aussi, car `usePOSData` l’utilise déjà si présent
- Éviter de changer le contrat frontend tant que non nécessaire

4. Vérification après migration
- Tester à nouveau un scan réel
- Vérifier que l’erreur SQL disparaît de la console
- Vérifier les 3 cas :
  - scan d’un code-barres de lot
  - scan d’un numéro de lot
  - scan d’un code produit (`code_cip` / `code_barre_externe` / `ancien_code_cip`)

Détail technique
```text
Erreur actuelle :
42703: column d.nom does not exist

Cause probable :
La RPC active contient encore :
- d.nom
et possiblement d’autres reliquats :
- code_ean
- code_interne

Version attendue :
- LEFT JOIN dci d ON d.id = p.dci_id
- d.nom_dci AS dci
- LEFT JOIN famille_produit f ON f.id = p.famille_id
- COALESCE(f.libelle_famille, 'Non catégorisé') AS category
- fallback produit sur :
  p.code_cip / p.code_barre_externe / p.ancien_code_cip
```

Fichiers concernés
- `supabase/migrations/new migration`
- éventuellement régénération automatique de `src/integrations/supabase/types.ts` via Supabase, sans édition manuelle

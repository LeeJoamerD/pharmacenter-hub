

## Diagnostic

### Probleme 1 : Le chiffre `6` est transforme en `-`
Dans `src/utils/barcodeScanner.ts`, la table `AZERTY_NO_SHIFT_MAP` (ligne 19-23) mappe les caracteres AZERTY sans Shift vers les chiffres attendus. La touche `6` sur AZERTY produit `-` sans Shift, mais l'entree `'-': '6'` est absente de la table. Le `-` passe donc tel quel, corrompant le code-barres.

### Probleme 2 : Erreur PGRST203 (function overloading)
Il existe **deux versions** de `search_product_by_barcode` dans la base :
- `(p_barcode text, p_tenant_id uuid)` — ancienne version
- `(p_tenant_id uuid, p_barcode text)` — nouvelle version

PostgREST ne peut pas choisir laquelle appeler. Il faut supprimer l'ancienne.

## Plan

### 1. Migration SQL : supprimer l'ancienne surcharge
- `DROP FUNCTION IF EXISTS public.search_product_by_barcode(text, uuid);`
- Ne garder que la version `(p_tenant_id uuid, p_barcode text)`

### 2. Corriger le mapping AZERTY dans `barcodeScanner.ts`
- Ajouter `'-': '6'` dans `AZERTY_NO_SHIFT_MAP`

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/migrations/...` | DROP de l'ancienne surcharge |
| `src/utils/barcodeScanner.ts` | Ajout `'-': '6'` dans AZERTY_NO_SHIFT_MAP |


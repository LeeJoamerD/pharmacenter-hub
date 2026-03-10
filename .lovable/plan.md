

## Problem Analysis

The `enrichPricesFromGlobalCatalog` function searches the **global catalog** using the raw CIP codes from the Excel file (e.g., `31001126`). However, the global catalog stores full EAN-13 codes (e.g., `8902031001126`). The local `produits` table matches via `code_cip`, `ancien_code_cip`, OR `code_barre_externe`, so validation succeeds. But the global catalog price lookup fails because the short Excel codes don't match the global catalog's `code_cip` or `ancien_code_cip`.

**Result**: All 1245 lines pass validation with `prixAchatReel = 0`, the enrichment finds no matches, and prices stay at 0.

## Fix

Modify `enrichPricesFromGlobalCatalog` in `ReceptionExcelImport.tsx` to use a **two-step lookup**:

1. First, get the local products' `code_cip` values (already matched during validation via `produitId`)
2. Use THOSE codes to search the global catalog for prices

### Technical Changes

**File: `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx`**

Rewrite `enrichPricesFromGlobalCatalog` (~lines 651-714):

```
Step 1: Collect all produitId from lines where prixAchatReel === 0
Step 2: Fetch local products by ID → get their code_cip, ancien_code_cip
Step 3: Search global catalog by those local product codes (code_cip + ancien_code_cip)
Step 4: Build a mapping: produitId → global catalog prices
Step 5: Apply prices based on regionCode (PNR → prix_achat_reference_pnr, else → prix_achat_reference)
```

This ensures the price lookup uses the correct product identifiers from the local database, which are known to match the global catalog format.


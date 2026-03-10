

## Diagnosis

The table renders from `parseResult.lines` (line 1762). The `enrichPricesFromGlobalCatalog` function may be running correctly but the results might not reach the UI due to multiple possible failure points (closure issues, empty maps, code mismatches). After 4 failed attempts, the safest approach is what you asked: a simple, brute-force price enrichment that runs **after everything else** and directly updates the displayed lines.

## Plan

**File: `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx`**

1. **Add a new simple function `forceEnrichPricesFromCatalog`** that:
   - Takes the final `parseResult.lines` after validation is complete
   - For each line with `prixAchatReel === 0` and a `produitId`:
     - Queries `produits` table to get `code_cip` and `ancien_code_cip`
     - Queries `catalogue_global_produits` by those codes
     - Applies the PNR/BZV pricing rule
   - Uses batch queries (chunks of 200) for efficiency
   - Adds `console.log` at each step for debugging
   - Directly calls `setParseResult(prev => ...)` with the enriched lines

2. **Call this function at the END of `validateData`**, after `setValidationResult(finalResult)` — so it runs as a completely independent final step, with no dependency on closures or intermediate state.

3. **Add console.log** statements inside to trace:
   - How many lines need enrichment
   - How many local product codes were found
   - How many global catalog matches were found
   - How many prices were applied

This is intentionally simple and self-contained — no optimization, no shared state, just a direct DB query loop that updates prices.


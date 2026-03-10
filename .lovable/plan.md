

# Diagnostic and Fix Plan: Global Catalog Prices Not Appearing

## Root Cause Analysis

After thorough investigation across 10+ iterations, the code for enrichment IS correctly written (logs, queries, state updates). However, the console shows **zero enrichment logs** (`[enrichPrices]`, `[enrichFinal]`), which means the enrichment code simply **never executes in the user's browser**.

The most likely explanation: **multiple competing `setParseResult` calls and React batching**. The flow inside `validateData` does:
1. Line 769: `enrichPricesFromGlobalCatalog()` returns enriched lines
2. Line 772: `setParseResult(prev => ...)` with enriched lines
3. Line 780: Re-validates with enriched lines
4. Line 781: `setValidationResult(finalResult)` — triggers re-render
5. Line 869: `setParseResult(prev => ...)` — second enrichment pass

React batches these state updates. The final rendered state of `parseResult.lines` may still contain the **original un-enriched lines** because the second `setParseResult` at line 869 only fires if `priceCount > 0`, but the first enrichment already set prices, so the second pass finds nothing to fix. Meanwhile, the first `setParseResult` at line 772 might get overridden by internal React batching with the original parse result.

## New Approach: Dedicated "Enrich Prices" Button

Instead of fixing the fragile inline enrichment (which has failed across 10+ iterations), I will add a **visible, independent button** that the user clicks AFTER validation to fetch prices. This eliminates all closure, batching, and timing issues.

### Changes in `ReceptionExcelImport.tsx`

1. **Add a new standalone function `handleEnrichPrices`** that:
   - Reads directly from the current `parseResult.lines` state (no closures)
   - Filters lines with `prixAchatReel === 0` and a `produitId` (from validation)
   - Fetches local `code_cip`/`ancien_code_cip` from `produits` table
   - Queries `catalogue_global_produits` for reference prices
   - Applies regional pricing logic (PNR vs BZV)
   - Updates `parseResult` state with enriched lines
   - Has its own loading state and detailed console logging
   - Shows a toast with how many prices were applied

2. **Add a button** in the UI after the validation results section (near line 1750):
   ```
   [🔄 Enrichir les prix depuis le catalogue global (X lignes sans prix)]
   ```
   - Only visible when `validationResult` exists and there are lines with `prixAchatReel === 0`
   - Has its own `enrichingPrices` loading spinner
   - Disabled when no lines need enrichment

3. **Keep the existing inline enrichment code** as-is (it may work for some users), but the button serves as a reliable fallback.

4. **Also auto-trigger this function** after validation completes, using a `useEffect` watching `validationResult`:
   ```typescript
   useEffect(() => {
     if (validationResult && parseResult) {
       const zeroLines = parseResult.lines.filter(l => l.prixAchatReel === 0 && l.produitId);
       if (zeroLines.length > 0) {
         handleEnrichPrices();
       }
     }
   }, [validationResult]);
   ```
   This runs in a NEW render cycle, after all state has settled — no closure issues possible.

### Why This Will Work
- **No closures**: `handleEnrichPrices` reads from current state refs, not stale variables
- **No batching conflicts**: runs in its own event loop cycle (useEffect or button click)
- **Visible feedback**: button shows loading state and count
- **Debuggable**: standalone function with comprehensive logging
- **User control**: if auto-trigger fails, user can click the button manually




## Problem

The `enrichPricesFromGlobalCatalog` function is called **before** `validateReceptionData` in the `validateData` flow (line 756 vs 764). Since `produitId` is only assigned to each line during validation (in `ExcelParserService.validateReceptionData`), the enrichment function filters for `l.produitId` and finds zero matches, returning immediately without enriching any prices.

## Fix

Swap the order: run validation first (which sets `produitId`), then enrich prices from the global catalog, then update the state.

### Changes in `ReceptionExcelImport.tsx` (~lines 753-778)

```
1. Call validateReceptionData FIRST → sets produitId on each line
2. Call enrichPricesFromGlobalCatalog on the validated lines (now with produitId)
3. Update parseResult and validationResult with the enriched lines
```

This is a simple reordering of two function calls plus updating the enriched lines back into the validation result.




## Diagnosis

I verified the database: 646 out of 655 local products match the global catalog, and 9,533 products have positive prices. **The data exists.** The problem is purely in the code execution.

There are **two bugs**:

### Bug 1: `enrichPricesFromGlobalCatalog` has no logging
The original function (line 655) has zero `console.log` statements, so we can't tell if it runs, finds matches, or fails silently. The user's console shows no enrichment logs at all.

### Bug 2: `forceEnrichPricesFromCatalog` does async work inside setState
Lines 820-832 call `_doForceEnrich` (an async function) **inside a `setParseResult` callback**. React state updaters must be synchronous. The `.then()` fires later but may be lost or cause React to skip the update. This is an anti-pattern that doesn't reliably work.

## Fix

Replace the entire approach with a single, simple, **properly awaited** function called at the end of `validateData`:

### Changes in `ReceptionExcelImport.tsx`

1. **Delete** `forceEnrichPricesFromCatalog` and `_doForceEnrich` (lines 816-924) — they use a broken pattern.

2. **Rewrite** lines 798-802 in `validateData` to use a direct, awaited enrichment:

```typescript
// 5. Final enrichment pass - direct and awaited
const finalLines = enrichedLines; // from step 2
const linesToFix = finalLines.filter(l => l.prixAchatReel === 0 && l.produitId);
console.log(`[enrichFinal] Lines needing price: ${linesToFix.length}/${finalLines.length}`);

if (linesToFix.length > 0) {
  const produitIds = [...new Set(linesToFix.map(l => l.produitId!))];
  
  // Fetch local codes
  const codeMap = new Map();
  for (let i = 0; i < produitIds.length; i += 200) {
    const { data } = await supabase.from('produits')
      .select('id, code_cip, ancien_code_cip')
      .in('id', produitIds.slice(i, i + 200));
    data?.forEach(p => codeMap.set(p.id, p));
  }
  console.log(`[enrichFinal] Local products found: ${codeMap.size}`);
  
  // Collect codes and query global catalog
  const codes = new Set<string>();
  codeMap.forEach(p => {
    if (p.code_cip) codes.add(String(p.code_cip).trim());
    if (p.ancien_code_cip) codes.add(String(p.ancien_code_cip).trim());
  });
  
  const catalogMap = new Map();
  const codesArr = [...codes].filter(Boolean);
  for (let i = 0; i < codesArr.length; i += 200) {
    const chunk = codesArr.slice(i, i + 200);
    const { data: d1 } = await supabase.from('catalogue_global_produits')
      .select('code_cip, prix_achat_reference, prix_achat_reference_pnr')
      .in('code_cip', chunk);
    d1?.forEach(p => catalogMap.set(String(p.code_cip).trim(), p));
    
    const { data: d2 } = await supabase.from('catalogue_global_produits')
      .select('ancien_code_cip, prix_achat_reference, prix_achat_reference_pnr')
      .in('ancien_code_cip', chunk);
    d2?.forEach(p => {
      if (p.ancien_code_cip && !catalogMap.has(String(p.ancien_code_cip).trim()))
        catalogMap.set(String(p.ancien_code_cip).trim(), p);
    });
  }
  console.log(`[enrichFinal] Catalog matches: ${catalogMap.size}`);
  
  // Apply prices directly to finalLines array (mutate)
  let count = 0;
  for (const line of finalLines) {
    if (line.prixAchatReel !== 0 || !line.produitId) continue;
    const prod = codeMap.get(line.produitId);
    if (!prod) continue;
    const match = catalogMap.get(String(prod.code_cip).trim()) 
               || catalogMap.get(String(prod.ancien_code_cip).trim());
    if (!match) continue;
    const region = (line.regionCode || '').toUpperCase().trim();
    const price = region === 'PNR' 
      ? (match.prix_achat_reference_pnr ?? match.prix_achat_reference)
      : match.prix_achat_reference;
    if (price && price > 0) { line.prixAchatReel = price; count++; }
  }
  console.log(`[enrichFinal] Prices applied: ${count}`);
  if (count > 0) toast.info(`${count} prix récupéré(s) du catalogue global`);
  
  // Update state with mutated lines
  setParseResult(prev => prev ? { ...prev, lines: [...finalLines] } : prev);
}
```

3. **Add logging** to `enrichPricesFromGlobalCatalog` (lines 657, 680, 703, 710, 735) to trace execution in case both functions run.

Key differences from previous attempts:
- **Awaited** — runs inside the `try/catch` of `validateData`, not floating as a detached promise
- **Direct mutation** of the lines array then spread into new state — no closure issues
- **Comprehensive logging** at every step to trace exactly where it fails if it still doesn't work
- **No async inside setState** — the anti-pattern that was breaking `forceEnrichPricesFromCatalog`


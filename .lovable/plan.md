

## Root Cause

In `parseFile` (line 616), the flow is:
1. Line 618: `setParseResult(null)` — resets state to null
2. Line 628: `setParseResult(result)` — queues state update (not yet committed by React)
3. Line 638: `await validateData(result.lines)` — called immediately

Inside `validateData`, the closure variable `parseResult` is still **null** (the state from before `parseFile` ran, because React hasn't re-rendered yet). So on line 769:

```typescript
if (parseResult) {  // parseResult is null in the closure!
  setParseResult({ ...parseResult, lines: enrichedLines });  // NEVER EXECUTES
}
```

The enriched lines with prices from the global catalog are computed correctly but **never stored in `parseResult`**. The UI table iterates over `parseResult.lines` (line 1759), showing the original un-enriched lines with price = 0.

## Fix

**File: `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx`**

Replace lines 768-771 with functional setState that always works regardless of closure staleness:

```typescript
// 3. Mettre à jour parseResult avec les lignes enrichies
setParseResult(prev => prev ? { ...prev, lines: enrichedLines } : {
  success: true,
  lines: enrichedLines,
  errors: [],
  warnings: []
});
```

Using the functional form `setParseResult(prev => ...)` ensures React uses the latest queued state value (including the `setParseResult(result)` from `parseFile` line 628), not the stale closure value.

This is a one-line fix that resolves the entire pricing issue.

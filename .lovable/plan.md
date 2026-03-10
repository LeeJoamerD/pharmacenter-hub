

# Plan: Add "Récupérer les prix" button next to "Valider la réception"

## Diagnosis

The console shows `index-DwXCAMfH.js` but the latest build produces `index-Y3C9W4Dt.js` — the code changes from recent iterations **haven't been served to the browser yet**. That's why zero enrichment logs appear. The enrichment code IS correct but hasn't run.

There are no actual build errors — only warnings about dynamic imports. The build succeeded.

## What I'll do

Add a prominent button **right next to** "Valider la réception" (line 2286) that calls the existing `handleEnrichPrices` function. This gives you a visible, clickable way to trigger price enrichment after validation.

### Changes in `ReceptionExcelImport.tsx`

**Location: lines 2283-2307** (the button bar with "Annuler" and "Valider la réception")

Insert a new button between "Annuler" and "Valider la réception":

```
[Annuler]  [🔄 Récupérer les prix (X)]  [✓ Valider la réception]
```

- Shows count of lines with price = 0 that have a matched product
- Calls `handleEnrichPrices` on click
- Shows spinner while enriching
- Only visible when there are lines with zero price and a `produitId`

This is a 5-line UI change that reuses the existing (correct) `handleEnrichPrices` function.




# Plan : Correction TVA Déductible + Intégration ASDI + Déclaration G n°10

## Problème principal

La TVA déductible et le Centime Additionnel déductible affichent 0 pour la plupart des tenants car le hook `useFiscalManagement.ts` (lignes 531-560) :
1. Requête `lignes_reception_fournisseur` avec une jointure PostgREST qui échoue silencieusement
2. **Recalcule** la TVA déductible via `purchasesHT * vatRate` au lieu de lire les montants réels
3. **Recalcule** le centime déductible via `vatDeductible * centimeRate` au lieu de lire les montants réels
4. Ignore complètement l'ASDI

**Les montants réels sont déjà stockés** dans `receptions_fournisseurs` : `montant_tva`, `montant_centime_additionnel`, `montant_asdi`.

## Modification clé demandée par l'utilisateur

**Ne pas recalculer** TVA, Centime Additionnel ni ASDI. Lire directement les montants réels depuis `receptions_fournisseurs`, exactement comme ils ont été enregistrés lors des réceptions et générés dans les écritures comptables.

---

## Modifications

### 1. `src/hooks/useFiscalManagement.ts` — Corriger le calcul VATSummary

**Remplacer** les lignes 531-578 (requête `lignes_reception_fournisseur` + recalcul) par une requête directe sur `receptions_fournisseurs` :

```typescript
// Achats du mois - lire les montants réels des réceptions
const { data: receptions, error: achatsError } = await supabase
  .from('receptions_fournisseurs')
  .select('montant_ht, montant_tva, montant_centime_additionnel, montant_asdi')
  .eq('tenant_id', tenantId)
  .gte('date_reception', startOfMonth)
  .lte('date_reception', endOfMonth);

const purchasesHT = receptions?.reduce((sum, r) => sum + (r.montant_ht || 0), 0) || 0;
const vatDeductible = receptions?.reduce((sum, r) => sum + (r.montant_tva || 0), 0) || 0;
const centimeDeductible = receptions?.reduce((sum, r) => sum + (r.montant_centime_additionnel || 0), 0) || 0;
const asdiPaid = receptions?.reduce((sum, r) => sum + (r.montant_asdi || 0), 0) || 0;
```

**Ajouter `asdiPaid`** au type `VATSummary` et au retour.

Formule `vatCollected = salesTTC - salesHT` **inchangée**.

### 2. `src/components/dashboard/modules/accounting/FiscalManagement.tsx` — Ajouter ASDI

- Ajouter une carte "ASDI Payé" (compte 4491) dans les cartes de l'onglet TVA
- Modifier la carte "Total à Payer" : `(TVA due + Centime due) - ASDI`
- Ajouter la ligne ASDI dans le récapitulatif "Calcul TVA et Centime du Mois"
- Ajouter un bouton "Déclaration Mensuelle G n°10 (PDF)" dans l'onglet Rapports

### 3. `src/hooks/useFiscalManagement.ts` — Ajouter génération PDF G n°10

Nouvelle fonction `generateDeclarationG10PDF` :
- Section I : Chiffre d'affaires et TVA collectée (montants réels des ventes)
- Section II : TVA déductible (montants réels des réceptions)
- Section III : Centime Additionnel (montants réels des ventes et réceptions)
- Section IV : ASDI — Acompte déduit (montants réels des réceptions)
- Section V : Total net à payer = (TVA due + Centime due) - ASDI
- Section VI : Retenues à la source (structure préparée)
- Mentions légales : Échéance le 20 du mois suivant, obligation de dépôt même à néant

### 4. `src/components/accounting/fiscal/DeclarationTVADialog.tsx` — Ajouter ASDI

- Ajouter un champ ASDI (pré-rempli depuis `vatSummary.asdiPaid`)
- Modifier le "Total à Payer" : `(TVA + Centime) - ASDI`

### 5. Migration SQL — Ajouter `montant_asdi` à `tva_declaration`

```sql
ALTER TABLE tva_declaration ADD COLUMN IF NOT EXISTS montant_asdi numeric DEFAULT 0;
```

---

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useFiscalManagement.ts` |
| Modifier | `src/components/dashboard/modules/accounting/FiscalManagement.tsx` |
| Modifier | `src/components/accounting/fiscal/DeclarationTVADialog.tsx` |
| Migration | `tva_declaration` — ajout colonne `montant_asdi` |


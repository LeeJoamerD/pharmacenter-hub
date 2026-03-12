

# Plan: Intégrer Bons et Taux Marge/Marque dans les Sessions de Caisse

## Contexte

Actuellement, le modal de fermeture de caisse et les rapports ne montrent que les mouvements de caisse (espèces). L'utilisateur ne voit pas le total réel des ventes (incluant les bons) ni les indicateurs de rentabilité (marge/marque).

**Clarification importante sur "Total Bons"** : Ce total inclut toutes les ventes non encaissées en caisse, pas seulement la part assurance. Cela couvre :
- Ventes de type `Assurance` (part assureur)
- Ventes de type `Crédit` pour clients Conventionné, Entreprise, Personnel

Concrètement : `Total Bons = Total Ventes Global - Total Encaissé en caisse (espèces/carte/mobile)`

## 1. Migration DB -- 6 colonnes sur `sessions_caisse`

```sql
ALTER TABLE public.sessions_caisse
  ADD COLUMN IF NOT EXISTS total_ventes_global NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_bons NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taux_marge NUMERIC(8,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valeur_marge NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taux_marque NUMERIC(8,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valeur_marque NUMERIC(12,2) DEFAULT 0;
```

- `total_ventes_global` = SUM(montant_total_ttc) de toutes les ventes validees de la session
- `total_bons` = total_ventes_global - montant encaisse en caisse (mouvements de type Vente)
- `taux_marge` = ((CA HT - Cout Achat) / Cout Achat) x 100
- `valeur_marge` = CA HT - Cout Achat (marge commerciale)
- `taux_marque` = ((CA HT - Cout Achat) / CA HT) x 100
- `valeur_marque` = meme valeur absolue, presentee differemment

## 2. `useCashRegister.ts` -- Calculer et persister a la fermeture

Dans `closeSession`, avant l'UPDATE :

1. Requeter les ventes de la session (`session_caisse_id`, `statut IN ('Validee','Finalisee')`) :
   - `total_ventes_global` = SUM(`montant_total_ttc`)
   - `total_bons` = total_ventes_global - totalVentes (mouvements caisse deja calcules)

2. Requeter les lignes de ventes avec lots pour le cout d'achat :
   ```
   lignes_ventes (quantite, prix_unitaire_ht)
   JOIN lots ON lot_id (prix_achat_unitaire)
   WHERE vente_id IN session ventes
   ```
   - `totalVenteHT` = SUM(quantite x prix_unitaire_ht)
   - `totalCoutAchat` = SUM(quantite x prix_achat_unitaire)
   - `margeCommerciale` = totalVenteHT - totalCoutAchat
   - Calcul taux/valeurs marge et marque

3. Inclure les 6 champs dans l'UPDATE de `sessions_caisse`.

## 3. `CloseSessionModal.tsx` -- Nouvelles lignes UI

### Entre "Fond de caisse" et "Total Entrees" :
- **Total Ventes** (toutes ventes, tous types) -- calcule en temps reel
- **Total Bons** (ventes non encaissees) -- calcule en temps reel

### Entre "Montant Reel en Caisse" et "Notes" :
- **Taux de marge XX.XX%** -- Valeur: XXXX FCFA
- **Taux de marque XX.XX%** -- Valeur: XXXX FCFA

Ces valeurs sont calculees en temps reel a l'ouverture du modal (meme requetes que la fermeture) pour que l'utilisateur les voie avant de confirmer.

## 4. `SessionReport` interface + `getSessionReport` -- Enrichir

Ajouter au `summary` : `totalVentesGlobal`, `totalBons`, `tauxMarge`, `valeurMarge`, `tauxMarque`, `valeurMarque`.

Pour les sessions fermees : lire depuis les colonnes DB.
Pour les sessions ouvertes : calculer en temps reel.

## 5. `CashReport.tsx` -- Nouvelles lignes

### Entre "Montant d'ouverture" et "+ Ventes" :
- **Total Ventes** : `summary.totalVentesGlobal`
- **Total Bons** : `summary.totalBons`

### Apres "Solde theorique" :
- **Taux de marge** + valeur
- **Taux de marque** + valeur

## 6. `reportPrintService.ts` -- PDF et impression

### `exportToPDF` et `generateReportHTML` :
- Inserer "Total Ventes" et "Total Bons" apres "Montant d'ouverture"
- Inserer Taux de marge/marque + valeurs apres "Solde reel"

## Fichiers modifies
1. **Migration SQL** -- 6 colonnes sur `sessions_caisse`
2. `src/hooks/useCashRegister.ts` -- calcul a la fermeture + enrichissement rapport
3. `src/components/dashboard/modules/sales/cash/CloseSessionModal.tsx` -- UI fermeture
4. `src/components/dashboard/modules/sales/cash/CashReport.tsx` -- UI rapport
5. `src/services/reportPrintService.ts` -- impression/PDF


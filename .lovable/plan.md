

## Plan: Suivi de la valeur de stock à l'ouverture des sessions de caisse

### Constat
- Table `sessions_caisse` existe et contient déjà des métriques (taux_marge, valeur_marge…), mais aucune valeur de stock à l'ouverture.
- Ouverture de session faite à 2 endroits : `useCashRegister.openSession` (ligne 168) et `useSessionWithType.openSessionWithType` (`src/hooks/useSessionWithType.ts`, ligne 103). Les deux insèrent dans `sessions_caisse`.
- Calcul de stock disponible : table `lots`, somme `quantite_restante × prix_achat_unitaire` (achat) et `quantite_restante × prix_vente_ttc` (vente), filtrée par `tenant_id` et `quantite_restante > 0`.
- Le résumé du rapport est construit dans `useCashRegister.getSessionReport` (ligne 642 → objet `summary`). L'affichage est fait dans `CashReport.tsx` (bloc Indicateurs de Rentabilité, lignes 328-350). Les sorties imprimées/PDF sont dans `src/services/reportPrintService.ts` (HTML lignes 182-191 et jsPDF lignes 370-375).

### Modifications

#### 1. Base de données (migration)
Ajouter à `public.sessions_caisse` :
- `valeur_stock_achat NUMERIC(15,2) DEFAULT 0` — valeur totale du stock au prix d'achat à l'ouverture
- `valeur_stock_vente NUMERIC(15,2) DEFAULT 0` — valeur totale du stock au prix de vente TTC à l'ouverture

Créer une RPC `calculate_stock_value_snapshot(p_tenant_id uuid)` qui retourne `(valeur_achat numeric, valeur_vente numeric)` calculée depuis `lots` (somme `quantite_restante × prix_achat_unitaire` et `quantite_restante × COALESCE(prix_vente_ttc, 0)` où `quantite_restante > 0`). SECURITY DEFINER avec filtre tenant strict.

Pas de backfill automatique (les sessions existantes resteront à 0 — acceptable car snapshot historique non récupérable).

#### 2. Capture du snapshot à l'ouverture
- `src/hooks/useCashRegister.ts` (`openSession`, autour de la ligne 217) : avant l'`insert`, appeler la RPC `calculate_stock_value_snapshot` et ajouter `valeur_stock_achat` + `valeur_stock_vente` au payload `insertData`.
- `src/hooks/useSessionWithType.ts` (`openSessionWithType`, autour de la ligne 124) : même chose dans l'`insert`.
- En cas d'échec du calcul, on enregistre 0 et on log un warning (ne pas bloquer l'ouverture de session).

#### 3. Exposition dans le rapport
- `src/hooks/useCashRegister.ts` :
  - Étendre `SessionReport.summary` (ligne 46) avec `valeurStockAchat: number; valeurStockVente: number`.
  - Dans `getSessionReport` (ligne 642), lire ces deux colonnes depuis `sessionData` et les inclure dans `summary`.

#### 4. Affichage
- `src/components/dashboard/modules/sales/cash/CashReport.tsx`, bloc « Indicateurs de Rentabilité » (lignes 328-350) : ajouter sous Taux de marge / Taux de marque deux lignes :
  - « Valeur de stock (achat) » → `formatPrice(summary.valeurStockAchat)`
  - « Valeur de stock (vente) » → `formatPrice(summary.valeurStockVente)`
  - La condition d'affichage du bloc est élargie pour s'afficher aussi si une valeur de stock est présente.

#### 5. Impression et export PDF
- `src/services/reportPrintService.ts` :
  - HTML (après ligne 190) : ajouter 2 lignes `<tr>` « Valeur de stock (achat/vente) » avec même style que les taux.
  - jsPDF (après ligne 374) : `summaryData.push(['Valeur de stock (achat)', formatCurrency(...)], ['Valeur de stock (vente)', formatCurrency(...)])`.

### Fichiers concernés

| Fichier | Changement |
|---|---|
| `supabase/migrations/<new>.sql` | Ajouter colonnes `valeur_stock_achat` / `valeur_stock_vente` sur `sessions_caisse` + RPC `calculate_stock_value_snapshot` |
| `src/hooks/useCashRegister.ts` | Snapshot à l'ouverture + extension type `summary` + lecture en sortie |
| `src/hooks/useSessionWithType.ts` | Snapshot à l'ouverture (même logique) |
| `src/components/dashboard/modules/sales/cash/CashReport.tsx` | Affichage 2 lignes valeur de stock sous Indicateurs de Rentabilité |
| `src/services/reportPrintService.ts` | Ajout lignes valeur de stock dans HTML imprimable et PDF exporté |

### Résultat attendu
- À chaque ouverture de session de caisse, deux montants sont figés en base : valeur de stock au prix d'achat et au prix de vente TTC, calculés depuis `lots`.
- Dans le modal Rapport de Session (Module Ventes/Caisses/Historique), sous « Indicateurs de Rentabilité », les deux valeurs apparaissent à l'écran, sur l'impression et dans le PDF exporté.
- Aucune régression : les sessions existantes affichent simplement 0 pour ces nouvelles métriques.



# Plan de Correction - Cohérence des Formules de Calcul + Configurations d'Arrondi

## Probleme Identifie

J'ai confirme une **incohérence critique** entre la fonction RPC SQL `recalculer_tous_les_prix_v2` et le service TypeScript `UnifiedPricingService` utilise par le simulateur.

### Comparaison des Formules

| Etape | RPC SQL (actuelle - INCORRECTE) | UnifiedPricingService / Simulateur (CORRECT) |
|-------|--------------------------------|---------------------------------------------|
| 1. Prix HT | `HT = Achat × Coeff` | `HT = Achat × Coeff` |
| 2. Centime | `Centime = HT × taux%` | `Centime = TVA × taux%` |
| 3. TVA | `TVA = (HT + Centime) × taux%` | `TVA = HT × taux%` |
| 4. TTC | `TTC = HT + TVA + Centime` | `TTC = HT + TVA + Centime` |

### Exemple Chiffre (Prix achat 1000, Coeff 1.41, TVA 18%, Centime 5%)

| Calcul | RPC SQL (actuelle) | Formule Correcte | Ecart |
|--------|-------------------|------------------|-------|
| Prix HT | 1 410 | 1 410 | 0 |
| Centime | 71 (1410 × 5%) | 13 (254 × 5%) | +58 |
| TVA | 267 ((1410+71) × 18%) | 254 (1410 × 18%) | +13 |
| **TTC brut** | **1 748** | **1 677** | **+71** |

L'ecart de 71 FCFA par produit est significatif sur un catalogue de plusieurs milliers de produits.

---

## Configurations d'Arrondi Operationnelles

La RPC actuelle lit deja correctement les parametres d'arrondi depuis `parametres_systeme` :

| Parametre | Source | Utilisation |
|-----------|--------|-------------|
| `stock_rounding_precision` | parametres_systeme | Precision d'arrondi (ex: 25 = multiple de 25) |
| `sales_tax.taxRoundingMethod` | parametres_systeme (JSON) | Methode (ceil, floor, round) |

Ces configurations sont bien appliquees pour l'arrondi **final** du TTC.

---

## Tables Mises a Jour par la RPC

### Table `produits`

| Colonne | Calcul |
|---------|--------|
| `prix_vente_ht` | HT arrondi a l'entier |
| `tva` | Montant TVA |
| `centime_additionnel` | Montant Centime |
| `prix_vente_ttc` | TTC avec arrondi de precision |

### Table `lots` (quantite_restante > 0)

| Colonne | Calcul |
|---------|--------|
| `prix_vente_ht` | HT arrondi a l'entier |
| `taux_tva` | Taux de la categorie |
| `montant_tva` | Montant TVA |
| `taux_centime_additionnel` | Taux de la categorie |
| `montant_centime_additionnel` | Montant Centime |
| `prix_vente_ttc` | TTC avec arrondi de precision |
| `prix_vente_suggere` | = TTC |

---

## Plan de Correction

### Phase 1 : Migration SQL

Creer une migration qui corrige les formules dans `recalculer_tous_les_prix_v2`.

**Modifications a apporter (lignes 65-68 et 111-113) :**

```text
-- AVANT (INCORRECT)
v_centime := ROUND(v_prix_ht * (taux_centime_additionnel / 100));
v_tva := ROUND((v_prix_ht + v_centime) * (taux_tva / 100));

-- APRES (CORRECT - aligne avec UnifiedPricingService)
v_tva := ROUND(v_prix_ht * (taux_tva / 100));
v_centime := ROUND(v_tva * (taux_centime_additionnel / 100));
```

### Phase 2 : Validation des Configurations d'Arrondi

Les configurations d'arrondi sont deja operationnelles :
- Precision (`stock_rounding_precision`) : Lue correctement
- Methode (`taxRoundingMethod`) : Lue depuis le JSON `sales_tax`
- Arrondi entier pour XAF/FCFA : Applique via `ROUND()`
- Arrondi final TTC : Applique selon precision et methode

Aucune modification necessaire pour les arrondis.

---

## Fichier a Creer

| Fichier | Description |
|---------|-------------|
| `supabase/migrations/[timestamp]_fix_pricing_formulas_consistency.sql` | Correction de la RPC |

---

## Structure de la Migration

La migration va :

1. Supprimer la fonction existante
2. Recreer avec les formules corrigees :
   - `v_tva := ROUND(v_prix_ht * (taux_tva / 100))`
   - `v_centime := ROUND(v_tva * (taux_centime_additionnel / 100))`
3. Conserver toute la logique d'arrondi de precision existante
4. Notifier PostgREST pour rafraichir le cache

---

## Garanties Apres Correction

| Element | Garantie |
|---------|----------|
| Formules identiques | Simulateur = RPC = Reception = Documentation |
| Arrondi entier XAF | Tous montants intermediaires arrondis a l'entier |
| Precision configurable | TTC final arrondi au multiple configure (ex: 25) |
| Methode configurable | ceil/floor/round selon parametres |
| Mise a jour produits | HT, TVA, Centime, TTC recalcules |
| Mise a jour lots | Memes colonnes + taux stockes + prix_vente_suggere |

---

## Recommandation Post-Migration

Apres la migration, executer manuellement l'outil "Recalcul des Prix" dans :
**Stock > Configuration > Gestion des prix > Outils de Recalcul des Prix**

Cela appliquera les formules corrigees a tous les produits et lots existants.

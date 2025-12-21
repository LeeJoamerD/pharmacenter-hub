# Règles de Tarification Pharmaceutique - Documentation Technique

> **IMPORTANT**: Ce document est la référence officielle pour tous les calculs de prix dans l'application.
> Toute modification des formules ou paramètres doit être documentée ici.

## 1. Architecture Multi-Tenant

L'application est multi-tenant. Chaque pharmacie (tenant) possède ses propres:
- Paramètres système (devise, TVA, centime additionnel)
- Catégories de tarification avec coefficients
- Paramètres de stock (précision d'arrondi)
- Paramètres de vente (méthode d'arrondi)

**Règle fondamentale**: Ne JAMAIS coder en dur les taux, coefficients ou paramètres. Toujours les récupérer depuis la configuration du tenant.

## 2. Formules de Calcul des Prix

### Formules de Base (IMMUABLES)

```
Prix HT = Prix Achat × Coefficient Prix Vente

Montant TVA = Prix HT × (Taux TVA / 100)

Montant Centime Additionnel = Montant TVA × (Taux Centime Additionnel / 100)

Prix TTC = Prix HT + Montant TVA + Montant Centime Additionnel
```

### Application de l'Arrondi

L'arrondi s'applique **uniquement sur le Prix TTC final** selon:
- **Précision d'arrondi** (`stock_rounding_precision`): Multiple auquel arrondir (ex: 25)
- **Méthode d'arrondi** (`taxRoundingMethod`): ceil (supérieur), floor (inférieur), round (proche)

```
Prix TTC Final = ArrondiSupérieur(Prix TTC / Précision) × Précision
```

**Exemple avec précision = 25 et méthode = ceil:**
- 1677 → 1700 (1677/25 = 67.08 → ceil = 68 → 68×25 = 1700)
- 1650 → 1650 (déjà multiple de 25)
- 1651 → 1675 (1651/25 = 66.04 → ceil = 67 → 67×25 = 1675)

## 3. Sources des Paramètres

### Paramètres Système (`parametres_systeme`)
| Clé | Description | Valeur par défaut |
|-----|-------------|-------------------|
| `taux_tva` | Taux de TVA en % | 19.25 |
| `taux_centime_additionnel` | Taux centime additionnel en % | 0.175 |
| `default_currency` | Code devise | XAF |

### Paramètres Stock (`parametres_systeme`)
| Clé | Description | Valeur par défaut |
|-----|-------------|-------------------|
| `stock_rounding_precision` | Précision d'arrondi (multiple) | 25 |
| `stock_valuation_method` | Méthode de valorisation | FIFO |

### Paramètres Vente (`sales_tax` JSON)
| Clé | Description | Valeur par défaut |
|-----|-------------|-------------------|
| `taxRoundingMethod` | Méthode d'arrondi (ceil/floor/round) | round |
| `includeTaxInPrice` | Prix TTC affichés | true |

### Catégories de Tarification (`categorie_tarification`)
| Colonne | Description |
|---------|-------------|
| `coefficient_prix_vente` | Multiplicateur du prix d'achat |
| `taux_tva` | Taux TVA spécifique à la catégorie |
| `taux_centime_additionnel` | Taux centime spécifique |

## 4. Flux des Prix

### 4.1 À la Réception

```
Réception → Calcul des prix → Mise à jour Produit + Création Lot
```

1. Récupérer `prix_achat_reel` de la ligne de réception
2. Récupérer la catégorie de tarification du produit
3. Calculer via `UnifiedPricingService.calculateSalePrice()`
4. Mettre à jour `produits` avec les 6 valeurs (HT, TVA, Centime, TTC, taux)
5. Créer le `lot` avec les mêmes valeurs + `prix_achat_unitaire`

### 4.2 À la Commande

Les prix affichés proviennent de la table `produits` (indicatifs).

### 4.3 À la Vente

```
Sélection Lot → Calcul temps réel depuis prix_achat du lot → Affichage
```

1. Rechercher les lots disponibles (FIFO par date réception/péremption)
2. Pour chaque lot, le prix est calculé dynamiquement:
   - `lot.prix_achat_unitaire` × coefficient de sa catégorie
3. **BLOQUER** la vente si `lot.prix_achat_unitaire` est null ou 0
4. Afficher TVA et Centime Additionnel dans le panier et sur les documents

## 5. Structure de la Table `lots`

Colonnes de prix (toutes calculées à la réception):

| Colonne | Type | Description |
|---------|------|-------------|
| `prix_achat_unitaire` | NUMERIC(15,2) | Prix d'achat du lot |
| `prix_vente_ht` | NUMERIC(15,2) | Prix HT calculé |
| `taux_tva` | NUMERIC(5,2) | Taux TVA appliqué |
| `montant_tva` | NUMERIC(15,2) | Montant TVA calculé |
| `taux_centime_additionnel` | NUMERIC(5,2) | Taux centime appliqué |
| `montant_centime_additionnel` | NUMERIC(15,2) | Montant centime calculé |
| `prix_vente_ttc` | NUMERIC(15,2) | Prix TTC final (arrondi) |
| `prix_vente_suggere` | NUMERIC(15,2) | = prix_vente_ttc |
| `categorie_tarification_id` | UUID | FK vers catégorie |

## 6. Devises et Formatage

### Devises sans Décimales
- **XAF** (Franc CFA BEAC)
- **XOF** (Franc CFA BCEAO)
- **FCFA** (alias)

Pour ces devises: toujours arrondir à l'entier, pas de décimales affichées.

### Formatage des Nombres
- Séparateur de milliers: espace (format français)
- Séparateur décimal: virgule
- Exemple: `1 677,50 FCFA` ou `1 677 FCFA` (XAF)

## 7. Simulation - Catégorie MEDICAMENTS AVEC TVA

**Paramètres:**
- Prix d'achat: 1 000 FCFA
- Coefficient: 1.41
- Taux TVA: 18%
- Taux Centime: 5%
- Précision arrondi: 25
- Méthode: ceil (supérieur)

**Calcul:**
```
Prix HT = 1000 × 1.41 = 1 410 FCFA
Montant TVA = 1410 × 0.18 = 253.80 → 254 FCFA (arrondi devise)
Montant Centime = 254 × 0.05 = 12.70 → 13 FCFA (arrondi devise)
Prix TTC brut = 1410 + 254 + 13 = 1 677 FCFA
Prix TTC final = ceil(1677/25) × 25 = 68 × 25 = 1 700 FCFA
```

## 8. Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `src/services/UnifiedPricingService.ts` | Service centralisé de calcul |
| `src/hooks/useUnifiedPricingParams.ts` | Hook pour récupérer tous les paramètres |
| `src/hooks/useStockSettings.ts` | Paramètres stock (précision arrondi) |
| `src/hooks/useSalesSettings.ts` | Paramètres vente (méthode arrondi) |
| `src/hooks/useSystemSettings.ts` | Paramètres système (TVA, devise) |

## 9. Validation et Blocages

### Blocage Réception
- Si `categorie_tarification_id` manquant sur le produit
- Si `prix_achat_reel` est 0 ou non renseigné

### Blocage Vente
- Si `lot.prix_achat_unitaire` est null ou 0
- Message: "Ce produit n'a pas de prix d'achat valide. Vente impossible."

## 10. Génération Comptable

À chaque vente validée, générer automatiquement:

| N° Compte | Libellé | Débit | Crédit |
|-----------|---------|-------|--------|
| 411 | Client | TTC | |
| 701 | Ventes de marchandises | | HT |
| 4457 | TVA collectée | | Montant TVA |
| 4458 | Centime additionnel | | Montant Centime |

---

*Dernière mise à jour: Décembre 2024*
*Version: 2.0 - Refonte complète du système de prix*

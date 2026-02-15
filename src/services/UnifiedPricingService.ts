/**
 * SERVICE CENTRALISÉ DE CALCUL DES PRIX - VERSION UNIFIÉE
 * 
 * Ce service est la SOURCE UNIQUE DE VÉRITÉ pour tous les calculs de prix.
 * Il respecte les règles multi-tenant et tous les paramètres système.
 * 
 * FORMULES DE BASE:
 * - Prix HT = Prix Achat × Coefficient Prix Vente
 * - Montant TVA = Prix HT × (Taux TVA / 100)
 * - Montant Centime Additionnel = Montant TVA × (Taux Centime Additionnel / 100)
 * - Prix TTC = Prix HT + Montant TVA + Montant Centime Additionnel
 * 
 * ARRONDI:
 * - Précision configurable (ex: 25 = arrondir au multiple de 25)
 * - Méthode configurable (ceil, floor, round)
 * - Appliqué au Prix TTC final
 */

import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

// Devises sans décimales (depuis configuration centralisée)
const NO_DECIMAL_CURRENCIES = DEFAULT_SETTINGS.currency.noDecimalCurrencies;

/**
 * Paramètres de calcul des prix
 */
export interface UnifiedPricingParams {
  prixAchat: number;
  coefficientPrixVente: number;
  tauxTVA: number;
  tauxCentimeAdditionnel: number;
  // Paramètres d'arrondi
  roundingPrecision: number;      // ex: 25 (arrondir au multiple de 25)
  roundingMethod: 'ceil' | 'floor' | 'round' | 'none';
  currencyCode?: string;
}

/**
 * Résultat des calculs de prix
 */
export interface UnifiedPricingResult {
  prixVenteHT: number;
  tauxTVA: number;
  montantTVA: number;
  tauxCentimeAdditionnel: number;
  montantCentimeAdditionnel: number;
  prixVenteTTC: number;
  // Détails pour traçabilité
  prixAchatOriginal: number;
  coefficientApplique: number;
  arrondissementApplique: number; // Différence due à l'arrondi
}

/**
 * Paramètres de configuration récupérés des différentes sources
 */
export interface PricingConfigParams {
  // Depuis useStockSettings
  roundingPrecision: number;      // stock_rounding_precision (ex: 25)
  
  // Depuis useSalesSettings  
  taxRoundingMethod: 'ceil' | 'floor' | 'round' | 'none';
  
  // Depuis useSystemSettings
  defaultTauxTVA: number;         // taux_tva (ex: 19.25)
  defaultTauxCentime: number;     // taux_centime_additionnel (ex: 0.175)
  currencyCode: string;           // default_currency (ex: 'XAF')
}

class UnifiedPricingService {
  
  /**
   * Vérifie si une devise nécessite un arrondi à l'entier (pas de décimales)
   */
  isNoDecimalCurrency(currencyCode?: string): boolean {
    const code = currencyCode || DEFAULT_SETTINGS.currency.code;
    return NO_DECIMAL_CURRENCIES.includes(code);
  }

  /**
   * Arrondit un montant selon la précision et la méthode configurées
   * 
   * @param value - Valeur à arrondir
   * @param precision - Multiple d'arrondi (ex: 25 = arrondir au multiple de 25)
   * @param method - Méthode d'arrondi (ceil, floor, round, none)
   * @param currencyCode - Code devise pour gérer les décimales
   */
  roundToNearest(
    value: number, 
    precision: number, 
    method: 'ceil' | 'floor' | 'round' | 'none',
    currencyCode?: string
  ): number {
    // Pour les devises sans décimales, on arrondit d'abord à l'entier
    if (this.isNoDecimalCurrency(currencyCode)) {
      value = Math.round(value);
    }
    
    // Si précision <= 1 ou méthode none, retourner la valeur telle quelle
    if (precision <= 1 || method === 'none') {
      return this.isNoDecimalCurrency(currencyCode) 
        ? Math.round(value) 
        : Math.round(value * 100) / 100;
    }
    
    // Calcul de l'arrondi au multiple de precision
    switch (method) {
      case 'ceil':
        return Math.ceil(value / precision) * precision;
      case 'floor':
        return Math.floor(value / precision) * precision;
      case 'round':
      default:
        return Math.round(value / precision) * precision;
    }
  }

  /**
   * Arrondit un montant intermédiaire selon la devise (sans précision de multiple)
   * Utilisé pour les calculs intermédiaires HT, TVA, Centime
   */
  roundForCurrency(amount: number, currencyCode?: string): number {
    if (this.isNoDecimalCurrency(currencyCode)) {
      return Math.round(amount);
    }
    return Math.round(amount * 100) / 100;
  }

  /**
   * MÉTHODE PRINCIPALE: Calcule tous les prix de vente à partir du prix d'achat
   * 
   * Cette méthode applique STRICTEMENT les formules définies:
   * 1. Prix HT = Prix Achat × Coefficient
   * 2. Montant TVA = Prix HT × (Taux TVA / 100)
   * 3. Montant Centime = Montant TVA × (Taux Centime / 100)
   * 4. Prix TTC = Prix HT + Montant TVA + Montant Centime
   * 5. Arrondi final selon précision configurée
   */
  calculateSalePrice(params: UnifiedPricingParams): UnifiedPricingResult {
    const {
      prixAchat,
      coefficientPrixVente,
      tauxTVA,
      tauxCentimeAdditionnel,
      roundingPrecision,
      roundingMethod,
      currencyCode
    } = params;

    // Validation des entrées
    const validPrixAchat = Number(prixAchat) || 0;
    const validCoefficient = Number(coefficientPrixVente) || 1;
    const validTauxTVA = Number(tauxTVA) || 0;
    const validTauxCentime = Number(tauxCentimeAdditionnel) || 0;
    const validPrecision = Number(roundingPrecision) || 1;

    // Étape 1: Prix HT = Prix Achat × Coefficient
    const prixVenteHT = this.roundForCurrency(validPrixAchat * validCoefficient, currencyCode);

    // Étape 2: Montant TVA = Prix HT × (Taux TVA / 100)
    const montantTVA = this.roundForCurrency(prixVenteHT * (validTauxTVA / 100), currencyCode);

    // Étape 3: Montant Centime Additionnel = Montant TVA × (Taux Centime / 100)
    const montantCentimeAdditionnel = this.roundForCurrency(montantTVA * (validTauxCentime / 100), currencyCode);

    // Étape 4: Prix TTC avant arrondi final
    const prixTTCBrut = prixVenteHT + montantTVA + montantCentimeAdditionnel;

    // Étape 5: Appliquer l'arrondi final selon la précision configurée
    const prixVenteTTC = this.roundToNearest(prixTTCBrut, validPrecision, roundingMethod, currencyCode);

    // Calculer la différence due à l'arrondi
    const arrondissementApplique = prixVenteTTC - prixTTCBrut;

    return {
      prixVenteHT,
      tauxTVA: validTauxTVA,
      montantTVA,
      tauxCentimeAdditionnel: validTauxCentime,
      montantCentimeAdditionnel,
      prixVenteTTC,
      prixAchatOriginal: validPrixAchat,
      coefficientApplique: validCoefficient,
      arrondissementApplique: this.roundForCurrency(arrondissementApplique, currencyCode)
    };
  }

  /**
   * Formate un nombre avec séparateurs de milliers
   * Utilise le format français (espace comme séparateur de milliers)
   */
  formatWithThousandSeparator(value: number, currencyCode?: string): string {
    if (this.isNoDecimalCurrency(currencyCode)) {
      return Math.round(value).toLocaleString('fr-FR');
    }
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Formate un montant avec symbole de devise
   */
  formatAmount(value: number, currencySymbol: string = DEFAULT_SETTINGS.currency.symbol, currencyCode?: string): string {
    return `${this.formatWithThousandSeparator(value, currencyCode)} ${currencySymbol}`;
  }

  /**
   * Formate un pourcentage
   */
  formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)} %`;
  }

  /**
   * Valide qu'un prix d'achat est utilisable pour une vente
   * Retourne true si le prix est valide, false sinon
   */
  validatePrixAchat(prixAchat: number | null | undefined): boolean {
    return prixAchat !== null && prixAchat !== undefined && prixAchat > 0;
  }

  /**
   * Calcule le prix de vente à partir d'un lot
   * Combine les informations du lot et de sa catégorie de tarification
   */
  calculateFromLot(
    lotPrixAchat: number,
    categorie: {
      coefficient_prix_vente: number;
      taux_tva: number;
      taux_centime_additionnel: number;
    },
    config: Pick<PricingConfigParams, 'roundingPrecision' | 'taxRoundingMethod' | 'currencyCode'>
  ): UnifiedPricingResult {
    return this.calculateSalePrice({
      prixAchat: lotPrixAchat,
      coefficientPrixVente: categorie.coefficient_prix_vente,
      tauxTVA: categorie.taux_tva,
      tauxCentimeAdditionnel: categorie.taux_centime_additionnel,
      roundingPrecision: config.roundingPrecision,
      roundingMethod: config.taxRoundingMethod,
      currencyCode: config.currencyCode
    });
  }

  /**
   * CALCUL INVERSE: Du Prix TTC vers les composants (HT, TVA, Centime, Prix Achat)
   * 
   * Formule inverse:
   *   Facteur = 1 + (tauxTVA/100) + (tauxTVA/100 × tauxCentime/100)
   *   HT = TTC / Facteur
   *   TVA = HT × (tauxTVA / 100)
   *   Centime = TVA × (tauxCentime / 100)
   *   PrixAchat = HT / Coefficient
   * 
   * Arrondi individuel pour garantir TTC = HT + TVA + Centime exactement.
   */
  reversePriceFromTTC(params: {
    newTTC: number;
    tauxTVA: number;
    tauxCentimeAdditionnel: number;
    coefficientPrixVente: number;
    currencyCode?: string;
  }): {
    prixAchat: number;
    prixVenteHT: number;
    montantTVA: number;
    montantCentimeAdditionnel: number;
    prixVenteTTC: number;
  } {
    const { newTTC, tauxTVA, tauxCentimeAdditionnel, coefficientPrixVente, currencyCode } = params;

    const validTTC = Number(newTTC) || 0;
    const validTauxTVA = Number(tauxTVA) || 0;
    const validTauxCentime = Number(tauxCentimeAdditionnel) || 0;
    const validCoefficient = Number(coefficientPrixVente) || 1;

    // Facteur = 1 + TVA% + TVA% × Centime%
    const facteur = 1 + (validTauxTVA / 100) + (validTauxTVA / 100 * validTauxCentime / 100);

    // HT = TTC / Facteur
    const prixVenteHT = this.roundForCurrency(validTTC / facteur, currencyCode);

    // TVA = HT × taux
    const montantTVA = this.roundForCurrency(prixVenteHT * (validTauxTVA / 100), currencyCode);

    // Centime = TVA × taux
    const montantCentimeAdditionnel = this.roundForCurrency(montantTVA * (validTauxCentime / 100), currencyCode);

    // Ajuster HT pour que TTC = HT + TVA + Centime exactement
    const adjustedHT = validTTC - montantTVA - montantCentimeAdditionnel;

    // Prix Achat = HT / Coefficient
    const prixAchat = this.roundForCurrency(adjustedHT / validCoefficient, currencyCode);

    return {
      prixAchat,
      prixVenteHT: adjustedHT,
      montantTVA,
      montantCentimeAdditionnel,
      prixVenteTTC: validTTC
    };
  }
}

// Export une instance unique du service
export const unifiedPricingService = new UnifiedPricingService();
export default unifiedPricingService;

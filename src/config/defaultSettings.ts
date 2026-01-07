/**
 * Configuration centralisée des valeurs par défaut
 * 
 * Ces valeurs sont utilisées UNIQUEMENT comme fallback
 * quand les paramètres du tenant ne sont pas encore chargés depuis la base de données.
 * 
 * IMPORTANT: Modifier ces valeurs affecte tous les nouveaux tenants
 * et les fallbacks dans toute l'application.
 */

export const DEFAULT_SETTINGS = {
  // Devise
  currency: {
    code: 'XAF',
    symbol: 'FCFA',
    // Liste des devises sans décimales (Franc CFA zones CEMAC et UEMOA)
    noDecimalCurrencies: ['XAF', 'XOF', 'FCFA'] as readonly string[]
  },
  
  // Arrondi
  rounding: {
    precision: 1, // Pas d'arrondi par défaut (multiple de 1 = pas d'arrondi)
    method: 'round' as const // Arrondi standard (round, ceil, floor, none)
  },
  
  // TVA et taxes
  taxes: {
    tva: 0, // 0% par défaut - doit être configuré par le tenant
    centimeAdditionnel: 0 // 0% par défaut
  },
  
  // Paramètres régionaux
  regional: {
    language: 'fr',
    invoiceFormat: 'POS-{date}-{seq}',
    autoPrint: true
  },
  
  // Paramètres stock
  stock: {
    alertExpirationDays: 90,
    criticalExpirationDays: 30,
    defaultUnits: 'Unité',
    minimumStockDays: 30,
    maximumStockDays: 365,
    reorderPointDays: 15,
    safetyStockPercentage: 10,
    valuationMethod: 'FIFO' as const
  }
} as const;

// Type pour les méthodes d'arrondi
export type RoundingMethod = 'ceil' | 'floor' | 'round' | 'none';

// Type pour les méthodes de valorisation
export type ValuationMethod = 'FIFO' | 'LIFO' | 'PMP' | 'CUMP';

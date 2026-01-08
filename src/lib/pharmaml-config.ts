/**
 * Configuration PharmaML Ubipharm
 * Paramètres par pays pour l'intégration des commandes électroniques
 */

export interface PharmaMLCountryConfig {
  code: string;
  label: string;
  url: string;
  codeRepartiteur: string;
  etablissementExemple: string;
}

export const PHARMAML_COUNTRIES: Record<string, PharmaMLCountryConfig> = {
  congo: {
    code: 'congo',
    label: 'Congo (COOPHARCO)',
    url: 'http://pharma-ml.ubipharm-congo.com/COOPHARCO',
    codeRepartiteur: '28',
    etablissementExemple: 'BZV04'
  },
  cote_ivoire: {
    code: 'cote_ivoire',
    label: 'Côte d\'Ivoire (LABOREX)',
    url: 'http://pharma-ml.laborexci.com/LABOREX',
    codeRepartiteur: '28',
    etablissementExemple: 'VRI02'
  },
  senegal: {
    code: 'senegal',
    label: 'Sénégal (COPHASE)',
    url: 'http://pharma-ml.cophase.sn/COPHASE',
    codeRepartiteur: '28',
    etablissementExemple: 'DKR01'
  },
  niger: {
    code: 'niger',
    label: 'Niger (COPHARNI)',
    url: 'http://pharma-ml.ubipharm-niger.com/COPHARNI',
    codeRepartiteur: '28',
    etablissementExemple: 'NIA01'
  },
  burkina: {
    code: 'burkina',
    label: 'Burkina Faso (COPHADIS)',
    url: 'http://pharma-ml.ubipharm-burkina.com/COPHADIS',
    codeRepartiteur: '28',
    etablissementExemple: 'BMG05'
  },
  cameroun: {
    code: 'cameroun',
    label: 'Cameroun (UCPHARM)',
    url: 'http://pharma-ml.ucpharm.com/UCPHARM',
    codeRepartiteur: '28',
    etablissementExemple: 'DLA01'
  },
  togo: {
    code: 'togo',
    label: 'Togo (GTPHARM)',
    url: 'http://pharma-ml.ubipharm-togo.com/GTPHARM',
    codeRepartiteur: '28',
    etablissementExemple: 'LOM01'
  },
  mali: {
    code: 'mali',
    label: 'Mali (COPHARMA)',
    url: 'http://pharma-ml.ubipharm-mali.com/COPHARMA',
    codeRepartiteur: '28',
    etablissementExemple: 'BKO08'
  },
  gabon: {
    code: 'gabon',
    label: 'Gabon (COPHARGA)',
    url: 'http://pharma-ml.copharga.com/COPHARGA',
    codeRepartiteur: '28',
    etablissementExemple: 'LBV01'
  },
  guadeloupe: {
    code: 'guadeloupe',
    label: 'Guadeloupe (COPHAG)',
    url: 'http://pharma-ml.cophag.fr/COPHAG',
    codeRepartiteur: '28',
    etablissementExemple: 'PAP01'
  },
  guyane: {
    code: 'guyane',
    label: 'Guyane (COPHAGUY)',
    url: 'http://pharma-ml.cophaguy.fr/COPHAGUY',
    codeRepartiteur: '19',
    etablissementExemple: 'CAY01'
  },
  martinique: {
    code: 'martinique',
    label: 'Martinique (CERPMA)',
    url: 'http://pharma-ml.ubipharm-martinique.com/CERPMA',
    codeRepartiteur: '15',
    etablissementExemple: 'FDF01'
  }
};

// Clé secrète par défaut pour PharmaML (selon documentation Ubipharm)
export const PHARMAML_DEFAULT_SECRET_KEY = 'PHDA';

// Statuts possibles de transmission
export type PharmaMLTransmissionStatus = 'pending' | 'success' | 'error' | 'timeout';

// Interface pour les données de configuration fournisseur
export interface PharmaMLSupplierConfig {
  pharmaml_enabled: boolean;
  pharmaml_url: string | null;
  pharmaml_code_repartiteur: string | null;
  pharmaml_id_repartiteur: string | null;
  pharmaml_cle_secrete: string | null;
  pharmaml_id_officine: string | null;
  pharmaml_pays: string | null;
}

// Fonction utilitaire pour obtenir la config d'un pays
export const getPharmaMLCountryConfig = (countryCode: string): PharmaMLCountryConfig | null => {
  return PHARMAML_COUNTRIES[countryCode] || null;
};

// Fonction pour vérifier si un fournisseur a PharmaML configuré
export const isPharmaMLConfigured = (supplier: Partial<PharmaMLSupplierConfig>): boolean => {
  return Boolean(
    supplier.pharmaml_enabled &&
    supplier.pharmaml_url &&
    supplier.pharmaml_id_repartiteur &&
    supplier.pharmaml_id_officine
  );
};

// Fonction pour générer l'URL de test de connexion
export const getPharmaMLTestUrl = (baseUrl: string): string => {
  // L'URL de base peut être testée directement dans un navigateur selon la documentation
  return baseUrl;
};

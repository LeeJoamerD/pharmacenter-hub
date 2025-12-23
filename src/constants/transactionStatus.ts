/**
 * Constantes pour les statuts de rapprochement des transactions bancaires
 * Ces valeurs correspondent exactement aux contraintes CHECK de la base de données
 */
export const TRANSACTION_STATUS = {
  NON_RAPPROCHE: 'non_rapproche',
  RAPPROCHE: 'rapproche',
  RAPPROCHE_PARTIEL: 'rapproche_partiel',
  SUSPECT: 'suspect',
  IGNORE: 'ignore'
} as const;

export type TransactionStatusType = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];

/**
 * Labels d'affichage pour les statuts de rapprochement
 */
export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  'non_rapproche': 'À rapprocher',
  'rapproche': 'Rapproché',
  'rapproche_partiel': 'Rapproché partiellement',
  'suspect': 'Suspect',
  'ignore': 'Ignoré',
  // Fallback pour les anciennes valeurs
  'Rapproché': 'Rapproché',
  'Non rapproché': 'À rapprocher'
};

/**
 * Formate un statut de rapprochement pour l'affichage utilisateur
 */
export const formatReconciliationStatus = (status: string | null | undefined): string => {
  if (!status) return 'À rapprocher';
  return TRANSACTION_STATUS_LABELS[status] || status;
};

/**
 * Vérifie si une transaction est rapprochée
 */
export const isReconciled = (status: string | null | undefined): boolean => {
  return status === TRANSACTION_STATUS.RAPPROCHE || status === 'Rapproché';
};

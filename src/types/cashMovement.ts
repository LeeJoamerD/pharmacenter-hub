/**
 * Types de mouvements de caisse autorisés par la base de données
 */
export const CASH_MOVEMENT_TYPES = [
  'Entrée',
  'Sortie',
  'Ajustement',
  'Fond_initial',
  'Vente',
  'Remboursement',
  'Dépense'
] as const;

export type CashMovementType = typeof CASH_MOVEMENT_TYPES[number];

/**
 * Helper pour déterminer si un mouvement est sortant (diminue le solde)
 */
export const isOutgoingMovement = (type: CashMovementType): boolean => {
  return ['Sortie', 'Remboursement', 'Dépense'].includes(type);
};

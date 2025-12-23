/**
 * Constantes pour les statuts des écritures comptables
 * Ces valeurs doivent correspondre à la contrainte CHECK de la table ecritures_comptables
 */
export const ACCOUNTING_ENTRY_STATUS = {
  BROUILLON: 'Brouillon',
  VALIDE: 'Validé',
  VALIDEE: 'Validée',
  VERROUILLE: 'Verrouillé',
  LETTREE: 'Lettrée',
} as const;

export type AccountingEntryStatus = typeof ACCOUNTING_ENTRY_STATUS[keyof typeof ACCOUNTING_ENTRY_STATUS];

/**
 * Constantes pour les statuts des exercices comptables
 */
export const EXERCICE_STATUS = {
  EN_COURS: 'En cours',
  OUVERT: 'Ouvert',
  CLOTURE: 'Clôturé',
} as const;

export type ExerciceStatus = typeof EXERCICE_STATUS[keyof typeof EXERCICE_STATUS];

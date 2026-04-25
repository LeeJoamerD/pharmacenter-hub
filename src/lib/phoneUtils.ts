/**
 * Normalise un numéro de téléphone en supprimant les espaces et séparateurs
 * usuels (espaces, tirets, parenthèses, points). Conserve le '+' initial.
 *
 * Retourne le numéro nettoyé s'il est valide (8 à 15 chiffres avec '+' optionnel),
 * sinon `null`.
 */
export const normalizePhone = (raw?: string | null): string | null => {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s\-().]/g, '');
  return /^\+?\d{8,15}$/.test(cleaned) ? cleaned : null;
};

/**
 * Vérifie si une chaîne représente un numéro de téléphone valide
 * (après normalisation).
 */
export const isValidPhone = (raw?: string | null): boolean =>
  normalizePhone(raw) !== null;

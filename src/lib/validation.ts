export const sanitizeInput = (input: string, maxLength: number = 255): string => {
  if (!input) return '';
  // Nettoyer les caractères dangereux et limiter la longueur
  return input
    .trim()
    .replace(/[<>]/g, '') // Retirer les balises HTML
    .slice(0, maxLength);
};

export const validateQuantity = (quantity: number): boolean => {
  return !isNaN(quantity) && isFinite(quantity) && quantity >= 0 && quantity <= 999999;
};

export const validateLocation = (location: string): boolean => {
  const sanitized = sanitizeInput(location, 50);
  return sanitized.length > 0 && sanitized.length <= 50;
};

export const validateComment = (comment: string): boolean => {
  const sanitized = sanitizeInput(comment, 1000);
  return sanitized.length <= 1000;
};

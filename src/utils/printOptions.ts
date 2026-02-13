/**
 * Options d'impression partagées entre tous les générateurs de tickets
 */
export interface PrintOptions {
  autoprint: boolean;        // true = impression directe, false = aperçu seulement
  receiptFooter?: string;    // Pied de page personnalisé
  printLogo?: boolean;       // Afficher le logo PharmaSoft
  includeBarcode?: boolean;  // Code-barres sur le reçu
  paperSize?: string;        // Format papier (thermal_80mm, thermal_58mm, a4)
}

/**
 * Retourne la largeur en mm selon le format papier
 */
export function getPaperWidth(paperSize?: string): number {
  switch (paperSize) {
    case 'thermal_58mm': return 58;
    case 'a4': return 210;
    case 'thermal_80mm':
    default: return 80;
  }
}

/**
 * Retourne la marge intérieure selon le format papier
 */
export function getMargins(paperSize?: string): { left: number; right: number; center: number } {
  const width = getPaperWidth(paperSize);
  if (width <= 58) {
    return { left: 3, right: 55, center: 29 };
  }
  if (width >= 210) {
    return { left: 15, right: 195, center: 105 };
  }
  // 80mm default
  return { left: 5, right: 75, center: 40 };
}

/**
 * Ouvre le PDF généré : impression directe ou aperçu selon les options
 */
export function openPdfWithOptions(pdfUrl: string, options?: PrintOptions): void {
  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow && options?.autoprint !== false) {
    // autoprint=true (ou undefined pour rétrocompatibilité) => impression directe
    printWindow.onload = () => printWindow.print();
  }
  // Si autoprint=false, on ouvre juste l'aperçu sans déclencher print()
}

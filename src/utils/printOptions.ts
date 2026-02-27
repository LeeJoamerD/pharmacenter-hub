/**
 * Options d'impression partagées entre tous les générateurs de tickets
 */
export interface PrintOptions {
  autoprint: boolean;        // true = impression directe, false = aperçu seulement
  receiptFooter?: string;    // Pied de page personnalisé (legacy, remplacé par receiptFooterLines)
  printLogo?: boolean;       // Afficher le logo PharmaSoft
  includeBarcode?: boolean;  // Code-barres sur le reçu
  paperSize?: string;        // Format papier (thermal_80mm, thermal_58mm, a4)
  receiptHeaderLines?: string;  // Lignes d'en-tête reçu (depuis Paramètres/Impressions)
  receiptFooterLines?: string;  // Lignes de pied reçu (depuis Paramètres/Impressions)
  showAddress?: boolean;        // Afficher l'adresse sur le reçu
  receiptWidth?: number;        // Largeur papier reçu en mm (58, 80, 110)
}

/**
 * Retourne la largeur en mm selon le format papier
 */
export function getPaperWidth(paperSize?: string, receiptWidth?: number): number {
  // receiptWidth from Paramètres/Impressions takes priority
  if (receiptWidth && receiptWidth > 0) return receiptWidth;
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
export function getMargins(paperSize?: string, receiptWidth?: number): { left: number; right: number; center: number } {
  const width = getPaperWidth(paperSize, receiptWidth);
  if (width <= 58) {
    return { left: 3, right: 55, center: 29 };
  }
  if (width >= 210) {
    return { left: 15, right: 195, center: 105 };
  }
  if (width >= 110) {
    return { left: 5, right: 105, center: 55 };
  }
  // 80mm default
  return { left: 5, right: 75, center: 40 };
}

/**
 * Ouvre le PDF généré : impression directe ou aperçu selon les options
 */
export function openPdfWithOptions(pdfUrl: string, options?: PrintOptions): void {
  if (options?.autoprint !== false) {
    // autoprint=true (ou undefined pour rétrocompatibilité) => impression directe via iframe caché
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = pdfUrl;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        // Fallback: ouvrir dans un nouvel onglet si l'iframe ne supporte pas print
        window.open(pdfUrl, '_blank');
      }
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 5000);
    };
    document.body.appendChild(iframe);
  } else {
    // autoprint=false => aperçu dans un nouvel onglet sans déclencher print()
    window.open(pdfUrl, '_blank');
  }
}

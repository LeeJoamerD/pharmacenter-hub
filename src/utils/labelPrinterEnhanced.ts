// @ts-ignore - bwip-js types are not fully compatible
import bwipjs from 'bwip-js';
import jsPDF from 'jspdf';

// Types pour les données d'étiquettes enrichies
export interface EnhancedLabelData {
  id: string;
  nom: string;
  code_cip?: string | null;
  code_barre_externe?: string | null;
  prix_vente: number;
  dci?: string | null;
  date_peremption?: string | null;
  numero_lot?: string | null;
  pharmacyName: string;
  supplierPrefix: string; // 3 premières lettres du laboratoire
}

export interface LabelConfig {
  width: number;        // en mm
  height: number;       // en mm
  barcodeType: 'code128' | 'ean13';
  includeDci: boolean;
  includeLot: boolean;
  includeExpiry: boolean;
  quantity: number;
}

export const DEFAULT_LABEL_CONFIG: LabelConfig = {
  width: 50,
  height: 30,
  barcodeType: 'code128',
  includeDci: true,
  includeLot: false,
  includeExpiry: false,
  quantity: 1
};

export const LABEL_SIZES = [
  { label: '40 × 30 mm', width: 40, height: 30 },
  { label: '50 × 30 mm', width: 50, height: 30 },
  { label: '60 × 40 mm', width: 60, height: 40 }
];

/**
 * Génère une image de code-barres scannable (Code 128 ou EAN-13)
 */
export async function generateBarcodeImage(
  code: string,
  type: 'code128' | 'ean13' = 'code128'
): Promise<string> {
  if (!code) {
    throw new Error('Code manquant pour la génération du code-barres');
  }

  const canvas = document.createElement('canvas');
  
  try {
    // Pour EAN-13, le code doit avoir exactement 12 ou 13 chiffres
    let finalCode = code;
    if (type === 'ean13') {
      // Nettoyer le code et vérifier le format
      finalCode = code.replace(/\D/g, '');
      if (finalCode.length < 12) {
        // Padding avec des zéros
        finalCode = finalCode.padStart(12, '0');
      } else if (finalCode.length > 13) {
        finalCode = finalCode.substring(0, 13);
      }
    }

    await bwipjs.toCanvas(canvas, {
      bcid: type,
      text: finalCode,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
      textsize: 8
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erreur génération code-barres:', error);
    // Fallback vers Code 128 si EAN-13 échoue
    if (type === 'ean13') {
      return generateBarcodeImage(code, 'code128');
    }
    throw error;
  }
}

/**
 * Obtient le code à utiliser pour le code-barres (CIP ou code externe)
 */
export function getProductBarcode(product: EnhancedLabelData): string | null {
  return product.code_cip || product.code_barre_externe || null;
}

/**
 * Génère un PDF avec des étiquettes pour impression
 */
export async function printEnhancedLabels(
  products: EnhancedLabelData[],
  config: LabelConfig = DEFAULT_LABEL_CONFIG
): Promise<string> {
  const { width, height } = config;
  
  // Calcul du nombre d'étiquettes par page A4 (210 × 297 mm)
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 5;
  const marginY = 5;
  
  const labelsPerRow = Math.floor((pageWidth - 2 * marginX) / width);
  const labelsPerCol = Math.floor((pageHeight - 2 * marginY) / height);
  const labelsPerPage = labelsPerRow * labelsPerCol;
  
  // Créer le PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Générer toutes les étiquettes
  const allLabels: { product: EnhancedLabelData; barcodeImage: string | null }[] = [];
  
  for (const product of products) {
    const barcode = getProductBarcode(product);
    let barcodeImage: string | null = null;
    
    if (barcode) {
      try {
        barcodeImage = await generateBarcodeImage(barcode, config.barcodeType);
      } catch (error) {
        console.error(`Erreur code-barres pour ${product.nom}:`, error);
      }
    }
    
    // Ajouter le nombre d'étiquettes demandées
    for (let q = 0; q < config.quantity; q++) {
      allLabels.push({ product, barcodeImage });
    }
  }

  // Dessiner les étiquettes
  let currentLabel = 0;
  let pageNum = 0;

  while (currentLabel < allLabels.length) {
    if (pageNum > 0) {
      pdf.addPage();
    }

    for (let row = 0; row < labelsPerCol && currentLabel < allLabels.length; row++) {
      for (let col = 0; col < labelsPerRow && currentLabel < allLabels.length; col++) {
        const x = marginX + col * width;
        const y = marginY + row * height;
        const { product, barcodeImage } = allLabels[currentLabel];
        
        drawLabel(pdf, product, barcodeImage, x, y, width, height, config);
        currentLabel++;
      }
    }
    pageNum++;
  }

  // Retourner l'URL du PDF
  return pdf.output('bloburl').toString();
}

/**
 * Dessine une étiquette individuelle sur le PDF
 */
function drawLabel(
  pdf: jsPDF,
  product: EnhancedLabelData,
  barcodeImage: string | null,
  x: number,
  y: number,
  width: number,
  height: number,
  config: LabelConfig
): void {
  const padding = 1.5;
  const innerWidth = width - 2 * padding;
  const innerX = x + padding;
  let currentY = y + padding;

  // Bordure de l'étiquette
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.1);
  pdf.rect(x, y, width, height);

  // Ligne 1: Nom pharmacie + Préfixe fournisseur
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  
  const pharmacyName = truncateText(product.pharmacyName, 20);
  const supplierPrefix = product.supplierPrefix || '---';
  
  pdf.text(pharmacyName, innerX, currentY + 2.5);
  pdf.text(`[${supplierPrefix}]`, innerX + innerWidth, currentY + 2.5, { align: 'right' });
  
  currentY += 4;
  
  // Ligne séparatrice
  pdf.setDrawColor(220, 220, 220);
  pdf.line(innerX, currentY, innerX + innerWidth, currentY);
  currentY += 1;

  // Nom du produit (gras)
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  const productName = truncateText(product.nom, 35);
  pdf.text(productName, innerX + innerWidth / 2, currentY + 2.5, { align: 'center' });
  currentY += 4;

  // DCI (italique) si activé
  if (config.includeDci && product.dci) {
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'italic');
    const dci = truncateText(product.dci, 30);
    pdf.text(dci, innerX + innerWidth / 2, currentY + 2, { align: 'center' });
    currentY += 3;
  }

  // Code-barres
  if (barcodeImage) {
    const barcodeHeight = 8;
    const barcodeWidth = Math.min(innerWidth - 4, 35);
    const barcodeX = innerX + (innerWidth - barcodeWidth) / 2;
    
    try {
      pdf.addImage(barcodeImage, 'PNG', barcodeX, currentY, barcodeWidth, barcodeHeight);
    } catch (error) {
      console.error('Erreur ajout image code-barres:', error);
    }
    currentY += barcodeHeight + 1;
  } else {
    // Afficher le code en texte si pas de code-barres
    const code = getProductBarcode(product);
    if (code) {
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(code, innerX + innerWidth / 2, currentY + 3, { align: 'center' });
      currentY += 5;
    }
  }

  // Ligne prix + lot
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  const price = `${product.prix_vente.toFixed(2)} DH`;
  pdf.text(price, innerX, currentY + 2.5);
  
  if (config.includeLot && product.numero_lot) {
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Lot: ${product.numero_lot}`, innerX + innerWidth, currentY + 2.5, { align: 'right' });
  }
  currentY += 3.5;

  // Date d'expiration si activée
  if (config.includeExpiry && product.date_peremption) {
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    const expDate = formatExpiryDate(product.date_peremption);
    pdf.text(`Exp: ${expDate}`, innerX, currentY + 2);
  }
}

/**
 * Tronque le texte si trop long
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formate la date d'expiration
 */
function formatExpiryDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Ouvre le dialogue d'impression pour le PDF
 */
export function openPrintDialog(pdfUrl: string): void {
  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

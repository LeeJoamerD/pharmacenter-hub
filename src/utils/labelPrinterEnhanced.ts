// @ts-ignore - bwip-js types are not fully compatible
import bwipjs from 'bwip-js';
import jsPDF from 'jspdf';
import { formatCurrencyAmount, formatNumber } from '@/utils/currencyFormatter';

// Types pour les données d'étiquettes enrichies (produits)
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
  currencySymbol?: string; // Symbole de devise pour le formatage
}

// Types pour les données d'étiquettes de lots (avec code-barres lot)
export interface LotLabelData {
  id: string;
  code_barre: string;  // Le code-barres généré pour le lot
  numero_lot: string;
  date_peremption: string | null;
  nom_produit: string;
  prix_vente: number;
  pharmacyName: string;
  supplierPrefix: string;
  // Champs enrichis
  quantite_restante: number;  // Pour calculer le nombre d'étiquettes
  currencySymbol: string;     // Pour le formatage du prix
  dci?: string | null;        // Pour l'option "Inclure DCI"
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
  { label: '38 × 21.2 mm (5/ligne)', width: 38, height: 21.2 },
  { label: '40 × 30 mm', width: 40, height: 30 },
  { label: '50 × 30 mm', width: 50, height: 30 },
  { label: '60 × 40 mm', width: 60, height: 40 }
];

// Configuration spécifique pour le format WinDev 39.9x20.2
function getLayoutConfig(width: number, height: number) {
  const isWinDevFormat = Math.abs(width - 38) < 0.1 && Math.abs(height - 21.2) < 0.1;
  if (isWinDevFormat) {
    return {
      marginLeft: 10, marginTop: 12,
      marginRight: 0.5, marginBottom: 4.6,
      gapX: 0.5, gapY: 0.5,
      padding: 0,
      edgeToEdge: true,
      forcedLabelsPerRow: 5 as number | null,
      forcedLabelsPerCol: 13 as number | null,
      originX: 10 as number | null,
      originY: 12 as number | null,
      pitchX: 38.5 as number | null,
      pitchY: 21.7 as number | null
    };
  }
  return {
    marginLeft: 5, marginTop: 5,
    marginRight: 5, marginBottom: 5,
    gapX: 0, gapY: 0,
    padding: 1.5,
    edgeToEdge: false,
    forcedLabelsPerRow: null as number | null,
    forcedLabelsPerCol: null as number | null,
    originX: null as number | null,
    originY: null as number | null,
    pitchX: null as number | null,
    pitchY: null as number | null
  };
}

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
  const layout = getLayoutConfig(width, height);
  
  // Calcul du nombre d'étiquettes par page A4 (210 × 297 mm)
  const pageWidth = 210;
  const pageHeight = 297;
  
  const usableWidth = pageWidth - layout.marginLeft - layout.marginRight;
  const usableHeight = pageHeight - layout.marginTop - layout.marginBottom;
  const labelsPerRow = layout.forcedLabelsPerRow
    ?? Math.floor((usableWidth + layout.gapX) / (width + layout.gapX));
  const labelsPerCol = layout.forcedLabelsPerCol
    ?? Math.floor((usableHeight + layout.gapY) / (height + layout.gapY));
  const startX = layout.originX ?? layout.marginLeft;
  const startY = layout.originY ?? layout.marginTop;
  const stepX = layout.pitchX ?? (width + layout.gapX);
  const stepY = layout.pitchY ?? (height + layout.gapY);
  
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
        const x = startX + col * stepX;
        const y = startY + row * stepY;
        const { product, barcodeImage } = allLabels[currentLabel];
        
        drawLabel(pdf, product, barcodeImage, x, y, width, height, config, layout.padding);
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
  config: LabelConfig,
  padding: number = 1.5
): void {
  const compact = height < 25;
  const isEdgeToEdge = Math.abs(width - 38) < 0.1 && Math.abs(height - 21.2) < 0.1;
  // For edge-to-edge: +1mm internal margins
  const effectivePadding = isEdgeToEdge ? 0 : padding;
  const textInset = isEdgeToEdge ? 1.15 : effectivePadding;
  const innerWidth = width - 2 * textInset;
  const innerX = x + textInset;
  let currentY = y + (isEdgeToEdge ? 1.1 : (compact ? 0.8 : padding));

  // Bordure de l'étiquette (jamais pour format bord-à-bord)
  if (!isEdgeToEdge) {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);
    pdf.rect(x, y, width, height);
  }

  // Ligne 1: Nom pharmacie + Préfixe fournisseur
  pdf.setFontSize(isEdgeToEdge ? 5.5 : (compact ? 4.5 : 6));
  pdf.setFont('helvetica', 'normal');
  
  const pharmacyName = truncateText(product.pharmacyName, isEdgeToEdge ? 30 : (compact ? 18 : 20));
  const supplierPrefix = product.supplierPrefix || '---';
  
  pdf.text(pharmacyName, innerX, currentY + (isEdgeToEdge ? 1.2 : (compact ? 1.5 : 2.5)));
  pdf.text(`[${supplierPrefix}]`, innerX + innerWidth, currentY + (isEdgeToEdge ? 1.2 : (compact ? 1.5 : 2.5)), { align: 'right' });
  
  currentY += isEdgeToEdge ? 1.8 : (compact ? 2.5 : 4);
  
  // Ligne séparatrice (pleine largeur physique pour bord-à-bord)
  pdf.setDrawColor(220, 220, 220);
  if (isEdgeToEdge) {
    pdf.line(x, currentY, x + width, currentY);
  } else {
    pdf.line(innerX, currentY, innerX + innerWidth, currentY);
  }
  currentY += isEdgeToEdge ? 0.3 : (compact ? 0.5 : 1);

  // Nom du produit (gras) — fond noir + texte blanc pour edge-to-edge
  if (isEdgeToEdge) {
    const bandHeight = 4;
    pdf.setFillColor(0, 0, 0);
    pdf.rect(x, currentY, width, bandHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const productName = truncateText(product.nom, 30);
    pdf.text(productName, x + width / 2, currentY + 3, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    currentY += bandHeight + 0.3;
  } else {
    pdf.setFontSize(compact ? 5.5 : 7);
    pdf.setFont('helvetica', 'bold');
    const productName = truncateText(product.nom, compact ? 25 : 35);
    pdf.text(productName, x + width / 2, currentY + (compact ? 2 : 2.5), { align: 'center' });
    currentY += compact ? 2.5 : 4;
  }

  // DCI (italique) si activé
  if (config.includeDci && product.dci) {
    pdf.setFontSize(isEdgeToEdge ? 4 : (compact ? 4 : 5));
    pdf.setFont('helvetica', 'italic');
    const dci = truncateText(product.dci, compact ? 22 : 30);
    pdf.text(dci, x + width / 2, currentY + (isEdgeToEdge ? 1.2 : (compact ? 1.5 : 2)), { align: 'center' });
    currentY += isEdgeToEdge ? 1.6 : (compact ? 2 : 3);
  }

  // Code-barres
  if (barcodeImage) {
    const barcodeHeight = isEdgeToEdge ? 5 : (compact ? 5 : 8);
    // Edge-to-edge: barcode fills full label width
    const barcodeWidth = isEdgeToEdge ? 34 : Math.min(innerWidth - 4, compact ? 28 : 35);
    const barcodeX = x + (width - barcodeWidth) / 2;
    
    try {
      pdf.addImage(barcodeImage, 'PNG', barcodeX, currentY, barcodeWidth, barcodeHeight);
    } catch (error) {
      console.error('Erreur ajout image code-barres:', error);
    }
    currentY += barcodeHeight + (isEdgeToEdge ? 0.2 : (compact ? 0.5 : 1));
  } else {
    const code = getProductBarcode(product);
    if (code) {
      pdf.setFontSize(compact ? 5 : 6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(code, x + width / 2, currentY + (compact ? 2 : 3), { align: 'center' });
      currentY += compact ? 3 : 5;
    }
  }

  // Ligne prix + lot/expiration
  if (isEdgeToEdge) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const priceOnly = formatNumber(product.prix_vente, product.currencySymbol || 'FCFA');
    pdf.text(priceOnly, innerX, currentY + 2.5);
    
    if (config.includeExpiry && product.date_peremption) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const expDate = formatExpiryDate(product.date_peremption);
      pdf.text(`Exp: ${expDate}`, innerX + innerWidth, currentY + 2.5, { align: 'right' });
    } else if (config.includeLot && product.numero_lot) {
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Lot: ${product.numero_lot}`, innerX + innerWidth, currentY + 2.5, { align: 'right' });
    }
  } else {
    pdf.setFontSize(compact ? 5 : 6);
    pdf.setFont('helvetica', 'bold');
    const price = formatCurrencyAmount(product.prix_vente, product.currencySymbol || 'FCFA');
    pdf.text(price, innerX, currentY + (compact ? 1.5 : 2.5));
    
    if (config.includeLot && product.numero_lot) {
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Lot: ${product.numero_lot}`, innerX + innerWidth, currentY + (compact ? 1.5 : 2.5), { align: 'right' });
    }
    currentY += compact ? 2 : 3.5;

    if (config.includeExpiry && product.date_peremption) {
      pdf.setFontSize(compact ? 4 : 5);
      pdf.setFont('helvetica', 'normal');
      const expDate = formatExpiryDate(product.date_peremption);
      pdf.text(`Exp: ${expDate}`, innerX, currentY + (compact ? 1.5 : 2));
    }
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
 * Génère un PDF avec des étiquettes de LOTS pour impression
 * Utilise le code-barres unique du lot (format: LOT-XXXX-YYMMDD-NNNNN)
 */
export async function printLotLabels(
  lots: LotLabelData[],
  config: LabelConfig = DEFAULT_LABEL_CONFIG
): Promise<string> {
  const { width, height } = config;
  const layout = getLayoutConfig(width, height);
  
  // Calcul du nombre d'étiquettes par page A4 (210 × 297 mm)
  const pageWidth = 210;
  const pageHeight = 297;
  
  const usableWidth = pageWidth - layout.marginLeft - layout.marginRight;
  const usableHeight = pageHeight - layout.marginTop - layout.marginBottom;
  const labelsPerRow = layout.forcedLabelsPerRow
    ?? Math.floor((usableWidth + layout.gapX) / (width + layout.gapX));
  const labelsPerCol = layout.forcedLabelsPerCol
    ?? Math.floor((usableHeight + layout.gapY) / (height + layout.gapY));
  const startX = layout.originX ?? layout.marginLeft;
  const startY = layout.originY ?? layout.marginTop;
  const stepX = layout.pitchX ?? (width + layout.gapX);
  const stepY = layout.pitchY ?? (height + layout.gapY);
  
  // Créer le PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Générer toutes les étiquettes
  const allLabels: { lot: LotLabelData; barcodeImage: string | null }[] = [];
  
  for (const lot of lots) {
    let barcodeImage: string | null = null;
    
    if (lot.code_barre) {
      try {
        barcodeImage = await generateBarcodeImage(lot.code_barre, 'code128');
      } catch (error) {
        console.error(`Erreur code-barres pour lot ${lot.numero_lot}:`, error);
      }
    }
    
    const labelCount = lot.quantite_restante || 1;
    for (let q = 0; q < labelCount; q++) {
      allLabels.push({ lot, barcodeImage });
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
        const x = startX + col * stepX;
        const y = startY + row * stepY;
        const { lot, barcodeImage } = allLabels[currentLabel];
        
        drawLotLabel(pdf, lot, barcodeImage, x, y, width, height, config, layout.padding);
        currentLabel++;
      }
    }
    pageNum++;
  }

  // Retourner l'URL du PDF
  return pdf.output('bloburl').toString();
}

/**
 * Dessine une étiquette de LOT individuelle sur le PDF
 */
function drawLotLabel(
  pdf: jsPDF,
  lot: LotLabelData,
  barcodeImage: string | null,
  x: number,
  y: number,
  width: number,
  height: number,
  config: LabelConfig,
  padding: number = 1.5
): void {
  const compact = height < 25;
  const isEdgeToEdge = Math.abs(width - 38) < 0.1 && Math.abs(height - 21.2) < 0.1;
  const effectivePadding = isEdgeToEdge ? 0 : padding;
  const textInset = isEdgeToEdge ? 1.15 : effectivePadding;
  const innerWidth = width - 2 * textInset;
  const innerX = x + textInset;
  let currentY = y + (isEdgeToEdge ? 1.1 : (compact ? 0.8 : padding));

  // Bordure (jamais pour format bord-à-bord)
  if (!isEdgeToEdge) {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);
    pdf.rect(x, y, width, height);
  }

  // Ligne 1: Nom pharmacie + Préfixe fournisseur
  pdf.setFontSize(isEdgeToEdge ? 5.5 : (compact ? 4.5 : 6));
  pdf.setFont('helvetica', 'normal');
  
  const pharmacyName = truncateText(lot.pharmacyName, isEdgeToEdge ? 30 : (compact ? 18 : 20));
  const supplierPrefix = lot.supplierPrefix || '---';
  
  pdf.text(pharmacyName, innerX, currentY + (isEdgeToEdge ? 1.2 : (compact ? 1.5 : 2.5)));
  pdf.text(`[${supplierPrefix}]`, innerX + innerWidth, currentY + (isEdgeToEdge ? 1.2 : (compact ? 1.5 : 2.5)), { align: 'right' });
  
  currentY += isEdgeToEdge ? 1.8 : (compact ? 2.5 : 4);
  
  // Ligne séparatrice (pleine largeur physique pour bord-à-bord)
  pdf.setDrawColor(220, 220, 220);
  if (isEdgeToEdge) {
    pdf.line(x, currentY, x + width, currentY);
  } else {
    pdf.line(innerX, currentY, innerX + innerWidth, currentY);
  }
  currentY += isEdgeToEdge ? 0.3 : (compact ? 0.5 : 1);

  // Nom du produit (gras) — fond noir + texte blanc pour edge-to-edge
  if (isEdgeToEdge) {
    const bandHeight = 4;
    pdf.setFillColor(0, 0, 0);
    pdf.rect(x, currentY, width, bandHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const productName = truncateText(lot.nom_produit, 30);
    pdf.text(productName, x + width / 2, currentY + 3, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    currentY += bandHeight + 0.3;
  } else {
    pdf.setFontSize(compact ? 5.5 : 7);
    pdf.setFont('helvetica', 'bold');
    const productName = truncateText(lot.nom_produit, compact ? 25 : 35);
    pdf.text(productName, x + width / 2, currentY + (compact ? 2 : 2.5), { align: 'center' });
    currentY += compact ? 2.5 : 4;
  }

  // DCI (italique) si activé
  if (config.includeDci) {
    pdf.setFontSize(isEdgeToEdge ? 4 : (compact ? 4 : 5));
    pdf.setFont('helvetica', 'italic');
    const dciText = lot.dci ? truncateText(lot.dci, compact ? 22 : 30) : '-';
    pdf.text(dciText, x + width / 2, currentY + (isEdgeToEdge ? 1.2 : (compact ? 1.5 : 2)), { align: 'center' });
    currentY += isEdgeToEdge ? 1.6 : (compact ? 2 : 3);
  }

  // Numéro de lot (conditionnel)
  if (config.includeLot) {
    pdf.setFontSize(isEdgeToEdge ? 4 : (compact ? 4 : 5));
    pdf.setFont('helvetica', 'normal');
    const lotNum = `Lot: ${lot.numero_lot}`;
    pdf.text(lotNum, x + width / 2, currentY + (isEdgeToEdge ? 1.2 : (compact ? 1.5 : 2)), { align: 'center' });
    currentY += isEdgeToEdge ? 1.6 : (compact ? 2 : 3);
  }

  // Code-barres du lot
  if (barcodeImage) {
    const barcodeHeight = isEdgeToEdge ? 5 : (compact ? 5 : 8);
    const barcodeWidth = isEdgeToEdge ? 34 : Math.min(innerWidth - 4, compact ? 28 : 35);
    const barcodeX = x + (width - barcodeWidth) / 2;
    
    try {
      pdf.addImage(barcodeImage, 'PNG', barcodeX, currentY, barcodeWidth, barcodeHeight);
    } catch (error) {
      console.error('Erreur ajout image code-barres lot:', error);
    }
    currentY += barcodeHeight + (isEdgeToEdge ? 0.2 : (compact ? 0.5 : 1));
  } else {
    if (lot.code_barre) {
      pdf.setFontSize(compact ? 5 : 6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(lot.code_barre, x + width / 2, currentY + (compact ? 2 : 3), { align: 'center' });
      currentY += compact ? 3 : 5;
    }
  }

  // Ligne prix + date expiration
  if (isEdgeToEdge) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const priceOnly = formatNumber(lot.prix_vente, lot.currencySymbol);
    pdf.text(priceOnly, innerX, currentY + 2.5);
    
    if (config.includeExpiry) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const expDate = lot.date_peremption ? formatExpiryDate(lot.date_peremption) : 'N/D';
      pdf.text(`Exp: ${expDate}`, innerX + innerWidth, currentY + 2.5, { align: 'right' });
    }
  } else {
    pdf.setFontSize(compact ? 5 : 6);
    pdf.setFont('helvetica', 'bold');
    const price = formatCurrencyAmount(lot.prix_vente, lot.currencySymbol);
    pdf.text(price, innerX, currentY + (compact ? 1.5 : 2.5));
    
    if (config.includeExpiry) {
      pdf.setFont('helvetica', 'normal');
      const expDate = lot.date_peremption ? formatExpiryDate(lot.date_peremption) : 'N/D';
      pdf.text(`Exp: ${expDate}`, innerX + innerWidth, currentY + (compact ? 1.5 : 2.5), { align: 'right' });
    }
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

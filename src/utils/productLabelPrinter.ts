import jsPDF from 'jspdf';

export interface ProductLabelData {
  nom: string;
  code_cip?: string;
  prix_vente: number;
  dci?: string;
  date_peremption?: string;
  numero_lot?: string;
  stock?: number;
  code_barres?: string;
}

export interface LabelConfig {
  width: number; // mm
  height: number; // mm
  fontSize: number;
  includeBarcode: boolean;
  labelsPerPage?: number;
}

const DEFAULT_CONFIG: LabelConfig = {
  width: 50,
  height: 30,
  fontSize: 8,
  includeBarcode: true,
  labelsPerPage: 1
};

export async function printProductLabel(
  product: ProductLabelData,
  quantity: number = 1,
  config: Partial<LabelConfig> = {}
): Promise<string> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const doc = new jsPDF({
    orientation: finalConfig.width > finalConfig.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [finalConfig.width, finalConfig.height]
  });

  for (let i = 0; i < quantity; i++) {
    if (i > 0) {
      doc.addPage();
    }
    
    let yPos = 5;
    const margin = 3;
    const contentWidth = finalConfig.width - (margin * 2);
    
    // Nom du produit (gras, centré)
    doc.setFontSize(finalConfig.fontSize + 2);
    doc.setFont('helvetica', 'bold');
    const productName = doc.splitTextToSize(product.nom, contentWidth);
    doc.text(productName, finalConfig.width / 2, yPos, { align: 'center' });
    yPos += (productName.length * 4);
    
    // DCI (si disponible)
    if (product.dci) {
      doc.setFontSize(finalConfig.fontSize - 1);
      doc.setFont('helvetica', 'italic');
      const dciText = doc.splitTextToSize(product.dci, contentWidth);
      doc.text(dciText, finalConfig.width / 2, yPos, { align: 'center' });
      yPos += (dciText.length * 3);
    }
    
    yPos += 2;
    
    // Prix (gros, centré)
    doc.setFontSize(finalConfig.fontSize + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(`${product.prix_vente.toFixed(2)} DH`, finalConfig.width / 2, yPos, { align: 'center' });
    yPos += 6;
    
    // Code CIP et Lot
    doc.setFontSize(finalConfig.fontSize - 1);
    doc.setFont('helvetica', 'normal');
    if (product.code_cip) {
      doc.text(`CIP: ${product.code_cip}`, margin, yPos);
      yPos += 3;
    }
    if (product.numero_lot) {
      doc.text(`Lot: ${product.numero_lot}`, margin, yPos);
      yPos += 3;
    }
    if (product.date_peremption) {
      doc.text(`Exp: ${product.date_peremption}`, margin, yPos);
      yPos += 3;
    }
    
    // Code-barres (simple représentation textuelle)
    if (finalConfig.includeBarcode && product.code_cip) {
      yPos += 1;
      doc.setFontSize(finalConfig.fontSize - 2);
      doc.setFont('courier', 'normal');
      doc.text(product.code_cip, finalConfig.width / 2, yPos, { align: 'center' });
    }
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  return pdfUrl;
}

export async function printMultipleLabels(
  products: ProductLabelData[],
  config: Partial<LabelConfig> = {}
): Promise<string> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const labelsPerRow = Math.floor(210 / (finalConfig.width + 5));
  const labelsPerCol = Math.floor(297 / (finalConfig.height + 5));
  const labelsPerPage = labelsPerRow * labelsPerCol;
  
  products.forEach((product, index) => {
    if (index > 0 && index % labelsPerPage === 0) {
      doc.addPage();
    }
    
    const positionInPage = index % labelsPerPage;
    const row = Math.floor(positionInPage / labelsPerRow);
    const col = positionInPage % labelsPerRow;
    
    const xOffset = col * (finalConfig.width + 5) + 5;
    const yOffset = row * (finalConfig.height + 5) + 5;
    
    // Dessiner le contenu de l'étiquette
    drawLabelContent(doc, product, xOffset, yOffset, finalConfig);
  });

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  return pdfUrl;
}

function drawLabelContent(
  doc: jsPDF,
  product: ProductLabelData,
  x: number,
  y: number,
  config: LabelConfig
): void {
  const margin = 2;
  let yPos = y + 3;
  
  // Bordure
  doc.rect(x, y, config.width, config.height);
  
  // Nom
  doc.setFontSize(config.fontSize);
  doc.setFont('helvetica', 'bold');
  const name = doc.splitTextToSize(product.nom, config.width - margin * 2);
  doc.text(name, x + config.width / 2, yPos, { align: 'center' });
  yPos += name.length * 3;
  
  // Prix
  doc.setFontSize(config.fontSize + 2);
  doc.text(`${product.prix_vente.toFixed(2)} DH`, x + config.width / 2, yPos, { align: 'center' });
  yPos += 4;
  
  // Code
  doc.setFontSize(config.fontSize - 1);
  doc.setFont('helvetica', 'normal');
  if (product.code_cip) {
    doc.text(product.code_cip, x + config.width / 2, yPos, { align: 'center' });
  }
}

export function openPrintDialog(pdfUrl: string): void {
  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}

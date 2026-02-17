import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrencyAmount } from './currencyFormatter';

export interface AdvancedReceiptData {
  numero_facture: string;
  date_vente: string;
  heure_vente: string;
  client?: {
    nom?: string;
    telephone?: string;
    type: string;
  };
  loyalty?: {
    points_gagnes: number;
    points_utilises?: number;
    nouveau_solde: number;
    niveau?: string;
  };
  prescription?: {
    numero: string;
    medecin: string;
    date: string;
  };
  items: Array<{
    nom: string;
    quantite: number;
    prix_unitaire: number;
    remise?: number;
    total: number;
    prescription_required?: boolean;
  }>;
  sous_total: number;
  remise_totale: number;
  tva: number;
  total_ttc: number;
  paiements: Array<{
    methode: string;
    montant: number;
    reference?: string;
  }>;
  montant_rendu?: number;
  retour?: {
    vente_origine: string;
    type: 'Retour' | 'Échange';
    montant_rembourse?: number;
  };
  pharmacie: {
    nom: string;
    adresse: string;
    telephone: string;
    email?: string;
  };
  agent?: string;
  currencySymbol?: string;
}

export async function printAdvancedReceipt(data: AdvancedReceiptData): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 300]
  });

  const currency = data.currencySymbol || 'FCFA';
  let yPos = 8;
  const leftMargin = 4;
  const pageWidth = 80;
  const rightMargin = pageWidth - leftMargin;

  // En-tête Pharmacie
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pharmacie.nom, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(data.pharmacie.adresse, pageWidth / 2, yPos, { align: 'center' });
  yPos += 3;
  doc.text(`Tél: ${data.pharmacie.telephone}`, pageWidth / 2, yPos, { align: 'center' });
  if (data.pharmacie.email) {
    yPos += 3;
    doc.text(data.pharmacie.email, pageWidth / 2, yPos, { align: 'center' });
  }
  yPos += 4;

  doc.line(leftMargin, yPos, rightMargin, yPos);
  yPos += 3;

  // Type de transaction
  if (data.retour) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.retour.type.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 3;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vente origine: ${data.retour.vente_origine}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
  }

  // Informations transaction
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Facture: ${data.numero_facture}`, leftMargin, yPos);
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Date: ${data.date_vente} ${data.heure_vente}`, leftMargin, yPos);
  yPos += 3;
  if (data.agent) {
    doc.text(`Agent: ${data.agent}`, leftMargin, yPos);
    yPos += 3;
  }

  // Informations client
  if (data.client) {
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    const clientInfo = [data.client.nom, data.client.type].filter(Boolean).join(' - ');
    doc.text(clientInfo, leftMargin + 12, yPos);
    yPos += 3;
    if (data.client.telephone) {
      doc.text(`  ${data.client.telephone}`, leftMargin, yPos);
      yPos += 3;
    }
  }

  // Prescription
  if (data.prescription) {
    doc.setFont('helvetica', 'bold');
    doc.text('Ord:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.prescription.numero} - Dr. ${data.prescription.medecin}`, leftMargin + 8, yPos);
    yPos += 3;
  }

  doc.line(leftMargin, yPos, rightMargin, yPos);
  yPos += 3;

  // Articles - format compact
  doc.setFontSize(7);
  data.items.forEach(item => {
    const productName = item.prescription_required ? `${item.nom} [Rx]` : item.nom;
    const truncName = productName.length > 22 ? productName.substring(0, 22) + '..' : productName;
    const qtyTotal = `${item.quantite}x${formatCurrencyAmount(item.prix_unitaire, currency)}=${formatCurrencyAmount(item.total, currency)}`;
    doc.text(truncName, leftMargin, yPos);
    doc.text(qtyTotal, rightMargin, yPos, { align: 'right' });
    
    if (item.remise && item.remise > 0) {
      yPos += 3;
      doc.setFontSize(6);
      doc.text(`  remise: -${formatCurrencyAmount(item.remise, currency)}`, leftMargin, yPos);
      doc.setFontSize(7);
    }
    yPos += 3;
  });

  doc.line(leftMargin, yPos, rightMargin, yPos);
  yPos += 3;

  // Totaux
  doc.text('S/Total:', leftMargin, yPos);
  doc.text(formatCurrencyAmount(data.sous_total, currency), rightMargin, yPos, { align: 'right' });
  yPos += 3;

  if (data.remise_totale > 0) {
    doc.text('Remise:', leftMargin, yPos);
    doc.text(`-${formatCurrencyAmount(data.remise_totale, currency)}`, rightMargin, yPos, { align: 'right' });
    yPos += 3;
  }

  doc.text('TVA:', leftMargin, yPos);
  doc.text(formatCurrencyAmount(data.tva, currency), rightMargin, yPos, { align: 'right' });
  yPos += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL TTC:', leftMargin, yPos);
  doc.text(formatCurrencyAmount(data.total_ttc, currency), rightMargin, yPos, { align: 'right' });
  yPos += 4;

  doc.line(leftMargin, yPos, rightMargin, yPos);
  yPos += 3;

  // Paiements
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Paiement:', leftMargin, yPos);
  yPos += 3;
  doc.setFont('helvetica', 'normal');

  data.paiements.forEach(paiement => {
    doc.text(`  ${paiement.methode}:`, leftMargin, yPos);
    doc.text(formatCurrencyAmount(paiement.montant, currency), rightMargin, yPos, { align: 'right' });
    yPos += 3;
    if (paiement.reference) {
      doc.setFontSize(6);
      doc.text(`    Réf: ${paiement.reference}`, leftMargin, yPos);
      yPos += 3;
      doc.setFontSize(7);
    }
  });

  if (data.montant_rendu && data.montant_rendu > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Rendu:', leftMargin, yPos);
    doc.text(formatCurrencyAmount(data.montant_rendu, currency), rightMargin, yPos, { align: 'right' });
    yPos += 3;
  }

  // Retour remboursement
  if (data.retour?.montant_rembourse) {
    doc.setFont('helvetica', 'bold');
    doc.text('Remboursé:', leftMargin, yPos);
    doc.text(formatCurrencyAmount(data.retour.montant_rembourse, currency), rightMargin, yPos, { align: 'right' });
    yPos += 3;
  }

  // Programme de fidélité
  if (data.loyalty) {
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 3;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Fidélité', leftMargin, yPos);
    yPos += 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    
    if (data.loyalty.points_gagnes > 0) {
      doc.text(`+${data.loyalty.points_gagnes} pts gagnés`, leftMargin + 2, yPos);
      yPos += 3;
    }
    if (data.loyalty.points_utilises && data.loyalty.points_utilises > 0) {
      doc.text(`-${data.loyalty.points_utilises} pts utilisés`, leftMargin + 2, yPos);
      yPos += 3;
    }
    doc.text(`Solde: ${data.loyalty.nouveau_solde} pts${data.loyalty.niveau ? ` (${data.loyalty.niveau})` : ''}`, leftMargin + 2, yPos);
    yPos += 3;
  }

  doc.line(leftMargin, yPos, rightMargin, yPos);
  yPos += 3;

  // Pied de page
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.text('Merci de votre visite ! Conservez ce ticket.', pageWidth / 2, yPos, { align: 'center' });

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  return pdfUrl;
}

export function openPrintDialog(pdfUrl: string): void {
  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}

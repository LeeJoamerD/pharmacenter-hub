import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrencyAmount } from './currencyFormatter';

export interface AdvancedReceiptData {
  // Transaction de base
  numero_facture: string;
  date_vente: string;
  heure_vente: string;
  
  // Client et fidélité
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
  
  // Prescription (si applicable)
  prescription?: {
    numero: string;
    medecin: string;
    date: string;
  };
  
  // Articles
  items: Array<{
    nom: string;
    quantite: number;
    prix_unitaire: number;
    remise?: number;
    total: number;
    prescription_required?: boolean;
  }>;
  
  // Totaux
  sous_total: number;
  remise_totale: number;
  tva: number;
  total_ttc: number;
  
  // Paiement
  paiements: Array<{
    methode: string;
    montant: number;
    reference?: string;
  }>;
  montant_rendu?: number;
  
  // Retour/Échange
  retour?: {
    vente_origine: string;
    type: 'Retour' | 'Échange';
    montant_rembourse?: number;
  };
  
  // Pharmacie
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
    format: [80, 297] // Largeur thermique 80mm, hauteur auto
  });

  const currency = data.currencySymbol || 'FCFA';
  let yPos = 10;
  const leftMargin = 5;
  const pageWidth = 80;

  // En-tête Pharmacie
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pharmacie.nom, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.pharmacie.adresse, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text(`Tél: ${data.pharmacie.telephone}`, pageWidth / 2, yPos, { align: 'center' });
  if (data.pharmacie.email) {
    yPos += 4;
    doc.text(data.pharmacie.email, pageWidth / 2, yPos, { align: 'center' });
  }
  yPos += 6;

  // Ligne de séparation
  doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
  yPos += 5;

  // Type de transaction
  if (data.retour) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.retour.type.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vente origine: ${data.retour.vente_origine}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }

  // Informations transaction
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Facture: ${data.numero_facture}`, leftMargin, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${data.date_vente} ${data.heure_vente}`, leftMargin, yPos);
  yPos += 4;
  if (data.agent) {
    doc.text(`Agent: ${data.agent}`, leftMargin, yPos);
    yPos += 4;
  }
  yPos += 2;

  // Informations client
  if (data.client) {
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', leftMargin, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    if (data.client.nom) {
      doc.text(`  ${data.client.nom}`, leftMargin, yPos);
      yPos += 4;
    }
    if (data.client.telephone) {
      doc.text(`  ${data.client.telephone}`, leftMargin, yPos);
      yPos += 4;
    }
    doc.text(`  Type: ${data.client.type}`, leftMargin, yPos);
    yPos += 4;
  }

  // Prescription
  if (data.prescription) {
    doc.setFont('helvetica', 'bold');
    doc.text('Ordonnance:', leftMargin, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`  N°: ${data.prescription.numero}`, leftMargin, yPos);
    yPos += 4;
    doc.text(`  Dr. ${data.prescription.medecin}`, leftMargin, yPos);
    yPos += 4;
    doc.text(`  Date: ${data.prescription.date}`, leftMargin, yPos);
    yPos += 4;
  }

  yPos += 2;
  doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
  yPos += 5;

  // Articles
  doc.setFont('helvetica', 'bold');
  doc.text('Articles', leftMargin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');

  data.items.forEach(item => {
    // Nom du produit
    doc.setFontSize(8);
    const productName = item.prescription_required ? `${item.nom} [Rx]` : item.nom;
    doc.text(productName, leftMargin, yPos);
    yPos += 4;
    
    // Quantité x Prix = Total - utiliser le formatage correct
    const qtyLine = `${item.quantite} x ${formatCurrencyAmount(item.prix_unitaire, currency)} = ${formatCurrencyAmount(item.total, currency)}`;
    doc.text(qtyLine, leftMargin + 2, yPos);
    
    if (item.remise && item.remise > 0) {
      doc.text(`(-${formatCurrencyAmount(item.remise, currency)})`, pageWidth - leftMargin - 15, yPos);
    }
    yPos += 5;
  });

  yPos += 2;
  doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
  yPos += 5;

  // Totaux - utiliser le formatage correct
  doc.setFontSize(8);
  doc.text('Sous-total:', leftMargin, yPos);
  doc.text(formatCurrencyAmount(data.sous_total, currency), pageWidth - leftMargin, yPos, { align: 'right' });
  yPos += 4;

  if (data.remise_totale > 0) {
    doc.text('Remise:', leftMargin, yPos);
    doc.text(`-${formatCurrencyAmount(data.remise_totale, currency)}`, pageWidth - leftMargin, yPos, { align: 'right' });
    yPos += 4;
  }

  doc.text('TVA:', leftMargin, yPos);
  doc.text(formatCurrencyAmount(data.tva, currency), pageWidth - leftMargin, yPos, { align: 'right' });
  yPos += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL TTC:', leftMargin, yPos);
  doc.text(formatCurrencyAmount(data.total_ttc, currency), pageWidth - leftMargin, yPos, { align: 'right' });
  yPos += 6;

  doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
  yPos += 5;

  // Paiements
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Paiement:', leftMargin, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'normal');

  data.paiements.forEach(paiement => {
    doc.text(`  ${paiement.methode}:`, leftMargin, yPos);
    doc.text(formatCurrencyAmount(paiement.montant, currency), pageWidth - leftMargin, yPos, { align: 'right' });
    yPos += 4;
    if (paiement.reference) {
      doc.setFontSize(7);
      doc.text(`    Réf: ${paiement.reference}`, leftMargin, yPos);
      yPos += 3;
      doc.setFontSize(8);
    }
  });

  if (data.montant_rendu && data.montant_rendu > 0) {
    yPos += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Rendu:', leftMargin, yPos);
    doc.text(formatCurrencyAmount(data.montant_rendu, currency), pageWidth - leftMargin, yPos, { align: 'right' });
    yPos += 4;
  }

  // Retour remboursement
  if (data.retour?.montant_rembourse) {
    yPos += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Montant remboursé:', leftMargin, yPos);
    doc.text(formatCurrencyAmount(data.retour.montant_rembourse, currency), pageWidth - leftMargin, yPos, { align: 'right' });
    yPos += 4;
  }

  // Programme de fidélité
  if (data.loyalty) {
    yPos += 4;
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Fidélité', leftMargin, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    
    if (data.loyalty.points_gagnes > 0) {
      doc.text(`Points gagnés: +${data.loyalty.points_gagnes}`, leftMargin + 2, yPos);
      yPos += 4;
    }
    if (data.loyalty.points_utilises && data.loyalty.points_utilises > 0) {
      doc.text(`Points utilisés: -${data.loyalty.points_utilises}`, leftMargin + 2, yPos);
      yPos += 4;
    }
    doc.text(`Nouveau solde: ${data.loyalty.nouveau_solde} pts`, leftMargin + 2, yPos);
    yPos += 4;
    if (data.loyalty.niveau) {
      doc.text(`Niveau: ${data.loyalty.niveau}`, leftMargin + 2, yPos);
      yPos += 4;
    }
  }

  yPos += 4;
  doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
  yPos += 5;

  // Pied de page
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Merci de votre visite !', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Conservez ce ticket', pageWidth / 2, yPos, { align: 'center' });

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

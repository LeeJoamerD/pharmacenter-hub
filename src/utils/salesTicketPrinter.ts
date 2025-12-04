/**
 * Générateur de tickets de vente (mode séparé - sans encaissement)
 * Inclut un code-barres pour faciliter l'encaissement ultérieur
 */
import jsPDF from 'jspdf';

interface SalesTicketData {
  vente: {
    numero_vente: string;
    date_vente: string;
    montant_total_ttc: number;
    montant_net: number;
    remise_globale: number;
  };
  lignes: Array<{
    produit: { libelle_produit: string };
    quantite: number;
    prix_unitaire_ttc: number;
    montant_ligne_ttc: number;
  }>;
  pharmacyInfo: {
    name: string;
    adresse?: string;
    telephone?: string;
  };
  agentName?: string;
  sessionNumero?: string;
}

interface CashReceiptData {
  vente: {
    numero_vente: string;
    date_vente: string;
    montant_net: number;
    montant_paye: number;
    montant_rendu: number;
    mode_paiement: string;
  };
  pharmacyInfo: {
    name: string;
    adresse?: string;
    telephone?: string;
  };
  agentName?: string;
}

/**
 * Génère un code-barres Code 128 simplifié (représentation textuelle)
 */
function generateBarcodeText(text: string): string {
  return `*${text}*`;
}

/**
 * Imprime un ticket de vente (sans encaissement)
 */
export async function printSalesTicket(data: SalesTicketData): Promise<string> {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 250] // Ticket thermique 80mm, plus long pour le code-barres
  });

  let y = 10;

  // Bandeau "À ENCAISSER"
  doc.setFillColor(255, 200, 0);
  doc.rect(0, 0, 80, 12, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('À ENCAISSER', 40, 8, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y = 18;

  // En-tête avec PharmaSoft
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PharmaSoft', 40, y, { align: 'center' });
  y += 4;
  
  doc.setFontSize(12);
  doc.text(data.pharmacyInfo.name, 40, y, { align: 'center' });
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (data.pharmacyInfo.adresse) {
    doc.text(data.pharmacyInfo.adresse, 40, y, { align: 'center' });
    y += 4;
  }
  if (data.pharmacyInfo.telephone) {
    doc.text(`Tél: ${data.pharmacyInfo.telephone}`, 40, y, { align: 'center' });
    y += 4;
  }
  y += 3;

  // Séparateur
  doc.line(5, y, 75, y);
  y += 5;

  // Infos transaction
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ticket: ${data.vente.numero_vente}`, 5, y);
  y += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(data.vente.date_vente).toLocaleString('fr-CG')}`, 5, y);
  y += 4;
  
  if (data.agentName) {
    doc.text(`Vendeur: ${data.agentName}`, 5, y);
    y += 4;
  }

  if (data.sessionNumero) {
    doc.text(`Session: ${data.sessionNumero}`, 5, y);
    y += 4;
  }
  y += 2;

  // Lignes de vente
  doc.line(5, y, 75, y);
  y += 4;

  data.lignes.forEach(ligne => {
    // Nom du produit
    const productName = ligne.produit.libelle_produit;
    if (productName.length > 30) {
      doc.text(productName.substring(0, 30), 5, y);
      y += 4;
      doc.text(productName.substring(30, 60), 5, y);
      y += 4;
    } else {
      doc.text(productName, 5, y);
      y += 4;
    }
    
    // Quantité et prix
    const lineText = `${ligne.quantite} x ${ligne.prix_unitaire_ttc.toLocaleString()} = ${ligne.montant_ligne_ttc.toLocaleString()} FCFA`;
    doc.text(lineText, 10, y);
    y += 5;
  });

  // Totaux
  doc.line(5, y, 75, y);
  y += 4;
  
  doc.text(`Sous-total:`, 5, y);
  doc.text(`${data.vente.montant_total_ttc.toLocaleString()} FCFA`, 75, y, { align: 'right' });
  y += 4;

  if (data.vente.remise_globale > 0) {
    doc.text(`Remise:`, 5, y);
    doc.text(`-${data.vente.remise_globale.toLocaleString()} FCFA`, 75, y, { align: 'right' });
    y += 4;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`À PAYER:`, 5, y);
  doc.text(`${data.vente.montant_net.toLocaleString()} FCFA`, 75, y, { align: 'right' });
  y += 8;

  // Code-barres (représentation textuelle)
  doc.line(5, y, 75, y);
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Scanner ce code à la caisse:', 40, y, { align: 'center' });
  y += 5;

  // Simulation visuelle code-barres
  doc.setFontSize(18);
  doc.setFont('courier', 'bold');
  doc.text(generateBarcodeText(data.vente.numero_vente), 40, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.vente.numero_vente, 40, y, { align: 'center' });
  y += 8;

  // Pied de page
  doc.setFontSize(7);
  doc.text('Présentez ce ticket à la caisse pour encaissement', 40, y, { align: 'center' });

  // Sauvegarder
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  return url;
}

/**
 * Imprime un reçu de caisse (après encaissement)
 */
export async function printCashReceipt(data: CashReceiptData): Promise<string> {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 120] // Ticket court pour le reçu
  });

  let y = 10;

  // Bandeau "REÇU DE PAIEMENT"
  doc.setFillColor(100, 200, 100);
  doc.rect(0, 0, 80, 12, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('REÇU DE PAIEMENT', 40, 8, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y = 18;

  // En-tête
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PharmaSoft', 40, y, { align: 'center' });
  y += 4;
  
  doc.setFontSize(11);
  doc.text(data.pharmacyInfo.name, 40, y, { align: 'center' });
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (data.pharmacyInfo.telephone) {
    doc.text(`Tél: ${data.pharmacyInfo.telephone}`, 40, y, { align: 'center' });
    y += 4;
  }
  y += 3;

  // Séparateur
  doc.line(5, y, 75, y);
  y += 5;

  // Infos encaissement
  doc.setFontSize(9);
  doc.text(`Réf. Vente: ${data.vente.numero_vente}`, 5, y);
  y += 4;
  
  doc.text(`Date: ${new Date().toLocaleString('fr-CG')}`, 5, y);
  y += 4;

  if (data.agentName) {
    doc.text(`Caissier: ${data.agentName}`, 5, y);
    y += 4;
  }
  y += 2;

  // Séparateur
  doc.line(5, y, 75, y);
  y += 5;

  // Montants
  doc.setFontSize(10);
  doc.text(`Montant:`, 5, y);
  doc.text(`${data.vente.montant_net.toLocaleString()} FCFA`, 75, y, { align: 'right' });
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text(`Payé:`, 5, y);
  doc.text(`${data.vente.montant_paye.toLocaleString()} FCFA`, 75, y, { align: 'right' });
  y += 5;

  if (data.vente.montant_rendu > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Rendu:`, 5, y);
    doc.text(`${data.vente.montant_rendu.toLocaleString()} FCFA`, 75, y, { align: 'right' });
    y += 5;
  }

  doc.setFont('helvetica', 'normal');
  doc.text(`Mode: ${data.vente.mode_paiement}`, 5, y);
  y += 8;

  // Pied de page
  doc.setFontSize(7);
  doc.text('Merci de votre visite !', 40, y, { align: 'center' });

  // Sauvegarder
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  return url;
}

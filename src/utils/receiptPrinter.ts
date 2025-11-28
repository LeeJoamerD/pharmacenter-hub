/**
 * Générateur de tickets de caisse
 */
import jsPDF from 'jspdf';

interface ReceiptData {
  vente: {
    numero_vente: string;
    date_vente: string;
    montant_total_ttc: number;
    montant_net: number;
    remise_globale: number;
    montant_paye: number;
    montant_rendu: number;
    mode_paiement: string;
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
}

export async function printReceipt(data: ReceiptData): Promise<string> {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200] // Ticket thermique 80mm
  });

  let y = 10;

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
  doc.text(`Facture: ${data.vente.numero_vente}`, 5, y);
  y += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(data.vente.date_vente).toLocaleString('fr-CG')}`, 5, y);
  y += 4;
  
  if (data.agentName) {
    doc.text(`Caissier: ${data.agentName}`, 5, y);
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
      doc.text(productName.substring(30), 5, y);
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

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:`, 5, y);
  doc.text(`${data.vente.montant_net.toLocaleString()} FCFA`, 75, y, { align: 'right' });
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payé:`, 5, y);
  doc.text(`${data.vente.montant_paye.toLocaleString()} FCFA`, 75, y, { align: 'right' });
  y += 4;

  if (data.vente.montant_rendu > 0) {
    doc.text(`Rendu:`, 5, y);
    doc.text(`${data.vente.montant_rendu.toLocaleString()} FCFA`, 75, y, { align: 'right' });
    y += 4;
  }

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

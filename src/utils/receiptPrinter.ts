/**
 * Générateur de tickets de caisse (mode non séparé)
 * Affiche le détail TVA et Centime Additionnel
 */
import jsPDF from 'jspdf';
import { formatCurrencyAmount } from './currencyFormatter';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';
import { PrintOptions, getPaperWidth, getMargins } from './printOptions';

interface ReceiptData {
  vente: {
    numero_vente: string;
    date_vente: string;
    montant_total_ht?: number;
    montant_tva?: number;
    taux_tva?: number;
    montant_centime_additionnel?: number;
    taux_centime_additionnel?: number;
    montant_total_ttc: number;
    montant_net: number;
    remise_globale: number;
    montant_paye: number;
    montant_rendu: number;
    mode_paiement: string;
    // Champs assurance
    taux_couverture_assurance?: number;
    montant_part_assurance?: number;
    montant_part_patient?: number;
    // Ticket modérateur et remise
    taux_ticket_moderateur?: number;
    montant_ticket_moderateur?: number;
    taux_remise_automatique?: number;
    montant_remise_automatique?: number;
  };
  lignes: Array<{
    produit: { libelle_produit: string };
    quantite: number;
    prix_unitaire_ht?: number;
    prix_unitaire_ttc: number;
    montant_ligne_ttc: number;
    taux_tva?: number;
  }>;
  client?: {
    nom: string;
    type: string;
    assureur?: string;
  };
  pharmacyInfo: {
    name: string;
    adresse?: string;
    telephone?: string;
  };
  agentName?: string;
  currencySymbol?: string;
}

export async function printReceipt(data: ReceiptData, options?: PrintOptions): Promise<string> {
  const paperWidth = getPaperWidth(options?.paperSize);
  const margins = getMargins(options?.paperSize);
  const doc = new jsPDF({
    unit: 'mm',
    format: [paperWidth, 220]
  });

  const currency = data.currencySymbol || DEFAULT_SETTINGS.currency.symbol;
  let y = 10;

  // En-tête avec PharmaSoft (conditionné par printLogo)
  if (options?.printLogo !== false) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PharmaSoft', margins.center, y, { align: 'center' });
    y += 4;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pharmacyInfo.name, margins.center, y, { align: 'center' });
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (data.pharmacyInfo.adresse) {
    doc.text(data.pharmacyInfo.adresse, margins.center, y, { align: 'center' });
    y += 4;
  }
  if (data.pharmacyInfo.telephone) {
    doc.text(`Tél: ${data.pharmacyInfo.telephone}`, margins.center, y, { align: 'center' });
    y += 4;
  }
  y += 3;

  // Séparateur
  doc.line(margins.left, y, margins.right, y);
  y += 5;

  // Infos transaction
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Facture: ${data.vente.numero_vente}`, margins.left, y);
  y += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(data.vente.date_vente).toLocaleString('fr-CG')}`, margins.left, y);
  y += 4;
  
  if (data.agentName) {
    doc.text(`Caissier: ${data.agentName}`, margins.left, y);
    y += 4;
  }
  y += 2;

  // Lignes de vente
  doc.line(margins.left, y, margins.right, y);
  y += 4;

  data.lignes.forEach(ligne => {
    const productName = ligne.produit.libelle_produit;
    if (productName.length > 30) {
      doc.text(productName.substring(0, 30), margins.left, y);
      y += 4;
      doc.text(productName.substring(30), margins.left, y);
      y += 4;
    } else {
      doc.text(productName, margins.left, y);
      y += 4;
    }
    
    const lineText = `${ligne.quantite} x ${formatCurrencyAmount(ligne.prix_unitaire_ttc, currency)} = ${formatCurrencyAmount(ligne.montant_ligne_ttc, currency)}`;
    doc.text(lineText, margins.left + 5, y);
    y += 5;
  });

  // Totaux détaillés
  doc.line(margins.left, y, margins.right, y);
  y += 4;
  
  doc.text(`Sous-total HT:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_total_ht || 0, currency), margins.right, y, { align: 'right' });
  y += 4;

  const tauxTva = data.vente.taux_tva || 18;
  doc.text(`TVA (${tauxTva}%):`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_tva || 0, currency), margins.right, y, { align: 'right' });
  y += 4;

  const tauxCentime = data.vente.taux_centime_additionnel || 5;
  const montantCentime = data.vente.montant_centime_additionnel || 0;
  doc.text(`Centime Add. (${tauxCentime}%):`, margins.left, y);
  doc.text(formatCurrencyAmount(montantCentime, currency), margins.right, y, { align: 'right' });
  y += 4;

  doc.text(`Sous-total TTC:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_total_ttc, currency), margins.right, y, { align: 'right' });
  y += 4;

  // Informations client et assurance
  if (data.client) {
    y += 2;
    doc.line(margins.left, y, margins.right, y);
    y += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Client: ${data.client.nom}`, margins.left, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${data.client.type}`, margins.left, y);
    y += 4;
    
    if (data.client.assureur && (data.vente.taux_couverture_assurance ?? 0) > 0) {
      doc.text(`Assureur: ${data.client.assureur} (${data.vente.taux_couverture_assurance}%)`, margins.left, y);
      y += 4;
      
      doc.text(`Couverture Assurance:`, margins.left, y);
      doc.text(`-${formatCurrencyAmount(data.vente.montant_part_assurance || 0, currency)}`, margins.right, y, { align: 'right' });
      y += 4;
      
      doc.text(`Part Client:`, margins.left, y);
      doc.text(formatCurrencyAmount(data.vente.montant_part_patient || data.vente.montant_total_ttc, currency), margins.right, y, { align: 'right' });
      y += 4;
    }
  }

  // Ticket modérateur
  if ((data.vente.montant_ticket_moderateur ?? 0) > 0) {
    doc.text(`Ticket modérateur (${data.vente.taux_ticket_moderateur}%):`, margins.left, y);
    doc.text(`-${formatCurrencyAmount(data.vente.montant_ticket_moderateur || 0, currency)}`, margins.right, y, { align: 'right' });
    y += 4;
  }

  // Remise automatique
  if ((data.vente.montant_remise_automatique ?? 0) > 0) {
    doc.text(`Remise (${data.vente.taux_remise_automatique}%):`, margins.left, y);
    doc.text(`-${formatCurrencyAmount(data.vente.montant_remise_automatique || 0, currency)}`, margins.right, y, { align: 'right' });
    y += 4;
  }

  // Remise legacy
  if (data.vente.remise_globale > 0 && !(data.vente.montant_remise_automatique)) {
    doc.text(`Remise:`, margins.left, y);
    doc.text(`-${formatCurrencyAmount(data.vente.remise_globale, currency)}`, margins.right, y, { align: 'right' });
    y += 4;
  }

  // Total à payer
  doc.line(margins.left, y, margins.right, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`NET A PAYER:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_net, currency), margins.right, y, { align: 'right' });
  y += 6;

  // Paiement
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payé:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_paye, currency), margins.right, y, { align: 'right' });
  y += 4;

  if (data.vente.montant_rendu > 0) {
    doc.text(`Rendu:`, margins.left, y);
    doc.text(formatCurrencyAmount(data.vente.montant_rendu, currency), margins.right, y, { align: 'right' });
    y += 4;
  }

  doc.text(`Mode: ${data.vente.mode_paiement}`, margins.left, y);
  y += 8;

  // Pied de page
  doc.setFontSize(7);
  const footerText = options?.receiptFooter || 'Merci de votre visite !';
  doc.text(footerText, margins.center, y, { align: 'center' });

  // Sauvegarder
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  return url;
}

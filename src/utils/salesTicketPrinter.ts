/**
 * Générateur de tickets de vente (mode séparé - sans encaissement)
 * Inclut un code-barres pour faciliter l'encaissement ultérieur
 * Affiche le détail TVA et Centime Additionnel
 * Format compact pour économiser le papier
 */
import jsPDF from 'jspdf';
// @ts-ignore - bwip-js types
import bwipjs from 'bwip-js';
import { formatCurrencyAmount } from './currencyFormatter';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';
import { PrintOptions, getPaperWidth, getMargins } from './printOptions';

interface SalesTicketData {
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
    taux_couverture_assurance?: number;
    montant_part_assurance?: number;
    montant_part_patient?: number;
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
    numero_lot?: string;
    date_peremption?: string;
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
  sessionNumero?: string;
  currencySymbol?: string;
}

interface CashReceiptData {
  vente: {
    numero_vente: string;
    date_vente: string;
    montant_total_ht?: number;
    montant_tva?: number;
    taux_tva?: number;
    montant_centime_additionnel?: number;
    taux_centime_additionnel?: number;
    montant_total_ttc?: number;
    montant_net: number;
    montant_paye: number;
    montant_rendu: number;
    mode_paiement: string;
    taux_couverture_assurance?: number;
    montant_part_assurance?: number;
    montant_part_patient?: number;
    remise_globale?: number;
  };
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

/**
 * Génère un code-barres Code 128 en base64
 */
async function generateBarcodeBase64(text: string): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    await bwipjs.toCanvas(canvas, {
      bcid: 'code128',
      text: text,
      scale: 3,
      height: 10,
      includetext: false,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erreur génération code-barres:', error);
    return '';
  }
}

/**
 * Imprime un ticket de vente (sans encaissement) - Format compact
 */
export async function printSalesTicket(data: SalesTicketData, options?: PrintOptions): Promise<string> {
  const paperWidth = getPaperWidth(options?.paperSize);
  const margins = getMargins(options?.paperSize);
  const doc = new jsPDF({
    unit: 'mm',
    format: [paperWidth, 300]
  });

  const currency = data.currencySymbol || DEFAULT_SETTINGS.currency.symbol;
  let y = 5;

  // Bandeau "À ENCAISSER" compact
  doc.setFillColor(255, 200, 0);
  doc.rect(0, 0, paperWidth, 9, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('À ENCAISSER', margins.center, 6, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y = 12;

  // En-tête avec PharmaSoft (conditionné par printLogo)
  if (options?.printLogo !== false) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PharmaSoft', margins.center, y, { align: 'center' });
    y += 3;
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pharmacyInfo.name, margins.center, y, { align: 'center' });
  y += 4;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  if (data.pharmacyInfo.adresse) {
    doc.text(data.pharmacyInfo.adresse, margins.center, y, { align: 'center' });
    y += 3;
  }
  if (data.pharmacyInfo.telephone) {
    doc.text(`Tél: ${data.pharmacyInfo.telephone}`, margins.center, y, { align: 'center' });
    y += 3;
  }

  // Séparateur
  doc.line(margins.left, y, margins.right, y);
  y += 3;

  // Infos transaction
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ticket: ${data.vente.numero_vente}`, margins.left, y);
  y += 3;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(data.vente.date_vente).toLocaleString('fr-CG')}`, margins.left, y);
  y += 3;
  
  if (data.agentName) {
    doc.text(`Vendeur: ${data.agentName}`, margins.left, y);
    y += 3;
  }

  if (data.sessionNumero) {
    doc.text(`Session: ${data.sessionNumero}`, margins.left, y);
    y += 3;
  }

  // Lignes de vente
  doc.line(margins.left, y, margins.right, y);
  y += 3;

  doc.setFontSize(7);
  data.lignes.forEach(ligne => {
    const productName = ligne.produit.libelle_produit;
    const qtyTotal = `${ligne.quantite}x${formatCurrencyAmount(ligne.prix_unitaire_ttc, currency)}=${formatCurrencyAmount(ligne.montant_ligne_ttc, currency)}`;
    const truncName = productName.length > 22 ? productName.substring(0, 22) + '..' : productName;
    doc.text(truncName, margins.left, y);
    doc.text(qtyTotal, margins.right, y, { align: 'right' });
    y += 3;
    
    // Numéro de lot et date de péremption (traçabilité)
    if (ligne.numero_lot) {
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      const lotText = ligne.date_peremption 
        ? `Lot: ${ligne.numero_lot} - Exp: ${new Date(ligne.date_peremption).toLocaleDateString('fr-CG')}`
        : `Lot: ${ligne.numero_lot}`;
      doc.text(lotText, margins.left + 2, y);
      y += 3;
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
    }
  });

  // Totaux détaillés
  doc.line(margins.left, y, margins.right, y);
  y += 3;
  
  doc.text(`S/Total HT:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_total_ht || 0, currency), margins.right, y, { align: 'right' });
  y += 3;

  const tauxTva = data.vente.taux_tva || 18;
  doc.text(`TVA (${tauxTva}%):`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_tva || 0, currency), margins.right, y, { align: 'right' });
  y += 3;

  const tauxCentime = data.vente.taux_centime_additionnel || 5;
  const montantCentime = data.vente.montant_centime_additionnel || 0;
  doc.text(`Cent.Add. (${tauxCentime}%):`, margins.left, y);
  doc.text(formatCurrencyAmount(montantCentime, currency), margins.right, y, { align: 'right' });
  y += 3;

  doc.text(`S/Total TTC:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_total_ttc, currency), margins.right, y, { align: 'right' });
  y += 3;

  // Informations client et assurance
  if (data.client) {
    doc.line(margins.left, y, margins.right, y);
    y += 3;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Client: ${data.client.nom}`, margins.left, y);
    y += 3;
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${data.client.type}`, margins.left, y);
    y += 3;
    
    if (data.client.assureur && (data.vente.taux_couverture_assurance ?? 0) > 0) {
      doc.text(`Assureur: ${data.client.assureur} (${data.vente.taux_couverture_assurance}%)`, margins.left, y);
      y += 3;
      doc.text(`Couv. Assurance:`, margins.left, y);
      doc.text(`-${formatCurrencyAmount(data.vente.montant_part_assurance || 0, currency)}`, margins.right, y, { align: 'right' });
      y += 3;
      doc.text(`Part Client:`, margins.left, y);
      doc.text(formatCurrencyAmount(data.vente.montant_part_patient || data.vente.montant_total_ttc, currency), margins.right, y, { align: 'right' });
      y += 3;
    }
  }

  // Ticket modérateur
  if ((data.vente.montant_ticket_moderateur ?? 0) > 0) {
    doc.text(`Ticket mod. (${data.vente.taux_ticket_moderateur}%):`, margins.left, y);
    doc.text(`-${formatCurrencyAmount(data.vente.montant_ticket_moderateur || 0, currency)}`, margins.right, y, { align: 'right' });
    y += 3;
  }

  // Remise automatique
  if ((data.vente.montant_remise_automatique ?? 0) > 0) {
    doc.text(`Remise (${data.vente.taux_remise_automatique}%):`, margins.left, y);
    doc.text(`-${formatCurrencyAmount(data.vente.montant_remise_automatique || 0, currency)}`, margins.right, y, { align: 'right' });
    y += 3;
  }

  // Remise legacy
  if (data.vente.remise_globale > 0 && !(data.vente.montant_remise_automatique)) {
    doc.text(`Remise:`, margins.left, y);
    doc.text(`-${formatCurrencyAmount(data.vente.remise_globale, currency)}`, margins.right, y, { align: 'right' });
    y += 3;
  }

  // Total à payer
  doc.line(margins.left, y, margins.right, y);
  y += 3;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`À PAYER:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_net, currency), margins.right, y, { align: 'right' });
  y += 4;

  // Code-barres (conditionné par includeBarcode)
  if (options?.includeBarcode !== false) {
    doc.line(margins.left, y, margins.right, y);
    y += 3;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Scanner ce code à la caisse:', margins.center, y, { align: 'center' });
    y += 3;

    try {
      const barcodeBase64 = await generateBarcodeBase64(data.vente.numero_vente);
      if (barcodeBase64) {
        doc.addImage(barcodeBase64, 'PNG', margins.left + 5, y, margins.right - margins.left - 10, 12);
        y += 14;
      }
    } catch (error) {
      console.error('Erreur ajout code-barres:', error);
      y += 3;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(data.vente.numero_vente, margins.center, y, { align: 'center' });
    y += 4;
  }

  // Pied de page
  doc.setFontSize(6);
  const footerText = options?.receiptFooter || 'Présentez ce ticket à la caisse pour encaissement';
  doc.text(footerText, margins.center, y, { align: 'center' });

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  return url;
}

/**
 * Imprime un reçu de caisse (après encaissement) - Format compact
 */
export async function printCashReceipt(data: CashReceiptData, options?: PrintOptions): Promise<string> {
  const paperWidth = getPaperWidth(options?.paperSize);
  const margins = getMargins(options?.paperSize);
  const doc = new jsPDF({
    unit: 'mm',
    format: [paperWidth, 300]
  });

  const currency = data.currencySymbol || DEFAULT_SETTINGS.currency.symbol;
  let y = 5;

  // Bandeau "REÇU DE PAIEMENT" compact
  doc.setFillColor(100, 200, 100);
  doc.rect(0, 0, paperWidth, 9, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('REÇU DE PAIEMENT', margins.center, 6, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y = 12;

  // En-tête (conditionné par printLogo)
  if (options?.printLogo !== false) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PharmaSoft', margins.center, y, { align: 'center' });
    y += 3;
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pharmacyInfo.name, margins.center, y, { align: 'center' });
  y += 4;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  if (data.pharmacyInfo.telephone) {
    doc.text(`Tél: ${data.pharmacyInfo.telephone}`, margins.center, y, { align: 'center' });
    y += 3;
  }

  // Séparateur
  doc.line(margins.left, y, margins.right, y);
  y += 3;

  // Infos encaissement
  doc.setFontSize(7);
  doc.text(`Réf: ${data.vente.numero_vente}`, margins.left, y);
  y += 3;
  doc.text(`Date: ${new Date().toLocaleString('fr-CG')}`, margins.left, y);
  y += 3;

  if (data.agentName) {
    doc.text(`Caissier: ${data.agentName}`, margins.left, y);
    y += 3;
  }

  // Séparateur
  doc.line(margins.left, y, margins.right, y);
  y += 3;

  // Détails TVA
  doc.text(`Montant HT:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_total_ht || 0, currency), margins.right, y, { align: 'right' });
  y += 3;

  const tauxTva = data.vente.taux_tva || 18;
  doc.text(`TVA (${tauxTva}%):`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_tva || 0, currency), margins.right, y, { align: 'right' });
  y += 3;

  const tauxCentime = data.vente.taux_centime_additionnel || 5;
  const montantCentime = data.vente.montant_centime_additionnel || 0;
  doc.text(`Cent.Add. (${tauxCentime}%):`, margins.left, y);
  doc.text(formatCurrencyAmount(montantCentime, currency), margins.right, y, { align: 'right' });
  y += 3;

  doc.text(`S/Total TTC:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_total_ttc || data.vente.montant_net, currency), margins.right, y, { align: 'right' });
  y += 3;

  // Informations client et assurance
  if (data.client) {
    doc.line(margins.left, y, margins.right, y);
    y += 3;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Client: ${data.client.nom}`, margins.left, y);
    y += 3;
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${data.client.type}`, margins.left, y);
    y += 3;
    
    if (data.client.assureur && (data.vente.taux_couverture_assurance ?? 0) > 0) {
      doc.text(`Assureur: ${data.client.assureur} (${data.vente.taux_couverture_assurance}%)`, margins.left, y);
      y += 3;
      doc.text(`Couv. Assurance:`, margins.left, y);
      doc.text(`-${formatCurrencyAmount(data.vente.montant_part_assurance || 0, currency)}`, margins.right, y, { align: 'right' });
      y += 3;
      doc.text(`Part Client:`, margins.left, y);
      doc.text(formatCurrencyAmount(data.vente.montant_part_patient || data.vente.montant_net, currency), margins.right, y, { align: 'right' });
      y += 3;
    }
  }

  // Remise
  if ((data.vente.remise_globale ?? 0) > 0) {
    doc.text(`Remise:`, margins.left, y);
    doc.text(`-${formatCurrencyAmount(data.vente.remise_globale || 0, currency)}`, margins.right, y, { align: 'right' });
    y += 3;
  }

  doc.line(margins.left, y, margins.right, y);
  y += 3;

  // Montant à payer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Net à payer:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_net, currency), margins.right, y, { align: 'right' });
  y += 3;

  doc.text(`Payé:`, margins.left, y);
  doc.text(formatCurrencyAmount(data.vente.montant_paye, currency), margins.right, y, { align: 'right' });
  y += 3;

  if (data.vente.montant_rendu > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Rendu:`, margins.left, y);
    doc.text(formatCurrencyAmount(data.vente.montant_rendu, currency), margins.right, y, { align: 'right' });
    y += 3;
  }

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mode: ${data.vente.mode_paiement}`, margins.left, y);
  y += 4;

  // Pied de page
  doc.setFontSize(6);
  const footerText = options?.receiptFooter || 'Merci de votre visite !';
  doc.text(footerText, margins.center, y, { align: 'center' });

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  return url;
}

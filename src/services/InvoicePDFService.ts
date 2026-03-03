import { Invoice, InvoiceLine } from '@/hooks/useInvoiceManager';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';
import { formatCurrencyAmount } from '@/utils/currencyFormatter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportResult {
  url: string;
  filename: string;
}

interface RegionalInvoiceParams {
  symbole_devise?: string;
  libelle_tva?: string;
  libelle_centime_additionnel?: string;
  taux_centime_additionnel?: number;
  separateur_milliers?: string;
  separateur_decimal?: string;
  position_symbole_devise?: string;
  mentions_legales_facture?: string;
  conditions_paiement_defaut?: string;
  nom_societe?: string;
  adresse_societe?: string;
  registre_commerce?: string;
  numero_tva?: string;
  telephone_societe?: string;
  email_societe?: string;
}

interface BeneficiaireDetails {
  nom_beneficiaire?: string;
  matricule_beneficiaire?: string;
  numero_bon?: string;
  taux_couverture?: number;
}

// Extended Invoice interface for PDF generation
interface InvoiceWithCentime extends Invoice {
  montant_centime_additionnel?: number;
  taux_centime_additionnel?: number;
}

/**
 * Normalise les espaces insécables pour jsPDF
 */
const normalizePdfSpaces = (str: string): string => {
  return str.replace(/[\u202F\u00A0]/g, ' ');
};

export class InvoicePDFService {
  /**
   * Génère un vrai fichier PDF avec jsPDF + jspdf-autotable
   */
  static generateRealPDF(
    invoice: Invoice,
    lines: InvoiceLine[] = [],
    regionalParams?: RegionalInvoiceParams | null,
    beneficiaire?: BeneficiaireDetails | null
  ): ExportResult {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const isClient = invoice.type === 'client';
    const isAssureur = !!invoice.assureur_id;
    const devise = regionalParams?.symbole_devise || DEFAULT_SETTINGS.currency.symbol;
    const tvaLabel = regionalParams?.libelle_tva || 'TVA';

    const fmt = (amount: number): string => normalizePdfSpaces(formatCurrencyAmount(amount, devise));
    const fmtNum = (n: number): string => normalizePdfSpaces(n.toLocaleString('fr-FR'));

    const companyInfo = {
      nom: regionalParams?.nom_societe || 'PharmaSoft',
      adresse: regionalParams?.adresse_societe || '',
      rc: regionalParams?.registre_commerce || '',
      tva: regionalParams?.numero_tva || '',
      tel: regionalParams?.telephone_societe || '',
      email: regionalParams?.email_societe || '',
    };

    const clientName = isAssureur ? invoice.assureur_nom : (isClient ? invoice.client_nom : invoice.fournisseur_nom);
    const clientPhone = isAssureur ? invoice.assureur_telephone : (isClient ? invoice.client_telephone : invoice.fournisseur_telephone);
    const clientEmail = isAssureur ? invoice.assureur_email : (isClient ? invoice.client_email : invoice.fournisseur_email);
    const clientAddress = isAssureur ? invoice.assureur_adresse : (isClient ? invoice.client_adresse : invoice.fournisseur_adresse);
    const badgeLabel = isAssureur ? 'Assureur' : (isClient ? 'Client' : 'Fournisseur');
    const contactTitle = isAssureur ? 'Facture a (Assureur)' : (isClient ? 'Facture a' : 'De');

    // ── Header: Company info (left) + FACTURE (right) ──
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // blue
    doc.text(companyInfo.nom, margin, y + 7);
    
    doc.setFontSize(22);
    doc.setTextColor(51, 51, 51);
    doc.text('FACTURE', pageWidth - margin, y + 7, { align: 'right' });
    y += 12;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const companyLines: string[] = [];
    if (companyInfo.adresse) companyLines.push(companyInfo.adresse);
    if (companyInfo.rc) companyLines.push(`RC: ${companyInfo.rc}`);
    if (companyInfo.tva) companyLines.push(`${tvaLabel}: ${companyInfo.tva}`);
    if (companyInfo.tel) companyLines.push(`Tel: ${companyInfo.tel}`);
    if (companyInfo.email) companyLines.push(`Email: ${companyInfo.email}`);
    companyLines.forEach(line => {
      doc.text(line, margin, y);
      y += 4;
    });

    // Invoice number + badge on right side
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const numY = margin + 14;
    doc.text(`N° ${invoice.numero}`, pageWidth - margin, numY, { align: 'right' });
    
    // Badge
    const badgeY = numY + 5;
    const badgeW = doc.getTextWidth(badgeLabel) + 8;
    const badgeX = pageWidth - margin - badgeW;
    const badgeColors: Record<string, [number, number, number]> = {
      'Client': [219, 234, 254],
      'Assureur': [224, 231, 255],
      'Fournisseur': [252, 231, 243],
    };
    const badgeTextColors: Record<string, [number, number, number]> = {
      'Client': [30, 64, 175],
      'Assureur': [55, 48, 163],
      'Fournisseur': [159, 18, 57],
    };
    doc.setFillColor(...(badgeColors[badgeLabel] || [219, 234, 254]));
    doc.roundedRect(badgeX, badgeY - 3, badgeW, 6, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(badgeTextColors[badgeLabel] || [30, 64, 175]));
    doc.text(badgeLabel.toUpperCase(), badgeX + 4, badgeY + 1);

    // Blue line separator
    y = Math.max(y, badgeY + 8);
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── Parties: Contact + Infos ──
    const boxW = (contentWidth - 8) / 2;
    const boxH = 32;

    // Left box - Contact
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, boxW, boxH, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(contactTitle.toUpperCase(), margin + 4, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    doc.text(clientName || 'N/A', margin + 4, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    let contactY = y + 17;
    if (clientAddress) { doc.text(clientAddress, margin + 4, contactY); contactY += 4; }
    if (clientPhone) { doc.text(`Tel: ${clientPhone}`, margin + 4, contactY); contactY += 4; }
    if (clientEmail) { doc.text(`Email: ${clientEmail}`, margin + 4, contactY); }

    // Right box - Infos
    const rightX = margin + boxW + 8;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(rightX, y, boxW, boxH, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('INFORMATIONS', rightX + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    let infoY = y + 12;
    doc.text(`Date d'emission: ${new Date(invoice.date_emission).toLocaleDateString('fr-FR')}`, rightX + 4, infoY); infoY += 5;
    doc.text(`Date d'echeance: ${new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}`, rightX + 4, infoY); infoY += 5;
    doc.text(`Libelle: ${invoice.libelle || ''}`, rightX + 4, infoY); infoY += 5;
    if (invoice.reference_externe) {
      doc.text(`Reference: ${invoice.reference_externe}`, rightX + 4, infoY);
    }

    y += boxH + 6;

    // ── Beneficiaire section (assureur only) ──
    if (beneficiaire) {
      doc.setFillColor(239, 246, 255);
      const benH = 22;
      doc.roundedRect(margin, y, contentWidth, benH, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('DETAILS DU BENEFICIAIRE', margin + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 58, 95);
      let benY = y + 11;
      if (beneficiaire.nom_beneficiaire) { doc.text(`Nom: ${beneficiaire.nom_beneficiaire}`, margin + 4, benY); benY += 4; }
      if (beneficiaire.matricule_beneficiaire) { doc.text(`Matricule: ${beneficiaire.matricule_beneficiaire}`, margin + 60, y + 11); }
      if (beneficiaire.numero_bon) { doc.text(`N° Bon/Police: ${beneficiaire.numero_bon}`, margin + 4, benY); }
      if (beneficiaire.taux_couverture != null) { doc.text(`Taux de couverture: ${beneficiaire.taux_couverture}%`, margin + 100, y + 11); }
      y += benH + 4;
    }

    // ── Table des lignes ──
    if (lines.length > 0) {
      const tableHead = [['Designation', 'Qte', 'Prix unitaire', 'Remise', `${tvaLabel} (%)`, 'Montant TTC']];
      const tableBody = lines.map(line => [
        line.designation || '',
        fmtNum(line.quantite),
        fmt(line.prix_unitaire),
        (line as any).remise ? `${(line as any).remise}%` : '-',
        `${line.taux_tva}%`,
        fmt(line.montant_ttc),
      ]);

      autoTable(doc, {
        startY: y,
        head: tableHead,
        body: tableBody,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [51, 51, 51],
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'right', cellWidth: 18 },
          2: { halign: 'right', cellWidth: 30 },
          3: { halign: 'right', cellWidth: 20 },
          4: { halign: 'right', cellWidth: 22 },
          5: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [248, 249, 250] },
      });

      y = (doc as any).lastAutoTable.finalY + 6;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Aucune ligne de detail', pageWidth / 2, y + 10, { align: 'center' });
      y += 20;
    }

    // ── Totaux (right-aligned block) ──
    const totalsX = pageWidth - margin - 80;
    const totalsW = 80;

    const drawTotalRow = (label: string, value: string, bold = false, color?: [number, number, number]) => {
      doc.setFontSize(bold ? 10 : 9);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...(color || [51, 51, 51]));
      doc.text(label, totalsX, y);
      doc.text(value, totalsX + totalsW, y, { align: 'right' });
      y += bold ? 7 : 5;
    };

    drawTotalRow('Sous-total HT:', fmt(invoice.montant_ht));
    drawTotalRow(`${tvaLabel}:`, fmt(invoice.montant_tva), false, [100, 100, 100]);

    // Centime additionnel
    const invWithCentime = invoice as InvoiceWithCentime;
    if (invWithCentime.montant_centime_additionnel && invWithCentime.montant_centime_additionnel > 0) {
      const centimeLabel = `${regionalParams?.libelle_centime_additionnel || 'Centime Add.'} (${invWithCentime.taux_centime_additionnel || regionalParams?.taux_centime_additionnel || 5}%):`;
      drawTotalRow(centimeLabel, fmt(invWithCentime.montant_centime_additionnel), false, [217, 119, 6]);
    }

    // Grand total with blue line
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(totalsX, y, totalsX + totalsW, y);
    y += 4;
    drawTotalRow('TOTAL TTC:', fmt(invoice.montant_ttc), true, [37, 99, 235]);

    y += 4;

    // ── Payment info ──
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 2, y);
    doc.line(margin, y, margin, y + 18);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('INFORMATIONS DE PAIEMENT', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Montant paye: ${fmt(invoice.montant_paye)}`, margin + 4, y + 10);
    doc.text(`Montant restant: ${fmt(invoice.montant_restant)}`, margin + 4, y + 15);

    // Status badge
    const statusMap: Record<string, { label: string; color: [number, number, number] }> = {
      'payee': { label: 'PAYEE', color: [6, 95, 70] },
      'partielle': { label: 'PARTIELLEMENT PAYEE', color: [146, 64, 14] },
      'impayee': { label: 'IMPAYEE', color: [153, 27, 27] },
    };
    const status = statusMap[invoice.statut_paiement] || statusMap['impayee'];
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...status.color);
    doc.text(status.label, pageWidth - margin - 4, y + 10, { align: 'right' });

    y += 24;

    // ── Conditions de paiement ──
    if (regionalParams?.conditions_paiement_defaut) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('CONDITIONS DE PAIEMENT', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(regionalParams.conditions_paiement_defaut, margin, y);
      y += 8;
    }

    // ── Notes ──
    if (invoice.notes) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text('NOTES', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 53, 15);
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4 + 4;
    }

    // ── Mentions légales ──
    if (regionalParams?.mentions_legales_facture) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text('MENTIONS LEGALES', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 53, 15);
      const mentionLines = doc.splitTextToSize(regionalParams.mentions_legales_facture, contentWidth);
      doc.text(mentionLines, margin, y);
      y += mentionLines.length * 3.5 + 6;
    }

    // ── Footer ──
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Document genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')} - ${companyInfo.nom}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    // Generate blob
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const filename = `facture-${invoice.numero}-${new Date().toISOString().split('T')[0]}.pdf`;

    return { url, filename };
  }

  /**
   * @deprecated Utiliser generateRealPDF à la place
   */
  static async generateInvoicePDF(
    invoice: Invoice,
    lines: InvoiceLine[] = [],
    regionalParams?: RegionalInvoiceParams | null,
    beneficiaire?: BeneficiaireDetails | null
  ): Promise<ExportResult> {
    return InvoicePDFService.generateRealPDF(invoice, lines, regionalParams, beneficiaire);
  }
}

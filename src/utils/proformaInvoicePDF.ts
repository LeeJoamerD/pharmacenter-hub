/**
 * Générateur PDF A4 pour les factures proforma
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ProformaPDFData {
  numero_proforma: string;
  date_proforma: string;
  date_expiration: string | null;
  validite_jours: number;
  client_nom: string | null;
  montant_total_ht: number;
  montant_tva: number;
  montant_total_ttc: number;
  remise_globale: number;
  montant_net: number;
  notes: string | null;
  lignes: {
    libelle_produit: string;
    code_cip: string | null;
    quantite: number;
    prix_unitaire_ttc: number;
    remise_ligne: number;
    montant_ligne_ttc: number;
  }[];
  pharmacyInfo: {
    name: string;
    address?: string;
    telephone?: string;
  };
  agentName?: string;
}

export function generateProformaPDF(data: ProformaPDFData): string {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // === EN-TÊTE ===
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.pharmacyInfo.name || 'Pharmacie', margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (data.pharmacyInfo.address) {
    doc.text(data.pharmacyInfo.address, margin, y);
    y += 5;
  }
  if (data.pharmacyInfo.telephone) {
    doc.text(`Tél: ${data.pharmacyInfo.telephone}`, margin, y);
    y += 5;
  }

  // === TITRE PROFORMA ===
  y += 5;
  doc.setFillColor(37, 99, 235); // Blue
  doc.rect(margin, y, pageWidth - margin * 2, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE PROFORMA', pageWidth / 2, y + 8, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 18;

  // === INFORMATIONS ===
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`N° : ${data.numero_proforma}`, margin, y);
  doc.text(`Date : ${new Date(data.date_proforma).toLocaleDateString('fr-FR')}`, pageWidth - margin - 60, y);
  y += 6;

  if (data.date_expiration) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Validité : ${data.validite_jours} jours (jusqu'au ${new Date(data.date_expiration).toLocaleDateString('fr-FR')})`, margin, y);
    y += 6;
  }

  if (data.client_nom) {
    doc.setFont('helvetica', 'bold');
    doc.text('Client :', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.client_nom, margin + 20, y);
    y += 6;
  }

  if (data.agentName) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Agent : ${data.agentName}`, margin, y);
    y += 6;
  }

  y += 4;

  // === TABLEAU PRODUITS ===
  const tableData = data.lignes.map((l, i) => [
    (i + 1).toString(),
    l.libelle_produit + (l.code_cip ? `\n(${l.code_cip})` : ''),
    l.quantite.toString(),
    formatCurrency(l.prix_unitaire_ttc),
    l.remise_ligne > 0 ? formatCurrency(l.remise_ligne) : '-',
    formatCurrency(l.montant_ligne_ttc),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Désignation', 'Qté', 'P.U. TTC', 'Remise', 'Montant TTC']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // === TOTAUX ===
  const totalsX = pageWidth - margin - 70;
  const valuesX = pageWidth - margin;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text('Total HT :', totalsX, y);
  doc.text(formatCurrency(data.montant_total_ht), valuesX, y, { align: 'right' });
  y += 5;

  doc.text('TVA :', totalsX, y);
  doc.text(formatCurrency(data.montant_tva), valuesX, y, { align: 'right' });
  y += 5;

  doc.text('Total TTC :', totalsX, y);
  doc.text(formatCurrency(data.montant_total_ttc), valuesX, y, { align: 'right' });
  y += 5;

  if (data.remise_globale > 0) {
    doc.text('Remise :', totalsX, y);
    doc.text(`-${formatCurrency(data.remise_globale)}`, valuesX, y, { align: 'right' });
    y += 5;
  }

  // Net à payer en gras
  doc.setDrawColor(37, 99, 235);
  doc.line(totalsX, y, valuesX, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Net à payer :', totalsX, y);
  doc.text(formatCurrency(data.montant_net), valuesX, y, { align: 'right' });
  y += 10;

  // === NOTES ===
  if (data.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Notes : ${data.notes}`, margin, y);
    y += 8;
  }

  // === PIED DE PAGE ===
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Ce document est une facture proforma et ne constitue pas une facture définitive.`,
    pageWidth / 2, y, { align: 'center' }
  );
  y += 4;
  doc.text(
    `Validité : ${data.validite_jours} jours à compter de la date d'émission.`,
    pageWidth / 2, y, { align: 'center' }
  );

  // Retourner le blob URL
  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/[\u202F\u00A0]/g, ' ');
}

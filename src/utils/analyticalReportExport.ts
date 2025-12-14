import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CostCenter, Budget, ChargeAllocation, ProfitabilityData } from '@/hooks/useAnalyticalAccounting';

interface ExportData {
  costCenters: CostCenter[];
  budgets: Budget[];
  chargeAllocations: ChargeAllocation[];
  profitabilityData: ProfitabilityData[];
  kpis: {
    nombreCentresActifs: number;
    budgetTotal: number;
    realiseTotal: number;
    ecartMoyen: number;
    margeGlobale: number;
  };
  formatAmount: (amount: number) => string;
}

export const exportAnalyticalReportPDF = async (data: ExportData): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // En-tête
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport de Comptabilité Analytique', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // KPIs
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicateurs Clés', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Centres Actifs', data.kpis.nombreCentresActifs.toString()],
      ['Budget Total', data.formatAmount(data.kpis.budgetTotal)],
      ['Réalisé Total', data.formatAmount(data.kpis.realiseTotal)],
      ['Écart Moyen', `${data.kpis.ecartMoyen.toFixed(1)}%`],
      ['Marge Globale', `${data.kpis.margeGlobale.toFixed(1)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Centres de Coûts
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Centres de Coûts', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Code', 'Nom', 'Type', 'Responsable', 'Actif']],
    body: data.costCenters.slice(0, 20).map(c => [
      c.code,
      c.nom,
      c.type_centre,
      c.responsable ? `${c.responsable.prenoms} ${c.responsable.noms}` : '-',
      c.est_actif ? 'Oui' : 'Non',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Nouvelle page si nécessaire
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Rentabilité
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 10 Rentabilité Produits', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Produit', "Chiffre d'Affaires", 'Coût', 'Marge', 'Taux']],
    body: data.profitabilityData.slice(0, 10).map(p => [
      p.produit_nom.substring(0, 30),
      data.formatAmount(p.chiffre_affaires),
      data.formatAmount(p.cout_achat),
      data.formatAmount(p.marge_brute),
      `${p.taux_marge.toFixed(1)}%`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  // Télécharger
  doc.save(`rapport-analytique-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportAnalyticalReportExcel = async (data: ExportData): Promise<void> => {
  const workbook = XLSX.utils.book_new();

  // Feuille KPIs
  const kpisData = [
    ['Indicateur', 'Valeur'],
    ['Centres Actifs', data.kpis.nombreCentresActifs],
    ['Budget Total', data.kpis.budgetTotal],
    ['Réalisé Total', data.kpis.realiseTotal],
    ['Écart Moyen (%)', data.kpis.ecartMoyen],
    ['Marge Globale (%)', data.kpis.margeGlobale],
  ];
  const kpisSheet = XLSX.utils.aoa_to_sheet(kpisData);
  XLSX.utils.book_append_sheet(workbook, kpisSheet, 'Indicateurs');

  // Feuille Centres de Coûts
  const centersData = [
    ['Code', 'Nom', 'Type', 'Responsable', 'Actif', 'Obj. Marge Min', 'Obj. Rotation'],
    ...data.costCenters.map(c => [
      c.code,
      c.nom,
      c.type_centre,
      c.responsable ? `${c.responsable.prenoms} ${c.responsable.noms}` : '',
      c.est_actif ? 'Oui' : 'Non',
      c.objectif_marge_min || '',
      c.objectif_rotation_stock || '',
    ]),
  ];
  const centersSheet = XLSX.utils.aoa_to_sheet(centersData);
  XLSX.utils.book_append_sheet(workbook, centersSheet, 'Centres de Coûts');

  // Feuille Budgets
  const budgetsData = [
    ['Libellé', 'Centre', 'Période', 'Année', 'Prévu', 'Réalisé', 'Écart %', 'Statut'],
    ...data.budgets.map(b => [
      b.libelle,
      b.centre?.nom || '',
      b.type_periode,
      b.annee,
      b.montant_prevu,
      b.montant_realise,
      b.ecart_pourcentage,
      b.statut,
    ]),
  ];
  const budgetsSheet = XLSX.utils.aoa_to_sheet(budgetsData);
  XLSX.utils.book_append_sheet(workbook, budgetsSheet, 'Budgets');

  // Feuille Rentabilité
  const profitData = [
    ['Produit', 'Famille', "CA", 'Quantité', 'Coût', 'Marge', 'Taux Marge %'],
    ...data.profitabilityData.map(p => [
      p.produit_nom,
      p.famille,
      p.chiffre_affaires,
      p.quantite_vendue,
      p.cout_achat,
      p.marge_brute,
      p.taux_marge,
    ]),
  ];
  const profitSheet = XLSX.utils.aoa_to_sheet(profitData);
  XLSX.utils.book_append_sheet(workbook, profitSheet, 'Rentabilité');

  // Feuille Répartitions
  const allocationsData = [
    ['Numéro', 'Date', 'Libellé', 'Type', 'Montant', 'Clé', 'Statut'],
    ...data.chargeAllocations.map(a => [
      a.numero_repartition,
      format(new Date(a.date_repartition), 'dd/MM/yyyy'),
      a.libelle,
      a.type_charge,
      a.montant_total,
      a.cle?.libelle || '',
      a.statut,
    ]),
  ];
  const allocationsSheet = XLSX.utils.aoa_to_sheet(allocationsData);
  XLSX.utils.book_append_sheet(workbook, allocationsSheet, 'Répartitions');

  // Télécharger
  XLSX.writeFile(workbook, `rapport-analytique-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

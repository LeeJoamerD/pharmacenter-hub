import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SalesReportsData } from '@/types/salesReports';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface TenantInfo {
  nom_entreprise: string;
  logo_url?: string;
}

/**
 * Exporte les données des rapports de ventes en PDF
 */
export async function exportSalesReportToPDF(
  reportData: SalesReportsData,
  period: string,
  category: string,
  tenantInfo: TenantInfo
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // === EN-TÊTE ===
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(tenantInfo.nom_entreprise, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const periodLabel = getPeriodLabel(period);
  doc.text(`Rapport de Ventes - ${periodLabel}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(100);
  const categoryLabel = getCategoryLabel(category);
  doc.text(`Catégorie: ${categoryLabel}`, pageWidth / 2, yPos, { align: 'center' });
  
  doc.setTextColor(0);
  yPos += 10;

  // === SECTION KPIs ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicateurs Clés de Performance', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur', 'Variation']],
    body: [
      [
        'CA Total',
        `${reportData.kpis.caAujourdhui.toLocaleString('fr-FR')} FCFA`,
        `${reportData.kpis.caVariation > 0 ? '+' : ''}${reportData.kpis.caVariation.toFixed(1)}%`
      ],
      [
        'Transactions',
        reportData.kpis.transactions.toString(),
        `${reportData.kpis.transactionsVariation > 0 ? '+' : ''}${reportData.kpis.transactionsVariation.toFixed(1)}%`
      ],
      [
        'Panier Moyen',
        `${reportData.kpis.panierMoyen.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`,
        `${reportData.kpis.panierMoyenVariation > 0 ? '+' : ''}${reportData.kpis.panierMoyenVariation.toFixed(1)}%`
      ],
      [
        'Clients Uniques',
        reportData.kpis.clientsUniques.toString(),
        `${reportData.kpis.clientsUniquesVariation > 0 ? '+' : ''}${reportData.kpis.clientsUniquesVariation.toFixed(1)}%`
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 10 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // === SECTION TOP PRODUITS ===
  if (reportData.topProducts.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 5 Produits', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Rang', 'Produit', 'CA', 'Quantité', 'Marge']],
      body: reportData.topProducts.map((product, index) => [
        (index + 1).toString(),
        product.produit,
        `${product.ventes.toLocaleString('fr-FR')} FCFA`,
        product.quantite.toString(),
        `${product.marge.toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // === SECTION PERFORMANCE ÉQUIPE ===
  if (reportData.staffPerformance.length > 0) {
    // Nouvelle page si nécessaire
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance de l\'Équipe', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Agent', 'CA', 'Transactions', 'Panier Moyen', '% Objectif']],
      body: reportData.staffPerformance.map(staff => [
        staff.nom,
        `${staff.ventes.toLocaleString('fr-FR')} FCFA`,
        staff.transactions.toString(),
        `${staff.moyenne.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`,
        `${staff.performance.toFixed(0)}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [251, 146, 60] },
      styles: { fontSize: 9 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // === SECTION CATÉGORIES ===
  if (reportData.categoryData.length > 0) {
    // Nouvelle page si nécessaire
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Répartition par Catégorie', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Catégorie', 'CA', 'Pourcentage']],
      body: reportData.categoryData.map(cat => [
        cat.name,
        `${cat.value.toLocaleString('fr-FR')} FCFA`,
        `${cat.percentage.toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] },
      styles: { fontSize: 9 }
    });
  }

  // === PIED DE PAGE ===
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth - 30,
      doc.internal.pageSize.height - 10
    );
  }

  // Téléchargement du PDF
  const fileName = `rapport-ventes-${period}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(fileName);
}

/**
 * Obtenir le label de la période en français
 */
function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    'day': 'Aujourd\'hui',
    'week': 'Cette Semaine',
    'month': 'Ce Mois',
    'quarter': 'Ce Trimestre'
  };
  return labels[period] || period;
}

/**
 * Obtenir le label de la catégorie en français
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'all': 'Toutes Catégories',
    'medicines': 'Médicaments',
    'parapharmacy': 'Parapharmacie',
    'medical': 'Matériel Médical'
  };
  return labels[category] || category;
}

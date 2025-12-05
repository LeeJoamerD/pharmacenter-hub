import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  AdminKPI, 
  TopProduct, 
  StockAlert, 
  CategoryDistribution,
  StockCategoryLevel 
} from '@/hooks/useAdminAnalytics';

interface ExportData {
  kpis?: AdminKPI;
  topProducts: TopProduct[];
  stockAlerts: StockAlert[];
  categoryDistribution: CategoryDistribution[];
  stockLevels: StockCategoryLevel[];
  period: string;
  tenantName: string;
}

const getPeriodLabel = (period: string): string => {
  const labels: Record<string, string> = {
    week: 'Cette semaine',
    month: 'Ce mois',
    quarter: 'Ce trimestre',
    year: 'Cette année',
  };
  return labels[period] || period;
};

/**
 * Export rapport de ventes en PDF
 */
export async function exportSalesReportPDF(data: ExportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.tenantName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rapport de Ventes - ${getPeriodLabel(data.period)}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, yPos, { align: 'center' });
  
  doc.setTextColor(0);
  yPos += 15;

  // KPIs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicateurs Clés de Performance', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur', 'Variation']],
    body: [
      [
        'Chiffre d\'Affaires',
        `${(data.kpis?.chiffreAffaires || 0).toLocaleString('fr-FR')} FCFA`,
        `${(data.kpis?.chiffreAffairesVariation || 0) > 0 ? '+' : ''}${(data.kpis?.chiffreAffairesVariation || 0).toFixed(1)}%`
      ],
      [
        'Nombre de Ventes',
        (data.kpis?.nombreVentes || 0).toString(),
        `${(data.kpis?.nombreVentesVariation || 0) > 0 ? '+' : ''}${(data.kpis?.nombreVentesVariation || 0).toFixed(1)}%`
      ],
      [
        'Clients Actifs',
        (data.kpis?.clientsActifs || 0).toString(),
        `${(data.kpis?.clientsActifsVariation || 0) > 0 ? '+' : ''}${(data.kpis?.clientsActifsVariation || 0).toFixed(1)}%`
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 10 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Top Produits
  if (data.topProducts.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Produits', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Produit', 'Quantité', 'CA (FCFA)', 'Marge (%)']],
      body: data.topProducts.slice(0, 10).map((p, i) => [
        (i + 1).toString(),
        p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name,
        p.sales.toString(),
        p.revenue.toLocaleString('fr-FR'),
        `${p.margin}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Catégories
  if (data.categoryDistribution.length > 0 && yPos < 240) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Répartition par Catégorie', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Catégorie', 'Pourcentage', 'Articles']],
      body: data.categoryDistribution.map(c => [
        c.name,
        `${c.value}%`,
        c.count.toString()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] },
      styles: { fontSize: 9 }
    });
  }

  // Pied de page
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - 30, doc.internal.pageSize.height - 10);
  }

  const fileName = `rapport-ventes-${data.period}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

/**
 * Export rapport inventaire en PDF
 */
export async function exportInventoryReportPDF(data: ExportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.tenantName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.text('Bilan Inventaire', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, yPos, { align: 'center' });
  
  doc.setTextColor(0);
  yPos += 15;

  // Stats globales
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('État Général des Stocks', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Produits en Stock', (data.kpis?.produitsEnStock || 0).toString()],
      ['Alertes Actives', data.stockAlerts.length.toString()],
      ['Alertes Critiques', data.stockAlerts.filter(a => a.status === 'critique').length.toString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 10 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Niveaux par catégorie
  if (data.stockLevels.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Niveaux de Stock par Catégorie', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Catégorie', 'Stock Moyen', 'Seuil Alerte']],
      body: data.stockLevels.map(s => [
        s.category,
        s.stock.toString(),
        s.alerte.toString()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Alertes
  if (data.stockAlerts.length > 0 && yPos < 200) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Produits en Alerte', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Produit', 'Stock', 'Statut']],
      body: data.stockAlerts.slice(0, 15).map(a => [
        a.name.length > 40 ? a.name.substring(0, 40) + '...' : a.name,
        a.level.toString(),
        a.status === 'critique' ? 'CRITIQUE' : 'Bas'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 9 }
    });
  }

  const fileName = `bilan-inventaire-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

/**
 * Export rapport clients en PDF
 */
export async function exportClientsReportPDF(data: ExportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.tenantName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.text(`Analyse Clientèle - ${getPeriodLabel(data.period)}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;

  // Stats clients
  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur', 'Variation']],
    body: [
      ['Clients Actifs', (data.kpis?.clientsActifs || 0).toString(), `${(data.kpis?.clientsActifsVariation || 0).toFixed(1)}%`],
      ['Panier Moyen', data.kpis && data.kpis.nombreVentes > 0 
        ? `${Math.round(data.kpis.chiffreAffaires / data.kpis.nombreVentes).toLocaleString('fr-FR')} FCFA` 
        : '0 FCFA', 
        '-'
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [168, 85, 247] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Répartition achats
  if (data.categoryDistribution.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Répartition des Achats par Catégorie', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Catégorie', 'Pourcentage']],
      body: data.categoryDistribution.map(c => [c.name, `${c.value}%`]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  const fileName = `analyse-clientele-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

/**
 * Export rapport financier en PDF
 */
export async function exportFinancialReportPDF(data: ExportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.tenantName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.text(`Performance Financière - ${getPeriodLabel(data.period)}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;

  const ca = data.kpis?.chiffreAffaires || 0;
  const margeEstimee = ca * 0.4;
  const panierMoyen = data.kpis && data.kpis.nombreVentes > 0 ? ca / data.kpis.nombreVentes : 0;

  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Montant (FCFA)']],
    body: [
      ['Chiffre d\'Affaires Total', ca.toLocaleString('fr-FR')],
      ['Marge Brute Estimée (40%)', margeEstimee.toLocaleString('fr-FR')],
      ['Nombre de Transactions', (data.kpis?.nombreVentes || 0).toString()],
      ['Panier Moyen', Math.round(panierMoyen).toLocaleString('fr-FR')],
    ],
    theme: 'grid',
    headStyles: { fillColor: [251, 146, 60] },
  });

  const fileName = `performance-financiere-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

/**
 * Export données en Excel
 */
export async function exportAnalyticsToExcel(data: ExportData, reportType: string): Promise<void> {
  const wb = XLSX.utils.book_new();

  // Feuille KPIs
  const kpisData = [
    ['RAPPORT ANALYTICS - ' + data.tenantName.toUpperCase()],
    [`Période: ${getPeriodLabel(data.period)}`],
    [`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`],
    [],
    ['INDICATEURS CLÉS'],
    ['Indicateur', 'Valeur', 'Variation (%)'],
    ['Chiffre d\'Affaires', `${(data.kpis?.chiffreAffaires || 0).toFixed(0)} FCFA`, (data.kpis?.chiffreAffairesVariation || 0).toFixed(1)],
    ['Nombre de Ventes', (data.kpis?.nombreVentes || 0).toString(), (data.kpis?.nombreVentesVariation || 0).toFixed(1)],
    ['Produits en Stock', (data.kpis?.produitsEnStock || 0).toString(), '0'],
    ['Clients Actifs', (data.kpis?.clientsActifs || 0).toString(), (data.kpis?.clientsActifsVariation || 0).toFixed(1)],
  ];
  const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
  wsKPIs['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');

  // Feuille Top Produits
  if (data.topProducts.length > 0) {
    const productsData = [
      ['TOP PRODUITS'],
      [],
      ['#', 'Produit', 'Quantité', 'CA (FCFA)', 'Marge (%)'],
      ...data.topProducts.map((p, i) => [
        i + 1,
        p.name,
        p.sales,
        p.revenue,
        p.margin
      ])
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    wsProducts['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Produits');
  }

  // Feuille Catégories
  if (data.categoryDistribution.length > 0) {
    const catData = [
      ['RÉPARTITION PAR CATÉGORIE'],
      [],
      ['Catégorie', 'Pourcentage (%)', 'Nombre d\'articles'],
      ...data.categoryDistribution.map(c => [c.name, c.value, c.count])
    ];
    const wsCat = XLSX.utils.aoa_to_sheet(catData);
    wsCat['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Catégories');
  }

  // Feuille Alertes Stock
  if (data.stockAlerts.length > 0) {
    const alertsData = [
      ['ALERTES STOCK'],
      [],
      ['Produit', 'Stock Actuel', 'Statut'],
      ...data.stockAlerts.map(a => [a.name, a.level, a.status === 'critique' ? 'CRITIQUE' : 'Bas'])
    ];
    const wsAlerts = XLSX.utils.aoa_to_sheet(alertsData);
    wsAlerts['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsAlerts, 'Alertes Stock');
  }

  // Feuille Niveaux Stock
  if (data.stockLevels.length > 0) {
    const stockData = [
      ['NIVEAUX DE STOCK PAR CATÉGORIE'],
      [],
      ['Catégorie', 'Stock Moyen', 'Seuil Alerte'],
      ...data.stockLevels.map(s => [s.category, s.stock, s.alerte])
    ];
    const wsStock = XLSX.utils.aoa_to_sheet(stockData);
    wsStock['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsStock, 'Niveaux Stock');
  }

  const filename = `analytics-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

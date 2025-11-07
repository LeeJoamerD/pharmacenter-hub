import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format as formatDate } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChartDataset {
  name: string;
  data: any[];
  headers: string[];
}

interface ExportData {
  summary: {
    title: string;
    period: string;
    exportDate: string;
    metrics?: Record<string, any>;
  };
  datasets: ChartDataset[];
}

/**
 * Exporte les données des graphiques au format Excel
 */
export async function exportChartToExcel(
  exportData: ExportData,
  filename: string
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Feuille 1: Résumé
  const summaryData = [
    ['Rapport Analytics Stock'],
    [''],
    ['Période', exportData.summary.period],
    ['Date d\'export', exportData.summary.exportDate],
    [''],
  ];

  if (exportData.summary.metrics) {
    summaryData.push(['Métriques Globales'], ['']);
    Object.entries(exportData.summary.metrics).forEach(([key, value]) => {
      summaryData.push([key, value]);
    });
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

  // Feuilles pour chaque dataset
  exportData.datasets.forEach(dataset => {
    if (dataset.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(dataset.data);
      
      // Ajuster les largeurs de colonnes
      const maxWidths = dataset.headers.map(header => Math.max(header.length, 15));
      worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, dataset.name.substring(0, 31));
    }
  });

  // Télécharger le fichier
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exporte les données des graphiques au format PDF
 */
export async function exportChartToPDF(
  exportData: ExportData,
  filename: string
): Promise<void> {
  const doc = new jsPDF('landscape');
  let yPosition = 20;

  // Page de garde
  doc.setFontSize(20);
  doc.text(exportData.summary.title, 14, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.text(`Période: ${exportData.summary.period}`, 14, yPosition);
  yPosition += 8;
  doc.text(`Date d'export: ${exportData.summary.exportDate}`, 14, yPosition);
  yPosition += 15;

  // Métriques globales
  if (exportData.summary.metrics) {
    doc.setFontSize(14);
    doc.text('Métriques Globales', 14, yPosition);
    yPosition += 10;

    const metricsData = Object.entries(exportData.summary.metrics).map(([key, value]) => [
      key,
      typeof value === 'number' ? value.toLocaleString() : value
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Métrique', 'Valeur']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Ajouter chaque dataset comme tableau
  exportData.datasets.forEach((dataset, index) => {
    if (dataset.data.length === 0) return;

    // Nouvelle page si nécessaire
    if (yPosition > 170) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text(dataset.name, 14, yPosition);
    yPosition += 8;

    // Préparer les données du tableau
    const tableBody = dataset.data.map(row => 
      dataset.headers.map(header => {
        const value = row[header];
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return value || '';
      })
    );

    autoTable(doc, {
      startY: yPosition,
      head: [dataset.headers],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  });

  // Footer avec pagination
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Télécharger le fichier
  doc.save(`${filename}.pdf`);
}

/**
 * Fonction principale d'export pour le dashboard stock
 */
export async function exportAllAnalytics(
  dashboardData: {
    metrics: any;
    statusDistribution: any;
    valorisationByFamily: any[];
    movementsEvolution: any[];
    rotationByFamily?: any[];
  },
  format: 'xlsx' | 'pdf',
  dateFilter: { period: string; start: Date; end: Date }
): Promise<void> {
  const exportDate = formatDate(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
  const periodLabel = `${formatDate(dateFilter.start, 'dd/MM/yyyy', { locale: fr })} - ${formatDate(dateFilter.end, 'dd/MM/yyyy', { locale: fr })}`;

  const exportData: ExportData = {
    summary: {
      title: 'Rapport Analytics Stock',
      period: periodLabel,
      exportDate,
      metrics: {
        'Valeur Stock Total': `${(dashboardData.metrics.valeurStock || 0).toLocaleString()} FCFA`,
        'Produits Disponibles': `${dashboardData.metrics.disponibles || 0}`,
        'Alertes Critiques': `${(dashboardData.statusDistribution?.critique || 0) + (dashboardData.statusDistribution?.faible || 0)}`,
        'Ruptures': `${dashboardData.statusDistribution?.rupture || 0}`,
        'Expiration < 30j': `${dashboardData.metrics.expirationProche || 0}`
      }
    },
    datasets: []
  };

  // Dataset 1: Distribution du stock
  if (dashboardData.statusDistribution) {
    const dist = dashboardData.statusDistribution;
    exportData.datasets.push({
      name: 'Distribution Stock',
      headers: ['Statut', 'Nombre', 'Pourcentage'],
      data: [
        { 
          Statut: 'Rupture', 
          Nombre: dist.rupture || 0, 
          Pourcentage: `${Math.round(((dist.rupture || 0) / (dist.total || 1)) * 100)}%` 
        },
        { 
          Statut: 'Critique', 
          Nombre: dist.critique || 0, 
          Pourcentage: `${Math.round(((dist.critique || 0) / (dist.total || 1)) * 100)}%` 
        },
        { 
          Statut: 'Faible', 
          Nombre: dist.faible || 0, 
          Pourcentage: `${Math.round(((dist.faible || 0) / (dist.total || 1)) * 100)}%` 
        },
        { 
          Statut: 'Normal', 
          Nombre: dist.normal || 0, 
          Pourcentage: `${Math.round(((dist.normal || 0) / (dist.total || 1)) * 100)}%` 
        },
        { 
          Statut: 'Surstock', 
          Nombre: dist.surstock || 0, 
          Pourcentage: `${Math.round(((dist.surstock || 0) / (dist.total || 1)) * 100)}%` 
        }
      ]
    });
  }

  // Dataset 2: Valorisation par famille
  if (dashboardData.valorisationByFamily.length > 0) {
    exportData.datasets.push({
      name: 'Valorisation par Famille',
      headers: ['Famille', 'Valeur (FCFA)', 'Quantité', 'Pourcentage', 'Nb Produits'],
      data: dashboardData.valorisationByFamily.map(f => ({
        Famille: f.famille,
        'Valeur (FCFA)': f.valeur,
        Quantité: f.quantite,
        Pourcentage: `${f.pourcentage.toFixed(2)}%`,
        'Nb Produits': f.nb_produits
      }))
    });
  }

  // Dataset 3: Évolution des mouvements
  if (dashboardData.movementsEvolution.length > 0) {
    exportData.datasets.push({
      name: 'Mouvements Evolution',
      headers: ['Date', 'Entrées', 'Sorties', 'Solde'],
      data: dashboardData.movementsEvolution.map(m => ({
        Date: formatDate(new Date(m.date), 'dd/MM/yyyy', { locale: fr }),
        Entrées: m.entrees,
        Sorties: m.sorties,
        Solde: m.solde
      }))
    });
  }

  // Dataset 4: Rotation des stocks
  if (dashboardData.rotationByFamily && dashboardData.rotationByFamily.length > 0) {
    exportData.datasets.push({
      name: 'Rotation Stocks',
      headers: ['Catégorie', 'Taux Rotation', 'Durée Écoulement (jours)', 'Valeur Stock (FCFA)', 'Statut'],
      data: dashboardData.rotationByFamily.map(r => ({
        Catégorie: r.categorie,
        'Taux Rotation': r.tauxRotation.toFixed(2),
        'Durée Écoulement (jours)': r.dureeEcoulement,
        'Valeur Stock (FCFA)': r.valeurStock,
        Statut: r.statut
      }))
    });
  }

  // Exporter selon le format
  if (format === 'xlsx') {
    await exportChartToExcel(exportData, `analytics-stock-${formatDate(dateFilter.start, 'yyyy-MM-dd')}`);
  } else {
    await exportChartToPDF(exportData, `analytics-stock-${formatDate(dateFilter.start, 'yyyy-MM-dd')}`);
  }
}

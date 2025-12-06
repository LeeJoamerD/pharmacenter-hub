import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { 
  SalesForecastData, 
  StockPrediction, 
  CashflowData, 
  InfluentialFactor,
  ForecastMetrics 
} from '@/hooks/useAdvancedForecasting';

// Export des prévisions de ventes en PDF
export const exportSalesForecastToPDF = (
  data: SalesForecastData[],
  metrics: ForecastMetrics,
  modelName: string
): void => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  // En-tête
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Prévisions de Ventes IA', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${now}`, 14, 28);
  doc.text(`Modèle: ${modelName} | Précision: ${metrics.avg_accuracy}%`, 14, 34);

  // Résumé
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Résumé des Prévisions', 14, 46);

  autoTable(doc, {
    startY: 50,
    head: [['Métrique', 'Valeur']],
    body: [
      ['Prévisions actives', metrics.active_forecasts.toString()],
      ['ROI estimé', `${metrics.estimated_roi.toLocaleString('fr-FR')} FCFA`],
      ['Alertes critiques', metrics.critical_alerts.toString()],
      ['Dernière prévision', metrics.last_forecast_at ? format(new Date(metrics.last_forecast_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'N/A']
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });

  // Tableau des prévisions
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.text('Détail des Prévisions Journalières', 14, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Date', 'Réel', 'Prévu', 'Confiance']],
    body: data.map(row => [
      format(new Date(row.date), 'dd/MM/yyyy', { locale: fr }),
      row.actual !== null ? `${row.actual.toLocaleString('fr-FR')} FCFA` : '-',
      `${row.predicted.toLocaleString('fr-FR')} FCFA`,
      `${row.confidence}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`previsions_ventes_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export des prédictions de stock en Excel
export const exportStockPredictionsToExcel = (predictions: StockPrediction[]): void => {
  const data = predictions.map(p => ({
    'Produit': p.product_name || 'N/A',
    'Code': p.product_code || 'N/A',
    'Stock Actuel': p.current_stock,
    'Demande/Jour': p.predicted_demand_daily,
    'Jours Avant Rupture': p.days_until_stockout,
    'Qté Recommandée': p.recommended_order_qty,
    'Confiance': `${p.confidence}%`,
    'Tendance': getTrendLabel(p.trend),
    'Priorité': getPriorityLabel(p.priority),
    'Commandé': p.order_created ? 'Oui' : 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Prédictions Stock');

  // Ajuster les largeurs de colonnes
  ws['!cols'] = [
    { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
    { wch: 10 }, { wch: 10 }
  ];

  XLSX.writeFile(wb, `predictions_stock_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export des prévisions de trésorerie en PDF
export const exportCashflowForecastToPDF = (data: CashflowData[]): void => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  // En-tête
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Prévisions de Trésorerie', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${now}`, 14, 28);

  // Résumé
  const totalInflow = data.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = data.reduce((sum, d) => sum + d.outflow, 0);
  const totalNet = data.reduce((sum, d) => sum + d.net, 0);
  const endingBalance = data[data.length - 1]?.cumulative || 0;

  doc.setFontSize(12);
  doc.text('Résumé Prévisionnel', 14, 40);

  autoTable(doc, {
    startY: 45,
    head: [['Métrique', 'Montant']],
    body: [
      ['Total Entrées', `${totalInflow.toLocaleString('fr-FR')} FCFA`],
      ['Total Sorties', `${totalOutflow.toLocaleString('fr-FR')} FCFA`],
      ['Total Net', `${totalNet.toLocaleString('fr-FR')} FCFA`],
      ['Solde Final Prévu', `${endingBalance.toLocaleString('fr-FR')} FCFA`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] }
  });

  // Tableau détaillé
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.text('Détail Mensuel', 14, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Mois', 'Entrées', 'Sorties', 'Net', 'Cumulé']],
    body: data.map(row => [
      row.month,
      `${row.inflow.toLocaleString('fr-FR')} FCFA`,
      `${row.outflow.toLocaleString('fr-FR')} FCFA`,
      `${row.net.toLocaleString('fr-FR')} FCFA`,
      `${row.cumulative.toLocaleString('fr-FR')} FCFA`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] }
  });

  doc.save(`previsions_tresorerie_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export des facteurs influents en Excel
export const exportFactorsToExcel = (factors: InfluentialFactor[]): void => {
  const data = factors.map(f => ({
    'Facteur': f.factor_name,
    'Description': f.description || '',
    'Score d\'Influence': `${f.influence_score}%`,
    'Type de Tendance': getTrendTypeLabel(f.trend_type),
    'Poids': f.weight,
    'Source': f.data_source,
    'Actif': f.is_active ? 'Oui' : 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Facteurs Influents');

  ws['!cols'] = [
    { wch: 20 }, { wch: 40 }, { wch: 15 },
    { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 8 }
  ];

  XLSX.writeFile(wb, `facteurs_influents_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export complet du rapport de prévisions
export const exportFullForecastReport = (
  salesData: SalesForecastData[],
  stockPredictions: StockPrediction[],
  cashflowData: CashflowData[],
  factors: InfluentialFactor[],
  metrics: ForecastMetrics,
  modelName: string
): void => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
  let currentY = 20;

  // Page de titre
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('Rapport de Prévisions IA', 14, currentY);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  currentY += 12;
  doc.text(`Rapport complet généré le ${now}`, 14, currentY);
  currentY += 6;
  doc.text(`Modèle utilisé: ${modelName} | Précision: ${metrics.avg_accuracy}%`, 14, currentY);

  // Métriques clés
  currentY += 15;
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Métriques Clés', 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Métrique', 'Valeur']],
    body: [
      ['Prévisions actives', metrics.active_forecasts.toString()],
      ['Alertes critiques', metrics.critical_alerts.toString()],
      ['ROI estimé', `${metrics.estimated_roi.toLocaleString('fr-FR')} FCFA`],
      ['Précision moyenne', `${metrics.avg_accuracy}%`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });

  // Prédictions stock critiques
  currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.text('Alertes Stock Critiques', 14, currentY);

  const criticalStock = stockPredictions.filter(p => p.priority === 'critical').slice(0, 5);
  if (criticalStock.length > 0) {
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Produit', 'Stock', 'Jours Restants', 'Commande Suggérée']],
      body: criticalStock.map(p => [
        p.product_name || 'N/A',
        p.current_stock.toString(),
        p.days_until_stockout.toString(),
        p.recommended_order_qty.toString()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] }
    });
  } else {
    doc.setFontSize(10);
    doc.text('Aucune alerte critique', 14, currentY + 10);
  }

  // Nouvelle page pour les prévisions de ventes
  doc.addPage();
  currentY = 20;
  doc.setFontSize(14);
  doc.text('Prévisions de Ventes', 14, currentY);

  if (salesData.length > 0) {
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Date', 'Réel', 'Prévu', 'Confiance']],
      body: salesData.slice(0, 10).map(row => [
        format(new Date(row.date), 'dd/MM/yyyy', { locale: fr }),
        row.actual !== null ? `${row.actual.toLocaleString('fr-FR')}` : '-',
        `${row.predicted.toLocaleString('fr-FR')}`,
        `${row.confidence}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });
  }

  // Prévisions trésorerie
  currentY = (doc as any).lastAutoTable?.finalY + 15 || 100;
  doc.text('Prévisions de Trésorerie', 14, currentY);

  if (cashflowData.length > 0) {
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Mois', 'Entrées', 'Sorties', 'Net']],
      body: cashflowData.map(row => [
        row.month,
        `${row.inflow.toLocaleString('fr-FR')}`,
        `${row.outflow.toLocaleString('fr-FR')}`,
        `${row.net.toLocaleString('fr-FR')}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });
  }

  // Facteurs influents
  currentY = (doc as any).lastAutoTable?.finalY + 15 || 180;
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  doc.text('Facteurs Influents', 14, currentY);

  if (factors.length > 0) {
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Facteur', 'Impact', 'Tendance']],
      body: factors.map(f => [
        f.factor_name,
        `${f.influence_score}%`,
        getTrendTypeLabel(f.trend_type)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] }
    });
  }

  doc.save(`rapport_previsions_complet_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Helpers
function getTrendLabel(trend: string): string {
  const labels: Record<string, string> = {
    'increasing': 'En hausse',
    'decreasing': 'En baisse',
    'stable': 'Stable',
    'seasonal_peak': 'Pic saisonnier'
  };
  return labels[trend] || trend;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    'critical': 'Critique',
    'medium': 'Moyen',
    'low': 'Faible'
  };
  return labels[priority] || priority;
}

function getTrendTypeLabel(trendType: string): string {
  const labels: Record<string, string> = {
    'positive': 'Positif',
    'negative': 'Négatif',
    'cyclical': 'Cyclique',
    'spike': 'Pic',
    'controlled': 'Contrôlé',
    'variable': 'Variable'
  };
  return labels[trendType] || trendType;
}

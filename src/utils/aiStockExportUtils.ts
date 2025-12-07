import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { StockPrediction } from '@/hooks/useAdvancedForecasting';
import type { AIStockMetrics, AIStockSuggestion } from '@/hooks/useAIStockManagement';

// Helper functions
const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    'critical': 'Critique',
    'high': 'Élevée',
    'medium': 'Moyenne',
    'low': 'Faible'
  };
  return labels[priority] || priority;
};

const getTrendLabel = (trend: string): string => {
  const labels: Record<string, string> = {
    'increasing': 'En hausse',
    'decreasing': 'En baisse',
    'stable': 'Stable',
    'seasonal_peak': 'Pic saisonnier'
  };
  return labels[trend] || trend;
};

const getSuggestionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'reorder': 'Réapprovisionnement',
    'promotion': 'Promotion',
    'fifo_correction': 'Correction FIFO'
  };
  return labels[type] || type;
};

// Export predictions to PDF
export const exportPredictionsToPDF = (
  predictions: StockPrediction[],
  pharmacyName: string = 'PharmaSoft'
): void => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Prédictions Stock IA', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${pharmacyName} - Généré le ${now}`, 14, 28);

  // Summary
  const criticalCount = predictions.filter(p => p.priority === 'critical').length;
  const mediumCount = predictions.filter(p => p.priority === 'medium').length;

  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Résumé', 14, 40);

  autoTable(doc, {
    startY: 45,
    head: [['Métrique', 'Valeur']],
    body: [
      ['Total prédictions', predictions.length.toString()],
      ['Alertes critiques', criticalCount.toString()],
      ['Alertes moyennes', mediumCount.toString()]
    ],
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] }
  });

  // Predictions table
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.text('Détail des Prédictions', 14, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Produit', 'Stock', 'Demande/jour', 'Jours restants', 'Priorité', 'Confiance']],
    body: predictions.map(p => [
      p.product_name || 'N/A',
      p.current_stock.toString(),
      p.predicted_demand_daily?.toFixed(1) || '0',
      p.days_until_stockout?.toString() || 'N/A',
      getPriorityLabel(p.priority),
      `${p.confidence}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
    columnStyles: {
      0: { cellWidth: 50 },
      4: { cellWidth: 25 }
    }
  });

  doc.save(`predictions_stock_ia_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export predictions to Excel
export const exportPredictionsToExcel = (
  predictions: StockPrediction[],
  pharmacyName: string = 'PharmaSoft'
): void => {
  const data = predictions.map(p => ({
    'Produit': p.product_name || 'N/A',
    'Code': p.product_code || 'N/A',
    'Stock Actuel': p.current_stock,
    'Demande/Jour': p.predicted_demand_daily?.toFixed(2) || '0',
    'Jours Avant Rupture': p.days_until_stockout || 'N/A',
    'Qté Recommandée': p.recommended_order_qty || 0,
    'Tendance': getTrendLabel(p.trend),
    'Priorité': getPriorityLabel(p.priority),
    'Confiance': `${p.confidence}%`,
    'Commandé': p.order_created ? 'Oui' : 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Prédictions Stock');

  ws['!cols'] = [
    { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }
  ];

  XLSX.writeFile(wb, `predictions_stock_ia_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export suggestions to PDF
export const exportSuggestionsToPDF = (
  suggestions: AIStockSuggestion[],
  pharmacyName: string = 'PharmaSoft'
): void => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Suggestions d\'Optimisation Stock', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${pharmacyName} - Généré le ${now}`, 14, 28);

  // Group by type
  const reorderSuggestions = suggestions.filter(s => s.type === 'reorder');
  const promotionSuggestions = suggestions.filter(s => s.type === 'promotion');
  const fifoSuggestions = suggestions.filter(s => s.type === 'fifo_correction');

  let currentY = 40;

  // Reorder suggestions
  if (reorderSuggestions.length > 0) {
    doc.setFontSize(12);
    doc.text('Réapprovisionnements Suggérés', 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Produit', 'Stock Actuel', 'Qté Recommandée', 'Priorité']],
      body: reorderSuggestions.map(s => [
        s.product_name,
        s.current_value.toString(),
        s.recommended_qty?.toString() || 'N/A',
        getPriorityLabel(s.priority)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Promotion suggestions
  if (promotionSuggestions.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.text('Promotions Suggérées (Produits à Péremption Proche)', 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Produit', 'Lot', 'Quantité', 'Jours avant expiration', 'Valeur']],
      body: promotionSuggestions.map(s => [
        s.product_name,
        s.lot_number || 'N/A',
        s.current_value.toString(),
        s.days_until_expiry?.toString() || 'N/A',
        `${s.stock_value?.toLocaleString('fr-FR') || 0} FCFA`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // FIFO suggestions
  if (fifoSuggestions.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.text('Corrections FIFO Suggérées', 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Produit', 'Lot Ancien', 'Lot Récent', 'Raison']],
      body: fifoSuggestions.map(s => [
        s.product_name,
        s.older_lot || 'N/A',
        s.newer_lot || 'N/A',
        s.reason
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] }
    });
  }

  doc.save(`suggestions_optimisation_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export suggestions to Excel
export const exportSuggestionsToExcel = (
  suggestions: AIStockSuggestion[],
  pharmacyName: string = 'PharmaSoft'
): void => {
  const data = suggestions.map(s => ({
    'Type': getSuggestionTypeLabel(s.type),
    'Priorité': getPriorityLabel(s.priority),
    'Produit': s.product_name,
    'Code': s.product_code || 'N/A',
    'Valeur Actuelle': s.current_value,
    'Valeur Suggérée': s.suggested_value || 'N/A',
    'Qté Recommandée': s.recommended_qty || 'N/A',
    'Jours avant expiration': s.days_until_expiry || 'N/A',
    'Raison': s.reason,
    'Bénéfice Attendu': s.expected_benefit.description
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Suggestions');

  ws['!cols'] = [
    { wch: 18 }, { wch: 12 }, { wch: 35 }, { wch: 15 },
    { wch: 14 }, { wch: 14 }, { wch: 15 }, { wch: 18 },
    { wch: 40 }, { wch: 35 }
  ];

  XLSX.writeFile(wb, `suggestions_optimisation_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export full optimization report
export const exportOptimizationReportPDF = (
  metrics: AIStockMetrics,
  predictions: StockPrediction[],
  suggestions: AIStockSuggestion[],
  pharmacyName: string = 'PharmaSoft'
): void => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  // Title page
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('Rapport d\'Optimisation Stock IA', 14, 25);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`${pharmacyName}`, 14, 35);
  doc.text(`Généré le ${now}`, 14, 42);

  // Score card
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text('Score d\'Optimisation', 14, 60);
  
  doc.setFontSize(36);
  const scoreColor = metrics.optimization_score >= 70 ? [34, 197, 94] : 
                     metrics.optimization_score >= 40 ? [245, 158, 11] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${metrics.optimization_score}%`, 14, 80);

  // Key metrics
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Indicateurs Clés', 14, 100);

  autoTable(doc, {
    startY: 105,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Produits analysés', metrics.products_analyzed.toString()],
      ['Prédictions actives', metrics.active_predictions.toString()],
      ['Alertes critiques', metrics.critical_alerts.toString()],
      ['Suggestions en attente', metrics.pending_suggestions.toString()],
      ['Économies réalisées', `${metrics.total_savings.toLocaleString('fr-FR')} FCFA`],
      ['Produits en péremption (<30j)', metrics.expiring_products.toString()],
      ['Violations FIFO', metrics.fifo_violations.toString()]
    ],
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] }
  });

  // Critical predictions
  const criticalPredictions = predictions.filter(p => p.priority === 'critical').slice(0, 10);
  if (criticalPredictions.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Alertes Critiques - Ruptures Imminentes', 14, 20);

    autoTable(doc, {
      startY: 25,
      head: [['Produit', 'Stock', 'Jours', 'Action']],
      body: criticalPredictions.map(p => [
        p.product_name || 'N/A',
        p.current_stock.toString(),
        p.days_until_stockout?.toString() || 'N/A',
        `Commander ${p.recommended_order_qty} unités`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] }
    });
  }

  // Top suggestions
  if (suggestions.length > 0) {
    const currentY = (doc as any).lastAutoTable?.finalY + 20 || 100;
    if (currentY > 200) {
      doc.addPage();
      doc.text('Suggestions Prioritaires', 14, 20);
      autoTable(doc, {
        startY: 25,
        head: [['Type', 'Produit', 'Priorité', 'Action']],
        body: suggestions.slice(0, 15).map(s => [
          getSuggestionTypeLabel(s.type),
          s.product_name,
          getPriorityLabel(s.priority),
          s.reason
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
    } else {
      doc.text('Suggestions Prioritaires', 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Type', 'Produit', 'Priorité', 'Action']],
        body: suggestions.slice(0, 10).map(s => [
          getSuggestionTypeLabel(s.type),
          s.product_name,
          getPriorityLabel(s.priority),
          s.reason
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
  }

  doc.save(`rapport_optimisation_stock_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

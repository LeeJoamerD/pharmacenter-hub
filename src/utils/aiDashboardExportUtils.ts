import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AIDashboardMetrics, AIModelSummary, AIInsightSummary, DiagnosticResult } from '@/hooks/useAIDashboard';

// PDF Export for Dashboard Report
export const exportDashboardToPDF = (
  metrics: AIDashboardMetrics,
  models: AIModelSummary[],
  insights: AIInsightSummary[],
  pharmacyName: string = 'PharmaSoft'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text('Rapport Dashboard IA', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(108, 117, 125);
  doc.text(pharmacyName, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, 35, { align: 'center' });
  
  // Metrics Section
  doc.setFontSize(14);
  doc.setTextColor(33, 37, 41);
  doc.text('Métriques Clés', 14, 50);
  
  autoTable(doc, {
    startY: 55,
    head: [['Métrique', 'Valeur']],
    body: [
      ['Modèles Actifs', metrics.modelsActive.toString()],
      ['Modèles en Entraînement', metrics.modelsTraining.toString()],
      ['Prédictions Aujourd\'hui', metrics.predictionsToday.toString()],
      ['Prédictions Cette Semaine', metrics.predictionsWeek.toString()],
      ['Recommandations Générées', metrics.recommendationsTotal.toString()],
      ['Recommandations Implémentées', metrics.recommendationsImplemented.toString()],
      ['Précision Moyenne', `${metrics.avgAccuracy}%`],
      ['Temps de Réponse Moyen', `${metrics.avgProcessingTime}s`],
      ['Diagnostics Exécutés', metrics.diagnosticsRun.toString()],
      ['Anomalies Actives', metrics.anomaliesActive.toString()],
      ['Insights Non Lus', metrics.insightsUnread.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  // Models Section
  const modelsStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Modèles IA', 14, modelsStartY);
  
  if (models.length > 0) {
    autoTable(doc, {
      startY: modelsStartY + 5,
      head: [['Nom', 'Statut', 'Précision', 'Spécialisation']],
      body: models.map(model => [
        model.name,
        model.status === 'active' ? 'Actif' : 
        model.status === 'training' ? 'Entraînement' : 'Inactif',
        `${model.accuracy}%`,
        model.specialization || 'Général'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] }
    });
  }
  
  // Insights Section
  const insightsStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Insights Récents', 14, insightsStartY);
  
  if (insights.length > 0) {
    autoTable(doc, {
      startY: insightsStartY + 5,
      head: [['Type', 'Titre', 'Confiance', 'Impact', 'Statut']],
      body: insights.map(insight => [
        insight.type,
        insight.title,
        `${insight.confidence}%`,
        insight.impact === 'high' ? 'Élevé' :
        insight.impact === 'critical' ? 'Critique' :
        insight.impact === 'medium' ? 'Moyen' : 'Faible',
        insight.isApplied ? 'Appliqué' : insight.isRead ? 'Lu' : 'Non lu'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] }
    });
  }
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(
    'PharmaSoft - Rapport IA',
    pageWidth / 2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );
  
  doc.save(`rapport-ia-dashboard-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Excel Export for Dashboard Data
export const exportDashboardToExcel = (
  metrics: AIDashboardMetrics,
  models: AIModelSummary[],
  insights: AIInsightSummary[],
  pharmacyName: string = 'PharmaSoft'
) => {
  const workbook = XLSX.utils.book_new();
  
  // Metrics Sheet
  const metricsData = [
    ['Rapport Dashboard IA - ' + pharmacyName],
    ['Généré le ' + format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })],
    [],
    ['Métrique', 'Valeur'],
    ['Modèles Actifs', metrics.modelsActive],
    ['Modèles en Entraînement', metrics.modelsTraining],
    ['Modèles Inactifs', metrics.modelsInactive],
    ['Prédictions Aujourd\'hui', metrics.predictionsToday],
    ['Prédictions Cette Semaine', metrics.predictionsWeek],
    ['Recommandations Générées', metrics.recommendationsTotal],
    ['Recommandations Implémentées', metrics.recommendationsImplemented],
    ['Précision Moyenne (%)', metrics.avgAccuracy],
    ['Temps de Réponse Moyen (s)', metrics.avgProcessingTime],
    ['Diagnostics Exécutés', metrics.diagnosticsRun],
    ['Anomalies Actives', metrics.anomaliesActive],
    ['Insights Non Lus', metrics.insightsUnread],
    ['Conversations Actives', metrics.conversationsActive],
    ['Confiance Moyenne (%)', metrics.avgConfidence],
  ];
  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Métriques');
  
  // Models Sheet
  const modelsData = [
    ['Modèles IA'],
    [],
    ['Nom', 'Statut', 'Précision (%)', 'Spécialisation', 'Dernière MAJ'],
    ...models.map(model => [
      model.name,
      model.status === 'active' ? 'Actif' : 
      model.status === 'training' ? 'Entraînement' : 'Inactif',
      model.accuracy,
      model.specialization || 'Général',
      format(new Date(model.lastUpdate), 'dd/MM/yyyy HH:mm', { locale: fr })
    ])
  ];
  const modelsSheet = XLSX.utils.aoa_to_sheet(modelsData);
  XLSX.utils.book_append_sheet(workbook, modelsSheet, 'Modèles');
  
  // Insights Sheet
  const insightsData = [
    ['Insights IA'],
    [],
    ['Type', 'Titre', 'Description', 'Confiance (%)', 'Impact', 'Lu', 'Appliqué', 'Date'],
    ...insights.map(insight => [
      insight.type,
      insight.title,
      insight.description,
      insight.confidence,
      insight.impact,
      insight.isRead ? 'Oui' : 'Non',
      insight.isApplied ? 'Oui' : 'Non',
      format(new Date(insight.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })
    ])
  ];
  const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
  XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights');
  
  XLSX.writeFile(workbook, `rapport-ia-dashboard-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// PDF Export for Diagnostic Report
export const exportDiagnosticReportToPDF = (
  result: DiagnosticResult,
  pharmacyName: string = 'PharmaSoft'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text('Rapport de Diagnostic IA', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(108, 117, 125);
  doc.text(pharmacyName, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, 35, { align: 'center' });
  
  // Global Score
  doc.setFontSize(24);
  const scoreColor = result.globalScore >= 80 ? 34 : result.globalScore >= 60 ? 249 : 239;
  doc.setTextColor(scoreColor, result.globalScore >= 80 ? 197 : result.globalScore >= 60 ? 115 : 68, result.globalScore >= 80 ? 94 : result.globalScore >= 60 ? 22 : 68);
  doc.text(`Score Global: ${result.globalScore}%`, pageWidth / 2, 55, { align: 'center' });
  
  // Sectoral Scores
  doc.setFontSize(14);
  doc.setTextColor(33, 37, 41);
  doc.text('Scores Sectoriels', 14, 75);
  
  autoTable(doc, {
    startY: 80,
    head: [['Secteur', 'Score', 'Statut']],
    body: [
      ['Ventes', `${result.salesScore}%`, result.salesScore >= 80 ? '✓ Bon' : result.salesScore >= 60 ? '⚠ Moyen' : '✗ Critique'],
      ['Stock', `${result.stockScore}%`, result.stockScore >= 80 ? '✓ Bon' : result.stockScore >= 60 ? '⚠ Moyen' : '✗ Critique'],
      ['Marge', `${result.marginScore}%`, result.marginScore >= 80 ? '✓ Bon' : result.marginScore >= 60 ? '⚠ Moyen' : '✗ Critique'],
      ['Clients', `${result.customerScore}%`, result.customerScore >= 80 ? '✓ Bon' : result.customerScore >= 60 ? '⚠ Moyen' : '✗ Critique'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  // Summary
  const summaryStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Résumé', 14, summaryStartY);
  
  autoTable(doc, {
    startY: summaryStartY + 5,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Anomalies Détectées', result.anomaliesDetected.toString()],
      ['Goulots d\'Étranglement', result.bottlenecksFound.toString()],
      ['Potentiel d\'Amélioration', `${result.improvementPotential}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] }
  });
  
  doc.save(`rapport-diagnostic-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

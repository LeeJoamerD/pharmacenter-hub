import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { StrategicRecommendation, RecommendationsMetrics } from '@/hooks/useStrategicRecommendations';

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
};

const getImpactLabel = (impact: string) => {
  switch (impact) {
    case 'high': return 'Élevé';
    case 'medium': return 'Moyen';
    case 'low': return 'Faible';
    default: return impact;
  }
};

const getEffortLabel = (effort: string) => {
  switch (effort) {
    case 'high': return 'Élevé';
    case 'medium': return 'Moyen';
    case 'low': return 'Faible';
    default: return effort;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'new': return 'Nouvelle';
    case 'in-progress': return 'En cours';
    case 'scheduled': return 'Programmée';
    case 'implemented': return 'Implémentée';
    case 'rejected': return 'Rejetée';
    default: return status;
  }
};

export const exportRecommendationsToPDF = (
  recommendations: StrategicRecommendation[],
  metrics: RecommendationsMetrics,
  pharmacyName: string = 'PharmaSoft'
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text('Rapport des Recommandations Stratégiques IA', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`${pharmacyName} - Généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 28, { align: 'center' });
  
  // Metrics summary
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text('Résumé', 14, 40);
  
  const metricsData = [
    ['Total recommandations', metrics.total_recommendations.toString()],
    ['Nouvelles', metrics.new_recommendations.toString()],
    ['En cours', metrics.in_progress.toString()],
    ['Implémentées', metrics.implemented.toString()],
    ['Confiance moyenne', `${metrics.avg_confidence}%`],
    ['ROI potentiel', metrics.potential_roi]
  ];
  
  autoTable(doc, {
    startY: 45,
    head: [['Métrique', 'Valeur']],
    body: metricsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
    tableWidth: 80
  });
  
  // Recommendations table
  doc.setFontSize(12);
  doc.text('Liste des Recommandations', 14, (doc as any).lastAutoTable.finalY + 15);
  
  const tableData = recommendations.map(rec => [
    rec.title.substring(0, 40) + (rec.title.length > 40 ? '...' : ''),
    rec.category,
    getImpactLabel(rec.impact),
    `${rec.confidence}%`,
    `#${rec.priority}`,
    getStatusLabel(rec.status),
    rec.estimated_roi || '-'
  ]);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Titre', 'Catégorie', 'Impact', 'Confiance', 'Priorité', 'Statut', 'ROI']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 15 },
      5: { cellWidth: 22 },
      6: { cellWidth: 25 }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `PharmaSoft © ${new Date().getFullYear()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );
  
  doc.save(`recommandations-strategiques-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportRecommendationsToExcel = (
  recommendations: StrategicRecommendation[],
  metrics: RecommendationsMetrics
): void => {
  // Prepare recommendations data
  const recData = recommendations.map(rec => ({
    'Titre': rec.title,
    'Catégorie': rec.category,
    'Description': rec.description,
    'Impact': getImpactLabel(rec.impact),
    'Confiance (%)': rec.confidence,
    'Priorité': rec.priority,
    'Effort': getEffortLabel(rec.effort),
    'Statut': getStatusLabel(rec.status),
    'ROI Estimé': rec.estimated_roi || '-',
    'Délai': rec.timeframe || '-',
    'Facteurs Clés': Array.isArray(rec.factors) ? rec.factors.join('; ') : '',
    'Actions Recommandées': Array.isArray(rec.actions) ? rec.actions.join('; ') : '',
    'Date Programmée': formatDate(rec.scheduled_date),
    'Date Implémentation': formatDate(rec.implemented_at),
    'Motif Rejet': rec.rejection_reason || '-',
    'Créée le': formatDate(rec.created_at)
  }));
  
  // Prepare metrics data
  const metricsData = [
    { 'Métrique': 'Total recommandations', 'Valeur': metrics.total_recommendations },
    { 'Métrique': 'Nouvelles', 'Valeur': metrics.new_recommendations },
    { 'Métrique': 'En cours', 'Valeur': metrics.in_progress },
    { 'Métrique': 'Programmées', 'Valeur': metrics.scheduled },
    { 'Métrique': 'Implémentées', 'Valeur': metrics.implemented },
    { 'Métrique': 'Rejetées', 'Valeur': metrics.rejected },
    { 'Métrique': 'Confiance moyenne (%)', 'Valeur': metrics.avg_confidence },
    { 'Métrique': 'Impact élevé', 'Valeur': metrics.high_impact_count },
    { 'Métrique': 'ROI potentiel', 'Valeur': metrics.potential_roi }
  ];
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add recommendations sheet
  const wsRec = XLSX.utils.json_to_sheet(recData);
  XLSX.utils.book_append_sheet(wb, wsRec, 'Recommandations');
  
  // Add metrics sheet
  const wsMetrics = XLSX.utils.json_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métriques');
  
  // Save file
  XLSX.writeFile(wb, `recommandations-strategiques-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const generateImplementationReport = (
  implementedRecs: StrategicRecommendation[],
  pharmacyName: string = 'PharmaSoft'
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text('Rapport d\'Implémentation', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 28, { align: 'center' });
  
  // Summary
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text(`${implementedRecs.length} recommandations implémentées`, 14, 45);
  
  // Details
  let yPos = 55;
  implementedRecs.forEach((rec, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246);
    doc.text(`${index + 1}. ${rec.title}`, 14, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    doc.text(`Catégorie: ${rec.category} | Impact: ${getImpactLabel(rec.impact)} | ROI: ${rec.estimated_roi || 'N/A'}`, 14, yPos);
    yPos += 5;
    doc.text(`Implémentée le: ${formatDate(rec.implemented_at)}`, 14, yPos);
    yPos += 10;
  });
  
  doc.save(`rapport-implementation-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

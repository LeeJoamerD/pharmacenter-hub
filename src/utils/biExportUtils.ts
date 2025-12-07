import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BIMetrics, 
  ClientPrediction, 
  BusinessPattern, 
  ClientSegment, 
  ProcessOptimization 
} from '@/hooks/useBusinessIntelligence';

// Export Predictions to PDF
export const exportPredictionsToPDF = (
  predictions: ClientPrediction[], 
  metrics: BIMetrics | null,
  pharmacyName: string
) => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  doc.setFontSize(18);
  doc.text('Rapport Prédictions Clients', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${now}`, 14, 28);

  // KPIs Summary
  if (metrics) {
    doc.setFontSize(12);
    doc.text('Résumé des Indicateurs', 14, 40);
    doc.setFontSize(10);
    doc.text(`• Prédiction Attrition: ${metrics.churn_prediction}%`, 20, 50);
    doc.text(`• LTV Moyenne: ${metrics.avg_ltv?.toLocaleString('fr-FR')} FCFA`, 20, 58);
    doc.text(`• Score Risque: ${metrics.risk_score}/100`, 20, 66);
    doc.text(`• Clients à risque: ${metrics.at_risk_clients}/${metrics.total_clients}`, 20, 74);
  }

  // Predictions Table
  const tableData = predictions.slice(0, 50).map(pred => [
    pred.segment || 'N/A',
    pred.risk_level === 'high' ? 'Élevé' : pred.risk_level === 'medium' ? 'Moyen' : 'Faible',
    `${pred.confidence}%`,
    pred.predicted_value?.toFixed(1) || 'N/A',
    pred.is_applied ? 'Oui' : 'Non'
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Segment', 'Risque', 'Confiance', 'Score', 'Appliqué']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`predictions-clients-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export Predictions to Excel
export const exportPredictionsToExcel = (
  predictions: ClientPrediction[],
  pharmacyName: string
) => {
  const data = predictions.map(pred => ({
    'Segment': pred.segment || 'N/A',
    'Type': pred.prediction_type,
    'Niveau Risque': pred.risk_level === 'high' ? 'Élevé' : pred.risk_level === 'medium' ? 'Moyen' : 'Faible',
    'Confiance (%)': pred.confidence,
    'Score Prédit': pred.predicted_value,
    'Appliqué': pred.is_applied ? 'Oui' : 'Non',
    'Valide Jusqu\'au': pred.valid_until ? format(new Date(pred.valid_until), 'dd/MM/yyyy') : 'N/A',
    'Créé le': format(new Date(pred.created_at), 'dd/MM/yyyy HH:mm')
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Prédictions');
  XLSX.writeFile(wb, `predictions-clients-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export Patterns to PDF
export const exportPatternsToPDF = (patterns: BusinessPattern[], pharmacyName: string) => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  doc.setFontSize(18);
  doc.text('Rapport Patterns Découverts', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${now}`, 14, 28);

  const tableData = patterns.map(pattern => [
    pattern.pattern_name,
    pattern.description?.substring(0, 50) || 'N/A',
    `${pattern.confidence}%`,
    pattern.impact,
    pattern.frequency,
    pattern.is_exploited ? 'Oui' : 'Non'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Pattern', 'Description', 'Confiance', 'Impact', 'Fréquence', 'Exploité']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [245, 158, 11] }
  });

  doc.save(`patterns-business-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export Patterns to Excel
export const exportPatternsToExcel = (patterns: BusinessPattern[], pharmacyName: string) => {
  const data = patterns.map(pattern => ({
    'Nom': pattern.pattern_name,
    'Description': pattern.description || '',
    'Confiance (%)': pattern.confidence,
    'Impact': pattern.impact,
    'Fréquence': pattern.frequency,
    'Méthode Découverte': pattern.discovery_method,
    'Actionnable': pattern.is_actionable ? 'Oui' : 'Non',
    'Exploité': pattern.is_exploited ? 'Oui' : 'Non',
    'Date Exploitation': pattern.exploited_at ? format(new Date(pattern.exploited_at), 'dd/MM/yyyy') : 'N/A',
    'Créé le': format(new Date(pattern.created_at), 'dd/MM/yyyy HH:mm')
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Patterns');
  XLSX.writeFile(wb, `patterns-business-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export Segments to PDF
export const exportSegmentsToPDF = (segments: ClientSegment[], pharmacyName: string) => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  doc.setFontSize(18);
  doc.text('Rapport Segmentation Clients', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${now}`, 14, 28);

  // Summary
  const totalClients = segments.reduce((sum, s) => sum + s.size, 0);
  const avgCLV = segments.length > 0 
    ? segments.reduce((sum, s) => sum + s.clv, 0) / segments.length 
    : 0;

  doc.setFontSize(12);
  doc.text('Résumé', 14, 40);
  doc.setFontSize(10);
  doc.text(`• Segments actifs: ${segments.length}`, 20, 50);
  doc.text(`• Total clients segmentés: ${totalClients}`, 20, 58);
  doc.text(`• CLV moyenne: ${avgCLV.toLocaleString('fr-FR')} FCFA`, 20, 66);

  const tableData = segments.map(segment => [
    segment.segment_name,
    segment.size.toString(),
    `${segment.clv.toLocaleString('fr-FR')} FCFA`,
    segment.next_action || 'N/A',
    segment.is_auto_generated ? 'Auto' : 'Manuel'
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['Segment', 'Taille', 'CLV', 'Action Recommandée', 'Type']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] }
  });

  doc.save(`segmentation-clients-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export Segments to Excel
export const exportSegmentsToExcel = (segments: ClientSegment[], pharmacyName: string) => {
  const data = segments.map(segment => ({
    'Segment': segment.segment_name,
    'Taille': segment.size,
    'CLV (FCFA)': segment.clv,
    'Caractéristiques': segment.characteristics.join(', '),
    'Action Recommandée': segment.next_action || '',
    'Type': segment.is_auto_generated ? 'Automatique' : 'Manuel',
    'Actif': segment.is_active ? 'Oui' : 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Segments');
  XLSX.writeFile(wb, `segmentation-clients-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export Process Optimizations to PDF
export const exportOptimizationsToPDF = (
  optimizations: ProcessOptimization[], 
  pharmacyName: string
) => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  doc.setFontSize(18);
  doc.text('Rapport Optimisation Processus', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${now}`, 14, 28);

  // Summary
  const totalSavings = optimizations.reduce((sum, o) => 
    sum + (o.current_time_minutes - o.optimized_time_minutes), 0
  );
  const avgImprovement = optimizations.length > 0
    ? optimizations.reduce((sum, o) => sum + o.improvement_percentage, 0) / optimizations.length
    : 0;

  doc.setFontSize(12);
  doc.text('Résumé', 14, 40);
  doc.setFontSize(10);
  doc.text(`• Processus analysés: ${optimizations.length}`, 20, 50);
  doc.text(`• Temps économisé potentiel: ${totalSavings} minutes`, 20, 58);
  doc.text(`• Amélioration moyenne: ${avgImprovement.toFixed(1)}%`, 20, 66);

  const tableData = optimizations.map(opt => [
    opt.process_name,
    `${opt.current_time_minutes} min`,
    `${opt.optimized_time_minutes} min`,
    `${opt.improvement_percentage}%`,
    opt.difficulty,
    opt.roi,
    opt.status === 'implemented' ? 'Implémenté' : 
    opt.status === 'rejected' ? 'Rejeté' : 'En attente'
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['Processus', 'Temps Actuel', 'Temps Optimisé', 'Amélioration', 'Difficulté', 'ROI', 'Statut']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246] }
  });

  doc.save(`optimisation-processus-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export Process Optimizations to Excel
export const exportOptimizationsToExcel = (
  optimizations: ProcessOptimization[], 
  pharmacyName: string
) => {
  const data = optimizations.map(opt => ({
    'Processus': opt.process_name,
    'Temps Actuel (min)': opt.current_time_minutes,
    'Temps Optimisé (min)': opt.optimized_time_minutes,
    'Amélioration (%)': opt.improvement_percentage,
    'Difficulté': opt.difficulty,
    'ROI': opt.roi,
    'Statut': opt.status === 'implemented' ? 'Implémenté' : 
              opt.status === 'rejected' ? 'Rejeté' : 'En attente',
    'Notes': opt.implementation_notes || '',
    'Implémenté le': opt.implemented_at ? format(new Date(opt.implemented_at), 'dd/MM/yyyy') : 'N/A'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Optimisations');
  XLSX.writeFile(wb, `optimisation-processus-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export Full BI Report to PDF
export const exportFullBIReportToPDF = (
  metrics: BIMetrics | null,
  predictions: ClientPrediction[],
  patterns: BusinessPattern[],
  segments: ClientSegment[],
  optimizations: ProcessOptimization[],
  pharmacyName: string
) => {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Rapport Business Intelligence Complet', 14, yPos);
  yPos += 12;
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${now}`, 14, yPos);
  yPos += 15;

  // KPIs
  if (metrics) {
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text('1. Indicateurs Clés', 14, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`• Prédiction Attrition: ${metrics.churn_prediction}%`, 20, yPos); yPos += 7;
    doc.text(`• LTV Moyenne: ${metrics.avg_ltv?.toLocaleString('fr-FR')} FCFA`, 20, yPos); yPos += 7;
    doc.text(`• Score Risque: ${metrics.risk_score}/100`, 20, yPos); yPos += 7;
    doc.text(`• Next Best Action: ${metrics.next_best_action}`, 20, yPos); yPos += 7;
    doc.text(`• Clients totaux: ${metrics.total_clients} (${metrics.at_risk_clients} à risque)`, 20, yPos); yPos += 7;
    doc.text(`• Patterns actionnables: ${metrics.actionable_patterns}/${metrics.total_patterns}`, 20, yPos);
    yPos += 15;
  }

  // Segments Summary
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text('2. Segmentation Clients', 14, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const segmentData = segments.slice(0, 5).map(s => [
    s.segment_name, 
    s.size.toString(), 
    `${s.clv.toLocaleString('fr-FR')} FCFA`,
    s.next_action || 'N/A'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Segment', 'Taille', 'CLV', 'Action']],
    body: segmentData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 14 }
  });

  // Add new page for patterns and optimizations
  doc.addPage();
  yPos = 20;

  // Patterns
  doc.setFontSize(14);
  doc.setTextColor(245, 158, 11);
  doc.text('3. Patterns Découverts', 14, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const patternData = patterns.slice(0, 5).map(p => [
    p.pattern_name,
    `${p.confidence}%`,
    p.impact,
    p.is_exploited ? 'Oui' : 'Non'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Pattern', 'Confiance', 'Impact', 'Exploité']],
    body: patternData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [245, 158, 11] },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Optimizations
  doc.setFontSize(14);
  doc.setTextColor(139, 92, 246);
  doc.text('4. Optimisations Processus', 14, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  const optData = optimizations.slice(0, 5).map(o => [
    o.process_name,
    `${o.improvement_percentage}%`,
    o.difficulty,
    o.roi
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Processus', 'Amélioration', 'Difficulté', 'ROI']],
    body: optData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246] },
    margin: { left: 14 }
  });

  doc.save(`rapport-bi-complet-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DiagnosticSession, Anomaly, Bottleneck } from '@/hooks/useIntelligentDiagnostic';

export const exportDiagnosticToPDF = (
  session: DiagnosticSession,
  anomalies: Anomaly[],
  bottlenecks: Bottleneck[],
  pharmacyName: string
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Rapport de Diagnostic IA', 14, 22);
  doc.setFontSize(12);
  doc.text(pharmacyName, 14, 30);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 38);

  // Score global
  doc.setFontSize(16);
  doc.text(`Score Global: ${session.global_score}/100`, 14, 52);
  doc.setFontSize(10);
  doc.text(`Niveau: ${session.status_level} | Potentiel d'amélioration: ${session.improvement_potential} points`, 14, 60);

  // Performance par secteur
  doc.setFontSize(14);
  doc.text('Performance par Secteur', 14, 75);
  
  const secteurData = [
    ['Ventes', session.sales_score.toString(), session.sales_trend, session.sales_status, session.sales_details || '-'],
    ['Stock', session.stock_score.toString(), session.stock_trend, session.stock_status, session.stock_details || '-'],
    ['Marge', session.margin_score.toString(), session.margin_trend, session.margin_status, session.margin_details || '-'],
    ['Clients', session.customer_score.toString(), session.customer_trend, session.customer_status, session.customer_details || '-']
  ];

  autoTable(doc, {
    head: [['Secteur', 'Score', 'Tendance', 'Statut', 'Détails']],
    body: secteurData,
    startY: 80,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  let currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Anomalies
  if (anomalies.length > 0) {
    doc.setFontSize(14);
    doc.text('Anomalies Détectées', 14, currentY);
    
    const anomalyData = anomalies.map(a => [
      a.type === 'critique' ? 'Critique' : a.type === 'warning' ? 'Attention' : 'Info',
      a.title,
      a.description.substring(0, 50) + '...',
      `${a.confidence}%`,
      a.status === 'detected' ? 'Détectée' : 
      a.status === 'investigating' ? 'En cours' : 
      a.status === 'resolved' ? 'Résolue' : 'Ignorée'
    ]);

    autoTable(doc, {
      head: [['Type', 'Titre', 'Description', 'Confiance', 'Statut']],
      body: anomalyData,
      startY: currentY + 5,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [239, 68, 68] }
    });

    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Goulots
  if (bottlenecks.length > 0 && currentY < 250) {
    doc.setFontSize(14);
    doc.text('Goulots d\'Étranglement', 14, currentY);
    
    const bottleneckData = bottlenecks.map(b => [
      b.area,
      b.severity === 'high' ? 'Élevé' : b.severity === 'medium' ? 'Moyen' : 'Faible',
      b.priority.toString(),
      b.description.substring(0, 40) + '...',
      b.impact.substring(0, 30) + '...'
    ]);

    autoTable(doc, {
      head: [['Zone', 'Sévérité', 'Priorité', 'Description', 'Impact']],
      body: bottleneckData,
      startY: currentY + 5,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] }
    });
  }

  // Tendances
  if (session.positive_trends.length > 0 || session.attention_points.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Tendances & Points d\'Attention', 14, 22);
    
    let yPos = 35;
    
    if (session.positive_trends.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text('Tendances Positives:', 14, yPos);
      yPos += 8;
      doc.setTextColor(0);
      doc.setFontSize(10);
      session.positive_trends.forEach(t => {
        doc.text(`• ${t.text}`, 20, yPos);
        yPos += 6;
      });
      yPos += 10;
    }

    if (session.attention_points.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('Points d\'Attention:', 14, yPos);
      yPos += 8;
      doc.setTextColor(0);
      doc.setFontSize(10);
      session.attention_points.forEach(p => {
        doc.text(`• ${p.text}`, 20, yPos);
        yPos += 6;
      });
    }
  }

  doc.save(`diagnostic-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportDiagnosticToExcel = (
  session: DiagnosticSession,
  anomalies: Anomaly[],
  bottlenecks: Bottleneck[],
  pharmacyName: string
) => {
  const wb = XLSX.utils.book_new();

  // Session sheet
  const sessionData = [{
    'Score Global': session.global_score,
    'Niveau': session.status_level,
    'Potentiel Amélioration': session.improvement_potential,
    'Score Ventes': session.sales_score,
    'Tendance Ventes': session.sales_trend,
    'Score Stock': session.stock_score,
    'Tendance Stock': session.stock_trend,
    'Score Marge': session.margin_score,
    'Tendance Marge': session.margin_trend,
    'Score Clients': session.customer_score,
    'Tendance Clients': session.customer_trend,
    'Date': format(new Date(session.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }];
  const wsSession = XLSX.utils.json_to_sheet(sessionData);
  XLSX.utils.book_append_sheet(wb, wsSession, 'Diagnostic');

  // Anomalies sheet
  const anomalyData = anomalies.map(a => ({
    'Type': a.type === 'critique' ? 'Critique' : a.type === 'warning' ? 'Attention' : 'Information',
    'Titre': a.title,
    'Description': a.description,
    'Impact': a.impact === 'high' ? 'Élevé' : a.impact === 'medium' ? 'Moyen' : 'Faible',
    'Confiance': `${a.confidence}%`,
    'Statut': a.status === 'detected' ? 'Détectée' : 
              a.status === 'investigating' ? 'En investigation' : 
              a.status === 'resolved' ? 'Résolue' : 'Ignorée',
    'Suggestions': a.suggestions.join('; '),
    'Détectée le': format(new Date(a.detected_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));
  const wsAnomalies = XLSX.utils.json_to_sheet(anomalyData);
  XLSX.utils.book_append_sheet(wb, wsAnomalies, 'Anomalies');

  // Bottlenecks sheet
  const bottleneckData = bottlenecks.map(b => ({
    'Zone': b.area,
    'Sévérité': b.severity === 'high' ? 'Élevé' : b.severity === 'medium' ? 'Moyen' : 'Faible',
    'Priorité': b.priority,
    'Description': b.description,
    'Impact': b.impact,
    'Solution Recommandée': b.recommended_solution || '-',
    'Statut': b.status === 'identified' ? 'Identifié' :
              b.status === 'analyzing' ? 'En analyse' :
              b.status === 'action_planned' ? 'Action planifiée' : 'Résolu',
    'Plan d\'Action': b.action_plan || '-',
    'Créé le': format(new Date(b.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));
  const wsBottlenecks = XLSX.utils.json_to_sheet(bottleneckData);
  XLSX.utils.book_append_sheet(wb, wsBottlenecks, 'Goulots');

  XLSX.writeFile(wb, `diagnostic-ia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportAnomaliesReport = (anomalies: Anomaly[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport des Anomalies IA', 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  const tableData = anomalies.map(a => [
    a.type === 'critique' ? 'Critique' : a.type === 'warning' ? 'Attention' : 'Info',
    a.title,
    `${a.confidence}%`,
    a.impact === 'high' ? 'Élevé' : a.impact === 'medium' ? 'Moyen' : 'Faible',
    a.status === 'detected' ? 'Détectée' : 
    a.status === 'investigating' ? 'Investigation' : 
    a.status === 'resolved' ? 'Résolue' : 'Ignorée',
    format(new Date(a.detected_at), 'dd/MM/yyyy', { locale: fr })
  ]);

  autoTable(doc, {
    head: [['Type', 'Titre', 'Confiance', 'Impact', 'Statut', 'Date']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [239, 68, 68] }
  });

  doc.save(`anomalies-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportBottlenecksReport = (bottlenecks: Bottleneck[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport des Goulots d\'Étranglement', 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  const tableData = bottlenecks.map(b => [
    b.area,
    b.severity === 'high' ? 'Élevé' : b.severity === 'medium' ? 'Moyen' : 'Faible',
    b.priority.toString(),
    b.description.substring(0, 40) + '...',
    b.status === 'identified' ? 'Identifié' :
    b.status === 'analyzing' ? 'Analyse' :
    b.status === 'action_planned' ? 'Planifié' : 'Résolu'
  ]);

  autoTable(doc, {
    head: [['Zone', 'Sévérité', 'Priorité', 'Description', 'Statut']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [245, 158, 11] }
  });

  doc.save(`goulots-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateActionPlanPDF = (
  bottlenecks: Bottleneck[],
  pharmacyName: string
) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Plan d\'Action', 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  let yPos = 45;

  // Filter bottlenecks with action plans
  const actionableBottlenecks = bottlenecks.filter(b => b.action_plan || b.recommended_solution);

  if (actionableBottlenecks.length === 0) {
    doc.setFontSize(12);
    doc.text('Aucun plan d\'action défini. Veuillez analyser les goulots d\'étranglement.', 14, yPos);
  } else {
    actionableBottlenecks.forEach((b, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text(`${index + 1}. ${b.area}`, 14, yPos);
      yPos += 8;

      doc.setTextColor(0);
      doc.setFontSize(10);
      
      doc.text(`Priorité: ${b.priority} | Sévérité: ${b.severity === 'high' ? 'Élevé' : b.severity === 'medium' ? 'Moyen' : 'Faible'}`, 14, yPos);
      yPos += 6;
      
      doc.text(`Description: ${b.description}`, 14, yPos);
      yPos += 6;
      
      doc.text(`Impact: ${b.impact}`, 14, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setTextColor(34, 197, 94);
      doc.text('Action à entreprendre:', 14, yPos);
      yPos += 6;
      
      doc.setTextColor(0);
      doc.setFontSize(10);
      const actionText = b.action_plan || b.recommended_solution || 'Non défini';
      const actionLines = doc.splitTextToSize(actionText, 180);
      actionLines.forEach((line: string) => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      yPos += 10;
    });
  }

  doc.save(`plan-action-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

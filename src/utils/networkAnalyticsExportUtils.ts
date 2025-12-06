import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  AnalyticsMetric, 
  NetworkInsight, 
  HeatmapData, 
  TimeSeriesData,
  CollaborationStats 
} from '@/hooks/useNetworkAdvancedAnalytics';
import type { ExportOptions } from '@/components/dashboard/modules/chat/dialogs/AnalyticsExportDialog';

interface ExportData {
  metrics: AnalyticsMetric[];
  insights: NetworkInsight[];
  heatmapData: HeatmapData[];
  timeSeriesData: TimeSeriesData[];
  collaborationStats: CollaborationStats | null;
}

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateStr;
  }
};

const getTrendLabel = (trend: string): string => {
  switch (trend) {
    case 'up': return '↑ Hausse';
    case 'down': return '↓ Baisse';
    default: return '→ Stable';
  }
};

const getImpactLabel = (impact: string): string => {
  switch (impact) {
    case 'positive': return 'Positif';
    case 'negative': return 'Négatif';
    default: return 'Neutre';
  }
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'performance': return 'Performance';
    case 'usage': return 'Utilisation';
    case 'efficiency': return 'Efficacité';
    case 'growth': return 'Croissance';
    default: return type;
  }
};

export const exportNetworkAnalyticsToExcel = (
  data: ExportData,
  options: ExportOptions,
  filename: string = 'analytics-reseau'
) => {
  const workbook = XLSX.utils.book_new();

  // Metrics sheet
  if (options.includeMetrics && data.metrics.length > 0) {
    const metricsData = data.metrics.map(m => ({
      'Métrique': m.name,
      'Valeur': `${m.value}${m.unit || ''}`,
      'Variation': `${m.change > 0 ? '+' : ''}${m.change}%`,
      'Tendance': getTrendLabel(m.trend),
      'Cible': m.target ? `${m.target}${m.unit || ''}` : '-',
      'Catégorie': m.category
    }));
    const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Métriques KPI');
  }

  // Insights sheet
  if (options.includeInsights && data.insights.length > 0) {
    const insightsData = data.insights.map(i => ({
      'Titre': i.title,
      'Type': getTypeLabel(i.type),
      'Description': i.description || '',
      'Impact': getImpactLabel(i.impact),
      'Confiance': `${Math.round(i.confidence * 100)}%`,
      'Variation': i.metric_change ? `${i.metric_change > 0 ? '+' : ''}${i.metric_change}%` : '-',
      'Officines concernées': i.pharmacies_involved.length,
      'Appliqué': i.is_applied ? 'Oui' : 'Non',
      'Date': formatDate(i.created_at)
    }));
    const insightsSheet = XLSX.utils.json_to_sheet(insightsData);
    XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights');
  }

  // Heatmap sheet
  if (options.includeHeatmap && data.heatmapData.length > 0) {
    const heatmapDataExport = data.heatmapData.map(h => ({
      'Pharmacie': h.pharmacy_name,
      'Score Activité': h.activity_score.toFixed(1),
      'Score Collaboration': h.collaboration_score.toFixed(1),
      'Score Efficacité': h.efficiency_score.toFixed(1),
      'Score Global': h.overall_score.toFixed(1),
      'Messages': h.messages_count || 0,
      'Collaborations': h.collaborations_count || 0
    }));
    const heatmapSheet = XLSX.utils.json_to_sheet(heatmapDataExport);
    XLSX.utils.book_append_sheet(workbook, heatmapSheet, 'Carte de Chaleur');
  }

  // Time series sheet
  if (options.includeTimeSeries && data.timeSeriesData.length > 0) {
    const timeSeriesDataExport = data.timeSeriesData.map(t => ({
      'Date': format(new Date(t.timestamp), 'dd/MM/yyyy', { locale: fr }),
      'Messages': t.messages,
      'Utilisateurs actifs': t.active_users,
      'Collaborations': t.collaborations,
      'Temps de réponse (min)': t.response_time.toFixed(1)
    }));
    const timeSeriesSheet = XLSX.utils.json_to_sheet(timeSeriesDataExport);
    XLSX.utils.book_append_sheet(workbook, timeSeriesSheet, 'Données Temporelles');
  }

  // Collaboration sheet
  if (options.includeCollaboration && data.collaborationStats) {
    if (data.collaborationStats.activeProjects.length > 0) {
      const projectsData = data.collaborationStats.activeProjects.map(p => ({
        'Projet': p.name,
        'Participants': p.participant_count,
        'Statut': p.status,
        'Progression': `${p.progress}%`
      }));
      const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
      XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projets Collaboratifs');
    }

    if (data.collaborationStats.pharmacyEngagement.length > 0) {
      const engagementData = data.collaborationStats.pharmacyEngagement.map(e => ({
        'Pharmacie': e.pharmacy_name,
        'Taux d\'engagement': `${e.engagement_rate}%`
      }));
      const engagementSheet = XLSX.utils.json_to_sheet(engagementData);
      XLSX.utils.book_append_sheet(workbook, engagementSheet, 'Engagement Officines');
    }
  }

  // Generate file
  const timestamp = format(new Date(), 'yyyyMMdd-HHmm');
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};

export const exportNetworkAnalyticsToPDF = (
  data: ExportData,
  options: ExportOptions,
  filename: string = 'analytics-reseau'
) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text('Analytics Réseau - Rapport', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, yPosition);
  yPosition += 15;

  // Metrics section
  if (options.includeMetrics && data.metrics.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('Métriques KPI', 14, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Métrique', 'Valeur', 'Variation', 'Tendance', 'Cible']],
      body: data.metrics.map(m => [
        m.name,
        `${m.value}${m.unit || ''}`,
        `${m.change > 0 ? '+' : ''}${m.change}%`,
        getTrendLabel(m.trend),
        m.target ? `${m.target}${m.unit || ''}` : '-'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Insights section
  if (options.includeInsights && data.insights.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('Insights', 14, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Titre', 'Type', 'Impact', 'Confiance', 'Variation']],
      body: data.insights.map(i => [
        i.title,
        getTypeLabel(i.type),
        getImpactLabel(i.impact),
        `${Math.round(i.confidence * 100)}%`,
        i.metric_change ? `${i.metric_change > 0 ? '+' : ''}${i.metric_change}%` : '-'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [234, 179, 8] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 60 }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Heatmap section
  if (options.includeHeatmap && data.heatmapData.length > 0) {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('Carte de Chaleur du Réseau', 14, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Pharmacie', 'Activité', 'Collaboration', 'Efficacité', 'Score Global']],
      body: data.heatmapData.map(h => [
        h.pharmacy_name,
        `${h.activity_score.toFixed(1)}%`,
        `${h.collaboration_score.toFixed(1)}%`,
        `${h.efficiency_score.toFixed(1)}%`,
        `${h.overall_score.toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Time series section
  if (options.includeTimeSeries && data.timeSeriesData.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('Évolution Temporelle', 14, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Messages', 'Utilisateurs', 'Collaborations', 'Temps réponse']],
      body: data.timeSeriesData.map(t => [
        format(new Date(t.timestamp), 'dd/MM/yyyy', { locale: fr }),
        t.messages.toString(),
        t.active_users.toString(),
        t.collaborations.toString(),
        `${t.response_time.toFixed(1)} min`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Collaboration section
  if (options.includeCollaboration && data.collaborationStats?.activeProjects && data.collaborationStats.activeProjects.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('Projets Collaboratifs', 14, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Projet', 'Participants', 'Statut', 'Progression']],
      body: data.collaborationStats.activeProjects.map(p => [
        p.name,
        p.participant_count.toString(),
        p.status,
        `${p.progress}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 14, right: 14 }
    });
  }

  // Generate file
  const timestamp = format(new Date(), 'yyyyMMdd-HHmm');
  doc.save(`${filename}_${timestamp}.pdf`);
};

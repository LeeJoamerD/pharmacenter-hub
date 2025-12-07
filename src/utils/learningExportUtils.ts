import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LearningModel, LearningFeedback, TrainingDataset, TrainingSession, LearningMetrics } from '@/hooks/useContinuousLearning';

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    training: 'En formation',
    active: 'Actif',
    pending: 'En attente',
    error: 'Erreur',
    archived: 'Archivé',
    running: 'En cours',
    completed: 'Terminé',
    failed: 'Échoué',
    cancelled: 'Annulé'
  };
  return labels[status] || status;
};

const getFeedbackLabel = (type: string) => {
  const labels: Record<string, string> = {
    positive: 'Positif',
    mixed: 'Mitigé',
    negative: 'Négatif'
  };
  return labels[type] || type;
};

// Export models to Excel
export function exportModelsToExcel(models: LearningModel[], filename = 'modeles-apprentissage') {
  const data = models.map(m => ({
    'Nom': m.name,
    'Type': m.model_type,
    'Statut': getStatusLabel(m.status),
    'Précision (%)': m.accuracy,
    'Points de données': m.data_points,
    'Epochs': m.epochs,
    'Version': m.version,
    'Dernière formation': formatDate(m.last_training_at),
    'Prochaine formation': formatDate(m.next_training_at),
    'Fréquence': m.training_frequency
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modèles');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export models to PDF
export function exportModelsToPDF(models: LearningModel[], filename = 'modeles-apprentissage') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport des Modèles d\'Apprentissage', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  const tableData = models.map(m => [
    m.name,
    m.model_type,
    getStatusLabel(m.status),
    `${m.accuracy}%`,
    m.data_points.toLocaleString(),
    `v${m.version}`
  ]);

  autoTable(doc, {
    head: [['Nom', 'Type', 'Statut', 'Précision', 'Données', 'Version']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export feedback to Excel
export function exportFeedbackToExcel(feedback: LearningFeedback[], filename = 'feedback-apprentissage') {
  const data = feedback.map(f => ({
    'Modèle': f.model_name || '-',
    'Type': getFeedbackLabel(f.feedback_type),
    'Commentaire': f.comment || '-',
    'Utilisateur': f.user_name || '-',
    'Précision avant': f.accuracy_before ? `${f.accuracy_before}%` : '-',
    'Précision après': f.accuracy_after ? `${f.accuracy_after}%` : '-',
    'Intégré': f.impact_applied ? 'Oui' : 'Non',
    'Date': formatDate(f.created_at)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Feedback');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export feedback to PDF
export function exportFeedbackToPDF(feedback: LearningFeedback[], filename = 'feedback-apprentissage') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport des Retours Utilisateurs', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  const tableData = feedback.map(f => [
    f.model_name || '-',
    getFeedbackLabel(f.feedback_type),
    (f.comment || '-').substring(0, 50),
    f.user_name || '-',
    f.impact_applied ? 'Oui' : 'Non',
    formatDate(f.created_at)
  ]);

  autoTable(doc, {
    head: [['Modèle', 'Type', 'Commentaire', 'Utilisateur', 'Intégré', 'Date']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export datasets to Excel
export function exportDatasetsToExcel(datasets: TrainingDataset[], filename = 'datasets-apprentissage') {
  const data = datasets.map(d => ({
    'Nom': d.name,
    'Type': d.source_type,
    'Source': d.source_name || '-',
    'Enregistrements': d.records_count,
    'Qualité (%)': d.quality_score,
    'Fréquence sync': d.sync_frequency,
    'Statut sync': d.sync_status,
    'Dernière sync': formatDate(d.last_sync_at),
    'Rétention (jours)': d.retention_days
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datasets');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export training report
export function exportTrainingReportToPDF(
  metrics: LearningMetrics | null,
  models: LearningModel[],
  sessions: TrainingSession[],
  filename = 'rapport-apprentissage'
) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Rapport d\'Apprentissage Continu', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  // Metrics section
  doc.setFontSize(14);
  doc.text('Métriques Globales', 14, 45);
  
  if (metrics) {
    doc.setFontSize(10);
    doc.text(`Modèles actifs: ${metrics.totalModels}`, 14, 55);
    doc.text(`En formation: ${metrics.activeTraining}`, 14, 62);
    doc.text(`Gain précision moyen: +${metrics.avgAccuracyGain}%`, 14, 69);
    doc.text(`Données traitées: ${metrics.dataProcessed.toLocaleString()}`, 14, 76);
    doc.text(`Heures de formation: ${metrics.trainingHours}h`, 14, 83);
  }

  // Models table
  doc.setFontSize(14);
  doc.text('État des Modèles', 14, 100);

  const modelsData = models.slice(0, 10).map(m => [
    m.name,
    getStatusLabel(m.status),
    `${m.accuracy}%`,
    `${m.progress}%`,
    `v${m.version}`
  ]);

  autoTable(doc, {
    head: [['Nom', 'Statut', 'Précision', 'Progression', 'Version']],
    body: modelsData,
    startY: 105,
    styles: { fontSize: 8 }
  });

  // Recent sessions
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(14);
  doc.text('Sessions Récentes', 14, finalY + 15);

  const sessionsData = sessions.slice(0, 5).map(s => [
    formatDate(s.started_at),
    getStatusLabel(s.status),
    `${s.epochs_completed}/${s.epochs_total}`,
    s.accuracy_gain ? `+${s.accuracy_gain}%` : '-',
    s.training_time_seconds ? `${Math.round(s.training_time_seconds / 60)}min` : '-'
  ]);

  autoTable(doc, {
    head: [['Date', 'Statut', 'Epochs', 'Gain', 'Durée']],
    body: sessionsData,
    startY: finalY + 20,
    styles: { fontSize: 8 }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export complete training report to Excel
export function exportTrainingReportToExcel(
  metrics: LearningMetrics | null,
  models: LearningModel[],
  feedback: LearningFeedback[],
  datasets: TrainingDataset[],
  sessions: TrainingSession[],
  filename = 'rapport-apprentissage-complet'
) {
  const wb = XLSX.utils.book_new();

  // Metrics sheet
  if (metrics) {
    const metricsData = [
      { 'Métrique': 'Modèles actifs', 'Valeur': metrics.totalModels },
      { 'Métrique': 'En formation', 'Valeur': metrics.activeTraining },
      { 'Métrique': 'Gain précision moyen (%)', 'Valeur': metrics.avgAccuracyGain },
      { 'Métrique': 'Données traitées', 'Valeur': metrics.dataProcessed },
      { 'Métrique': 'Heures de formation', 'Valeur': metrics.trainingHours }
    ];
    const wsMetrics = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métriques');
  }

  // Models sheet
  const modelsData = models.map(m => ({
    'Nom': m.name,
    'Type': m.model_type,
    'Statut': getStatusLabel(m.status),
    'Précision (%)': m.accuracy,
    'Points de données': m.data_points,
    'Epochs': m.epochs,
    'Progression (%)': m.progress,
    'Version': m.version,
    'Dernière formation': formatDate(m.last_training_at)
  }));
  const wsModels = XLSX.utils.json_to_sheet(modelsData);
  XLSX.utils.book_append_sheet(wb, wsModels, 'Modèles');

  // Feedback sheet
  const feedbackData = feedback.map(f => ({
    'Modèle': f.model_name || '-',
    'Type': getFeedbackLabel(f.feedback_type),
    'Commentaire': f.comment || '-',
    'Utilisateur': f.user_name || '-',
    'Intégré': f.impact_applied ? 'Oui' : 'Non',
    'Date': formatDate(f.created_at)
  }));
  const wsFeedback = XLSX.utils.json_to_sheet(feedbackData);
  XLSX.utils.book_append_sheet(wb, wsFeedback, 'Feedback');

  // Datasets sheet
  const datasetsData = datasets.map(d => ({
    'Nom': d.name,
    'Type': d.source_type,
    'Enregistrements': d.records_count,
    'Qualité (%)': d.quality_score,
    'Fréquence': d.sync_frequency,
    'Dernière sync': formatDate(d.last_sync_at)
  }));
  const wsDatasets = XLSX.utils.json_to_sheet(datasetsData);
  XLSX.utils.book_append_sheet(wb, wsDatasets, 'Datasets');

  // Sessions sheet
  const sessionsData = sessions.map(s => ({
    'Date début': formatDate(s.started_at),
    'Date fin': formatDate(s.completed_at),
    'Statut': getStatusLabel(s.status),
    'Epochs': `${s.epochs_completed}/${s.epochs_total}`,
    'Précision initiale (%)': s.initial_accuracy || '-',
    'Précision finale (%)': s.final_accuracy || '-',
    'Gain (%)': s.accuracy_gain || '-',
    'Durée (min)': s.training_time_seconds ? Math.round(s.training_time_seconds / 60) : '-'
  }));
  const wsSessions = XLSX.utils.json_to_sheet(sessionsData);
  XLSX.utils.book_append_sheet(wb, wsSessions, 'Sessions');

  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AutomationWorkflow, AutomationExecution, AutomationMetrics } from '@/hooks/useAIAutomation';

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'running': return 'En cours';
    case 'completed': return 'Terminé';
    case 'failed': return 'Échec';
    case 'cancelled': return 'Annulé';
    default: return status;
  }
};

const getTriggerLabel = (triggerType: string) => {
  switch (triggerType) {
    case 'stock_low': return 'Stock bas';
    case 'stock_critical': return 'Stock critique';
    case 'expiration_near': return 'Péremption proche';
    case 'sale_completed': return 'Vente effectuée';
    case 'order_received': return 'Commande reçue';
    case 'schedule_daily': return 'Quotidien';
    case 'schedule_weekly': return 'Hebdomadaire';
    case 'schedule_monthly': return 'Mensuel';
    case 'manual': return 'Manuel';
    default: return triggerType;
  }
};

export const exportWorkflowsToPDF = (
  workflows: AutomationWorkflow[],
  metrics: AutomationMetrics,
  pharmacyName: string = 'PharmaSoft'
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text('Rapport des Workflows d\'Automatisation', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`${pharmacyName} - Généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 28, { align: 'center' });
  
  // Metrics summary
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text('Résumé', 14, 40);
  
  const metricsData = [
    ['Workflows actifs', metrics.active_workflows.toString()],
    ['Workflows inactifs', metrics.inactive_workflows.toString()],
    ['Exécutions 24h', metrics.executions_24h.toString()],
    ['Taux de succès', `${metrics.success_rate}%`],
    ['Temps moyen', `${metrics.avg_duration_ms}ms`],
    ['Templates', metrics.total_templates.toString()]
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
  
  // Workflows table
  doc.setFontSize(12);
  doc.text('Liste des Workflows', 14, (doc as any).lastAutoTable.finalY + 15);
  
  const tableData = workflows.map(wf => [
    wf.name.substring(0, 30) + (wf.name.length > 30 ? '...' : ''),
    wf.category,
    getTriggerLabel(wf.trigger_type),
    wf.is_active ? 'Actif' : 'Inactif',
    `#${wf.priority}`,
    wf.execution_count.toString(),
    `${wf.success_count}/${wf.failure_count}`
  ]);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Nom', 'Catégorie', 'Déclencheur', 'Statut', 'Priorité', 'Exécutions', 'S/E']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
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
  
  doc.save(`workflows-automatisation-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportWorkflowsToExcel = (
  workflows: AutomationWorkflow[],
  executions: AutomationExecution[],
  metrics: AutomationMetrics
): void => {
  // Prepare workflows data
  const wfData = workflows.map(wf => ({
    'Nom': wf.name,
    'Description': wf.description || '-',
    'Catégorie': wf.category,
    'Déclencheur': getTriggerLabel(wf.trigger_type),
    'Statut': wf.is_active ? 'Actif' : 'Inactif',
    'Priorité': wf.priority,
    'Exécutions': wf.execution_count,
    'Succès': wf.success_count,
    'Échecs': wf.failure_count,
    'Temps moyen (ms)': wf.avg_execution_time_ms,
    'Dernière exécution': formatDate(wf.last_execution_at),
    'Créé le': formatDate(wf.created_at)
  }));
  
  // Prepare executions data
  const execData = executions.map(exec => ({
    'Workflow': exec.workflow?.name || '-',
    'Statut': getStatusLabel(exec.status),
    'Démarré le': formatDate(exec.started_at),
    'Terminé le': formatDate(exec.completed_at),
    'Durée (ms)': exec.duration_ms || '-',
    'Erreur': exec.error_message || '-'
  }));
  
  // Prepare metrics data
  const metricsData = [
    { 'Métrique': 'Workflows actifs', 'Valeur': metrics.active_workflows },
    { 'Métrique': 'Workflows inactifs', 'Valeur': metrics.inactive_workflows },
    { 'Métrique': 'Exécutions 24h', 'Valeur': metrics.executions_24h },
    { 'Métrique': 'Succès 24h', 'Valeur': metrics.successful_24h },
    { 'Métrique': 'Échecs 24h', 'Valeur': metrics.failed_24h },
    { 'Métrique': 'Taux de succès (%)', 'Valeur': metrics.success_rate },
    { 'Métrique': 'Temps moyen (ms)', 'Valeur': metrics.avg_duration_ms },
    { 'Métrique': 'Templates disponibles', 'Valeur': metrics.total_templates }
  ];
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add sheets
  const wsWorkflows = XLSX.utils.json_to_sheet(wfData);
  XLSX.utils.book_append_sheet(wb, wsWorkflows, 'Workflows');
  
  const wsExecutions = XLSX.utils.json_to_sheet(execData);
  XLSX.utils.book_append_sheet(wb, wsExecutions, 'Exécutions');
  
  const wsMetrics = XLSX.utils.json_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métriques');
  
  // Save file
  XLSX.writeFile(wb, `workflows-automatisation-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportExecutionLogToPDF = (
  execution: AutomationExecution,
  workflowName: string,
  pharmacyName: string = 'PharmaSoft'
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41);
  doc.text('Log d\'Exécution', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Workflow: ${workflowName}`, pageWidth / 2, 28, { align: 'center' });
  doc.text(`${pharmacyName} - ${formatDate(execution.started_at)}`, pageWidth / 2, 34, { align: 'center' });
  
  // Execution info
  doc.setFontSize(11);
  doc.setTextColor(33, 37, 41);
  doc.text(`Statut: ${getStatusLabel(execution.status)}`, 14, 48);
  doc.text(`Durée: ${execution.duration_ms || 0}ms`, 14, 55);
  
  if (execution.error_message) {
    doc.setTextColor(220, 53, 69);
    doc.text(`Erreur: ${execution.error_message}`, 14, 62);
  }
  
  // Log entries
  doc.setTextColor(33, 37, 41);
  doc.setFontSize(12);
  doc.text('Journal d\'exécution', 14, 75);
  
  const logData = execution.execution_log.map(entry => [
    formatDate(entry.timestamp),
    entry.type.toUpperCase(),
    entry.message
  ]);
  
  autoTable(doc, {
    startY: 80,
    head: [['Horodatage', 'Type', 'Message']],
    body: logData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });
  
  doc.save(`execution-log-${execution.id.substring(0, 8)}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AIProviderConnection, AIDataSource, AIWebhookEvent, AIIntegrationMetrics } from '@/hooks/useAIIntegrations';

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
};

// Export Providers to PDF
export function exportProvidersToPDF(providers: AIProviderConnection[], pharmacyName: string = 'PharmaSoft') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Connecteurs IA', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 28);
  
  const tableData = providers.map(p => [
    p.provider_name,
    p.provider_type,
    p.model_name || '-',
    p.status,
    p.is_active ? 'Actif' : 'Inactif',
    p.total_calls.toString(),
    `${p.avg_latency_ms?.toFixed(0) || 0}ms`,
    formatDate(p.last_connection_at),
  ]);

  autoTable(doc, {
    head: [['Nom', 'Type', 'Modèle', 'Statut', 'État', 'Appels', 'Latence', 'Dernière connexion']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`connecteurs-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export Providers to Excel
export function exportProvidersToExcel(providers: AIProviderConnection[]) {
  const data = providers.map(p => ({
    'Nom': p.provider_name,
    'Type': p.provider_type,
    'Modèle': p.model_name || '-',
    'Endpoint': p.api_endpoint || '-',
    'Statut': p.status,
    'Actif': p.is_active ? 'Oui' : 'Non',
    'Par défaut': p.is_default ? 'Oui' : 'Non',
    'Appels totaux': p.total_calls,
    'Appels réussis': p.success_calls,
    'Appels échoués': p.failed_calls,
    'Latence moyenne (ms)': p.avg_latency_ms?.toFixed(2) || 0,
    'Max tokens': p.max_tokens,
    'Temperature': p.temperature,
    'Dernière connexion': formatDate(p.last_connection_at),
    'Créé le': formatDate(p.created_at),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Connecteurs IA');
  XLSX.writeFile(wb, `connecteurs-ia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export Data Sources to PDF
export function exportDataSourcesToPDF(sources: AIDataSource[], pharmacyName: string = 'PharmaSoft') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Sources de Données IA', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 28);
  
  const tableData = sources.map(s => [
    s.source_name,
    s.source_type,
    s.sync_frequency,
    s.sync_status,
    s.records_count.toString(),
    `${s.data_size_mb?.toFixed(2) || 0} MB`,
    s.is_active ? 'Actif' : 'Inactif',
    formatDate(s.last_sync_at),
  ]);

  autoTable(doc, {
    head: [['Nom', 'Type', 'Fréquence', 'Statut', 'Enregistrements', 'Taille', 'État', 'Dernière sync']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 197, 94] },
  });

  doc.save(`sources-donnees-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export Data Sources to Excel
export function exportDataSourcesToExcel(sources: AIDataSource[]) {
  const data = sources.map(s => ({
    'Nom': s.source_name,
    'Type': s.source_type,
    'Description': s.description || '-',
    'Fréquence sync': s.sync_frequency,
    'Statut sync': s.sync_status,
    'Enregistrements': s.records_count,
    'Taille (MB)': s.data_size_mb?.toFixed(2) || 0,
    'Actif': s.is_active ? 'Oui' : 'Non',
    'Chiffré': s.is_encrypted ? 'Oui' : 'Non',
    'Rétention (jours)': s.retention_days,
    'Dernière sync': formatDate(s.last_sync_at),
    'Prochaine sync': formatDate(s.next_sync_at),
    'Erreur': s.sync_error_message || '-',
    'Créé le': formatDate(s.created_at),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sources de Données');
  XLSX.writeFile(wb, `sources-donnees-ia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export Webhook Events to PDF
export function exportEventsToPDF(events: AIWebhookEvent[], pharmacyName: string = 'PharmaSoft') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Logs des Événements IA', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 28);
  
  const tableData = events.slice(0, 50).map(e => [
    e.event_type,
    e.source,
    e.direction,
    e.status,
    e.status_code?.toString() || '-',
    e.latency_ms ? `${e.latency_ms}ms` : '-',
    formatDate(e.created_at),
  ]);

  autoTable(doc, {
    head: [['Type', 'Source', 'Direction', 'Statut', 'Code', 'Latence', 'Date']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [168, 85, 247] },
  });

  doc.save(`logs-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export Webhook Events to Excel
export function exportEventsToExcel(events: AIWebhookEvent[]) {
  const data = events.map(e => ({
    'Type': e.event_type,
    'Source': e.source,
    'Direction': e.direction,
    'Statut': e.status,
    'Code HTTP': e.status_code || '-',
    'Latence (ms)': e.latency_ms || '-',
    'Erreur': e.error_message || '-',
    'Payload': JSON.stringify(e.payload).substring(0, 100),
    'Traité le': formatDate(e.processed_at),
    'Créé le': formatDate(e.created_at),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Événements IA');
  XLSX.writeFile(wb, `logs-ia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export Full Report to PDF
export function exportFullReportToPDF(
  metrics: AIIntegrationMetrics | null,
  providers: AIProviderConnection[],
  sources: AIDataSource[],
  events: AIWebhookEvent[],
  pharmacyName: string = 'PharmaSoft'
) {
  const doc = new jsPDF();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Rapport Intégrations IA', 14, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`${pharmacyName} - Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, yPos);
  yPos += 15;

  // Metrics Summary
  if (metrics) {
    doc.setFontSize(14);
    doc.text('Résumé des Métriques', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Connecteurs actifs: ${metrics.active_providers}/${metrics.total_providers}`, 14, yPos);
    yPos += 6;
    doc.text(`Sources de données: ${metrics.active_sources}/${metrics.total_sources}`, 14, yPos);
    yPos += 6;
    doc.text(`Appels API (24h): ${metrics.api_calls_24h}`, 14, yPos);
    yPos += 6;
    doc.text(`Taux de succès: ${metrics.success_rate}%`, 14, yPos);
    yPos += 6;
    doc.text(`Latence moyenne: ${metrics.avg_latency_ms?.toFixed(0) || 0}ms`, 14, yPos);
    yPos += 6;
    doc.text(`Total enregistrements: ${metrics.total_records}`, 14, yPos);
    yPos += 15;
  }

  // Providers Table
  doc.setFontSize(14);
  doc.text('Connecteurs IA', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    head: [['Nom', 'Type', 'Statut', 'Appels', 'Latence']],
    body: providers.slice(0, 10).map(p => [
      p.provider_name,
      p.provider_type,
      p.status,
      p.total_calls.toString(),
      `${p.avg_latency_ms?.toFixed(0) || 0}ms`,
    ]),
    startY: yPos,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`rapport-integrations-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export Full Report to Excel
export function exportFullReportToExcel(
  metrics: AIIntegrationMetrics | null,
  providers: AIProviderConnection[],
  sources: AIDataSource[],
  events: AIWebhookEvent[]
) {
  const wb = XLSX.utils.book_new();

  // Metrics sheet
  if (metrics) {
    const metricsData = [
      { 'Métrique': 'Connecteurs actifs', 'Valeur': metrics.active_providers },
      { 'Métrique': 'Total connecteurs', 'Valeur': metrics.total_providers },
      { 'Métrique': 'Sources actives', 'Valeur': metrics.active_sources },
      { 'Métrique': 'Total sources', 'Valeur': metrics.total_sources },
      { 'Métrique': 'Appels API (24h)', 'Valeur': metrics.api_calls_24h },
      { 'Métrique': 'Taux de succès (%)', 'Valeur': metrics.success_rate },
      { 'Métrique': 'Latence moyenne (ms)', 'Valeur': metrics.avg_latency_ms },
      { 'Métrique': 'Total enregistrements', 'Valeur': metrics.total_records },
      { 'Métrique': 'Syncs en attente', 'Valeur': metrics.pending_syncs },
      { 'Métrique': 'Erreurs (24h)', 'Valeur': metrics.errors_24h },
    ];
    const wsMetrics = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métriques');
  }

  // Providers sheet
  const providersData = providers.map(p => ({
    'Nom': p.provider_name,
    'Type': p.provider_type,
    'Modèle': p.model_name || '-',
    'Statut': p.status,
    'Actif': p.is_active ? 'Oui' : 'Non',
    'Appels totaux': p.total_calls,
    'Latence (ms)': p.avg_latency_ms?.toFixed(2) || 0,
  }));
  const wsProviders = XLSX.utils.json_to_sheet(providersData);
  XLSX.utils.book_append_sheet(wb, wsProviders, 'Connecteurs');

  // Sources sheet
  const sourcesData = sources.map(s => ({
    'Nom': s.source_name,
    'Type': s.source_type,
    'Fréquence': s.sync_frequency,
    'Statut': s.sync_status,
    'Enregistrements': s.records_count,
    'Actif': s.is_active ? 'Oui' : 'Non',
  }));
  const wsSources = XLSX.utils.json_to_sheet(sourcesData);
  XLSX.utils.book_append_sheet(wb, wsSources, 'Sources');

  // Events sheet
  const eventsData = events.slice(0, 100).map(e => ({
    'Type': e.event_type,
    'Source': e.source,
    'Direction': e.direction,
    'Statut': e.status,
    'Latence (ms)': e.latency_ms || '-',
    'Date': formatDate(e.created_at),
  }));
  const wsEvents = XLSX.utils.json_to_sheet(eventsData);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Événements');

  XLSX.writeFile(wb, `rapport-integrations-ia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

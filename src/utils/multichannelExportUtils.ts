import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MultichannelConnector, AutomationRule, ChannelAnalytics } from '@/hooks/useNetworkMultichannel';

// Helper function for date formatting
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return '-';
  }
};

// Channel type labels
const channelTypeLabels: Record<string, string> = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
  teams: 'Microsoft Teams',
  slack: 'Slack',
  webhook: 'Webhook',
  telegram: 'Telegram',
  messenger: 'Messenger'
};

// Status labels
const statusLabels: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  error: 'Erreur',
  pending: 'En attente'
};

// Rule type labels
const ruleTypeLabels: Record<string, string> = {
  routing: 'Routage',
  auto_response: 'Réponse auto',
  escalation: 'Escalade',
  schedule: 'Planification',
  fallback: 'Fallback'
};

// Export connectors to Excel
export const exportConnectorsToExcel = (connectors: MultichannelConnector[], filename = 'canaux-multichannel'): void => {
  const data = connectors.map(connector => ({
    'Nom': connector.name,
    'Type': channelTypeLabels[connector.channel_type] || connector.channel_type,
    'Fournisseur': connector.provider,
    'Statut': statusLabels[connector.status] || connector.status,
    'Messages envoyés': connector.messages_sent,
    'Messages reçus': connector.messages_received,
    'Taux de réponse (%)': connector.response_rate,
    'Dernière utilisation': formatDate(connector.last_used_at),
    'Partagé réseau': connector.is_network_shared ? 'Oui' : 'Non',
    'Priorité': connector.priority_order + 1,
    'Créé le': formatDate(connector.created_at)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Canaux');
  
  // Auto-adjust column widths
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export connectors to PDF
export const exportConnectorsToPDF = (connectors: MultichannelConnector[], filename = 'canaux-multichannel'): void => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Rapport des Canaux Multi-Canaux', 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  // Table
  const tableData = connectors.map(connector => [
    connector.name,
    channelTypeLabels[connector.channel_type] || connector.channel_type,
    statusLabels[connector.status] || connector.status,
    connector.messages_sent.toString(),
    `${connector.response_rate}%`,
    connector.is_network_shared ? 'Oui' : 'Non'
  ]);

  autoTable(doc, {
    head: [['Nom', 'Type', 'Statut', 'Messages', 'Taux réponse', 'Partagé']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export automation rules to Excel
export const exportRulesToExcel = (rules: AutomationRule[], filename = 'regles-automatisation'): void => {
  const data = rules.map(rule => ({
    'Nom': rule.name,
    'Description': rule.description || '-',
    'Type': ruleTypeLabels[rule.rule_type] || rule.rule_type,
    'Statut': rule.is_active ? 'Actif' : 'Inactif',
    'Exécutions': rule.execution_count,
    'Dernière exécution': formatDate(rule.last_executed_at),
    'Règle réseau': rule.is_network_rule ? 'Oui' : 'Non',
    'Priorité': rule.priority_order + 1,
    'Créé le': formatDate(rule.created_at)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Règles');

  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export automation rules to PDF
export const exportRulesToPDF = (rules: AutomationRule[], filename = 'regles-automatisation'): void => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport des Règles d\'Automatisation', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = rules.map(rule => [
    rule.name,
    ruleTypeLabels[rule.rule_type] || rule.rule_type,
    rule.is_active ? 'Actif' : 'Inactif',
    rule.execution_count.toString(),
    rule.is_network_rule ? 'Oui' : 'Non'
  ]);

  autoTable(doc, {
    head: [['Nom', 'Type', 'Statut', 'Exécutions', 'Réseau']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export analytics to Excel
export const exportAnalyticsToExcel = (analytics: ChannelAnalytics[], filename = 'analytics-multichannel'): void => {
  const data = analytics.map(item => ({
    'Période début': formatDate(item.period_start),
    'Période fin': formatDate(item.period_end),
    'Messages envoyés': item.messages_sent,
    'Messages reçus': item.messages_received,
    'Messages livrés': item.messages_delivered,
    'Messages échoués': item.messages_failed,
    'Temps réponse moyen (ms)': item.avg_response_time_ms,
    'Taux de réponse (%)': item.response_rate,
    'Taux d\'engagement (%)': item.engagement_rate,
    'Coût estimé': item.cost_estimate
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Analytics');

  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export analytics to PDF
export const exportAnalyticsToPDF = (analytics: ChannelAnalytics[], filename = 'analytics-multichannel'): void => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(18);
  doc.text('Rapport Analytics Multi-Canaux', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = analytics.map(item => [
    formatDate(item.period_start),
    item.messages_sent.toString(),
    item.messages_delivered.toString(),
    item.messages_failed.toString(),
    `${item.response_rate}%`,
    `${item.engagement_rate}%`
  ]);

  autoTable(doc, {
    head: [['Période', 'Envoyés', 'Livrés', 'Échoués', 'Taux réponse', 'Engagement']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export full multichannel report
export const exportFullMultichannelReport = (
  connectors: MultichannelConnector[],
  rules: AutomationRule[],
  analytics: ChannelAnalytics[],
  format: 'excel' | 'pdf' = 'excel'
): void => {
  if (format === 'excel') {
    const wb = XLSX.utils.book_new();
    
    // Connectors sheet
    const connectorsData = connectors.map(c => ({
      'Nom': c.name,
      'Type': channelTypeLabels[c.channel_type] || c.channel_type,
      'Statut': statusLabels[c.status] || c.status,
      'Messages': c.messages_sent,
      'Taux réponse': `${c.response_rate}%`
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(connectorsData), 'Canaux');
    
    // Rules sheet
    const rulesData = rules.map(r => ({
      'Nom': r.name,
      'Type': ruleTypeLabels[r.rule_type] || r.rule_type,
      'Actif': r.is_active ? 'Oui' : 'Non',
      'Exécutions': r.execution_count
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rulesData), 'Règles');
    
    // Analytics sheet
    const analyticsData = analytics.map(a => ({
      'Période': formatDate(a.period_start),
      'Envoyés': a.messages_sent,
      'Livrés': a.messages_delivered,
      'Taux réponse': `${a.response_rate}%`
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analyticsData), 'Analytics');
    
    XLSX.writeFile(wb, `rapport-multichannel-complet-${formatDate(new Date().toISOString())}.xlsx`);
  } else {
    const doc = new jsPDF();
    let yPos = 20;
    
    doc.setFontSize(18);
    doc.text('Rapport Complet Multi-Canaux', 14, yPos);
    yPos += 15;
    
    // Connectors section
    doc.setFontSize(14);
    doc.text('Canaux de Communication', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      head: [['Nom', 'Type', 'Statut', 'Messages']],
      body: connectors.map(c => [
        c.name,
        channelTypeLabels[c.channel_type] || c.channel_type,
        statusLabels[c.status] || c.status,
        c.messages_sent.toString()
      ]),
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`rapport-multichannel-complet-${formatDate(new Date().toISOString())}.pdf`);
  }
};

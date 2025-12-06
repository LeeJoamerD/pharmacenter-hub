import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SecurityEvent, EncryptionConfig, ComplianceReport, SecurityAccessRule, ComplianceStatus } from '@/hooks/useNetworkSecurity';

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return 'N/A';
  }
};

// Security Events Export
export const exportSecurityEventsToExcel = (events: SecurityEvent[], filename = 'evenements-securite') => {
  const data = events.map(event => ({
    'Date': formatDate(event.timestamp),
    'Type': event.event_type,
    'Sévérité': event.severity.toUpperCase(),
    'Utilisateur': event.user,
    'Description': event.description,
    'Adresse IP': event.ip_address,
    'Statut': event.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Événements');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportSecurityEventsToPDF = (events: SecurityEvent[], filename = 'evenements-securite') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport des Événements de Sécurité', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = events.slice(0, 50).map(event => [
    formatDate(event.timestamp),
    event.event_type,
    event.severity.toUpperCase(),
    event.user.slice(0, 20),
    event.description.slice(0, 40),
    event.status,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Date', 'Type', 'Sévérité', 'Utilisateur', 'Description', 'Statut']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Compliance Reports Export
export const exportComplianceReportsToPDF = (reports: ComplianceReport[], filename = 'rapports-conformite') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapports de Conformité', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = reports.map(report => [
    report.report_type,
    report.period,
    report.status === 'completed' ? 'Terminé' : report.status === 'in_progress' ? 'En cours' : 'En attente',
    report.compliance_score ? `${report.compliance_score.toFixed(1)}%` : '-',
    formatDate(report.created_at),
    report.file_size_mb ? `${report.file_size_mb.toFixed(1)} MB` : '-',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Type', 'Période', 'Statut', 'Score', 'Date', 'Taille']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [39, 174, 96] },
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Access Rules Export
export const exportAccessRulesToExcel = (rules: SecurityAccessRule[], filename = 'regles-acces') => {
  const data = rules.map(rule => ({
    'Nom': rule.rule_name,
    'Type': rule.rule_type,
    'Ressource Cible': rule.target_resource || 'Toutes',
    'Permissions': rule.permissions.join(', '),
    'Priorité': rule.priority,
    'Actif': rule.is_active ? 'Oui' : 'Non',
    'Expiration': rule.expires_at ? formatDate(rule.expires_at) : 'Jamais',
    'Créé le': formatDate(rule.created_at),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Règles');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Encryption Status Export
export const exportEncryptionStatusToPDF = (configs: EncryptionConfig[], filename = 'statut-chiffrement') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport de Chiffrement', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = configs.map(config => [
    config.resource_name,
    config.encryption_type,
    config.algorithm,
    `${config.key_rotation_days} jours`,
    config.status === 'active' ? 'Actif' : 'Inactif',
    formatDate(config.last_rotation_at),
    config.auto_rotation_enabled ? 'Oui' : 'Non',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Ressource', 'Type', 'Algorithme', 'Rotation', 'Statut', 'Dernière rotation', 'Auto']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [155, 89, 182] },
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Compliance Status Export
export const exportComplianceStatusToPDF = (statuses: ComplianceStatus[], filename = 'statut-conformite') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Statut de Conformité Réglementaire', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = statuses.map(status => [
    status.name,
    status.code,
    status.status === 'compliant' ? 'Conforme' : status.status === 'pending' ? 'En cours' : 'Non conforme',
    `${status.score}%`,
    status.description,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Réglementation', 'Code', 'Statut', 'Score', 'Description']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 204, 113] },
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Full Security Audit Report
export const exportFullSecurityAuditToPDF = (
  events: SecurityEvent[],
  configs: EncryptionConfig[],
  reports: ComplianceReport[],
  rules: SecurityAccessRule[],
  statuses: ComplianceStatus[],
  metrics: { score: number; activeAlerts: number; activeSessions: number },
  filename = 'audit-securite-complet'
) => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Title
  doc.setFontSize(20);
  doc.text('Rapport d\'Audit de Sécurité', 14, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, yPosition);
  yPosition += 15;

  // Summary Section
  doc.setFontSize(14);
  doc.text('Résumé Exécutif', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(`Score de Sécurité: ${metrics.score}%`, 14, yPosition);
  yPosition += 6;
  doc.text(`Alertes Actives: ${metrics.activeAlerts}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Sessions Actives: ${metrics.activeSessions}`, 14, yPosition);
  yPosition += 15;

  // Compliance Summary
  doc.setFontSize(14);
  doc.text('Conformité Réglementaire', 14, yPosition);
  yPosition += 8;

  const complianceData = statuses.map(s => [
    s.name,
    s.status === 'compliant' ? 'Conforme' : s.status === 'pending' ? 'En cours' : 'Non conforme',
    `${s.score}%`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Réglementation', 'Statut', 'Score']],
    body: complianceData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [52, 73, 94] },
    margin: { left: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Recent Events
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.text('Événements de Sécurité Récents', 14, yPosition);
  yPosition += 8;

  const eventsData = events.slice(0, 10).map(e => [
    formatDate(e.timestamp),
    e.event_type,
    e.severity.toUpperCase(),
    e.status
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Date', 'Type', 'Sévérité', 'Statut']],
    body: eventsData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [231, 76, 60] },
    margin: { left: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Encryption Status
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.text('État du Chiffrement', 14, yPosition);
  yPosition += 8;

  const encryptionData = configs.map(c => [
    c.resource_name,
    c.algorithm,
    c.status === 'active' ? 'Actif' : 'Inactif',
    c.auto_rotation_enabled ? 'Oui' : 'Non'
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Ressource', 'Algorithme', 'Statut', 'Rotation Auto']],
    body: encryptionData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [155, 89, 182] },
    margin: { left: 14 },
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

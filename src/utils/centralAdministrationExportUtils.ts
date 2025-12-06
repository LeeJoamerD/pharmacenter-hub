import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
export interface PharmacyExportData {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  city?: string;
  region?: string;
  country?: string;
  status: string;
  type?: string;
  user_count: number;
  admin_count: number;
  last_access?: string;
  created_at: string;
}

export interface AuditLogExportData {
  id: string;
  action_type: string;
  action_category: string;
  target_type?: string;
  target_name?: string;
  severity: string;
  created_at: string;
  details?: any;
}

export interface ChannelExportData {
  id: string;
  name: string;
  description?: string;
  type: string;
  is_system: boolean;
  is_public: boolean;
  category?: string;
  member_count: number;
  message_count: number;
  created_at: string;
}

export interface ConfigExportData {
  key: string;
  value: string;
  type: string;
  category: string;
}

// Export pharmacies to Excel
export const exportPharmaciesToExcel = (pharmacies: PharmacyExportData[], filename?: string) => {
  const data = pharmacies.map(p => ({
    'Nom': p.name,
    'Code': p.code || 'N/A',
    'Email': p.email || 'N/A',
    'Téléphone': p.phone || 'N/A',
    'Ville': p.city || 'N/A',
    'Région': p.region || 'N/A',
    'Pays': p.country || 'N/A',
    'Statut': p.status,
    'Type': p.type || 'standard',
    'Utilisateurs': p.user_count,
    'Admins': p.admin_count,
    'Dernier accès': p.last_access ? format(new Date(p.last_access), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'N/A',
    'Date création': format(new Date(p.created_at), 'dd/MM/yyyy', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pharmacies');
  
  const colWidths = [
    { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 15 }
  ];
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, filename || `pharmacies_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export pharmacies to PDF
export const exportPharmaciesToPDF = (pharmacies: PharmacyExportData[], filename?: string) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(16);
  doc.text('Liste des Pharmacies du Réseau', 14, 20);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 27);
  
  const tableData = pharmacies.map(p => [
    p.name,
    p.code || 'N/A',
    p.city || 'N/A',
    p.region || 'N/A',
    p.status,
    String(p.user_count),
    p.last_access ? format(new Date(p.last_access), 'dd/MM/yyyy', { locale: fr }) : 'N/A'
  ]);

  autoTable(doc, {
    head: [['Nom', 'Code', 'Ville', 'Région', 'Statut', 'Utilisateurs', 'Dernier accès']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 }
  });

  doc.save(filename || `pharmacies_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export audit logs to Excel
export const exportAuditLogsToExcel = (logs: AuditLogExportData[], filename?: string) => {
  const data = logs.map(log => ({
    'Date': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr }),
    'Action': log.action_type,
    'Catégorie': log.action_category,
    'Type cible': log.target_type || 'N/A',
    'Nom cible': log.target_name || 'N/A',
    'Sévérité': log.severity,
    'Détails': log.details ? JSON.stringify(log.details) : 'N/A'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logs d\'audit');
  
  ws['!cols'] = [
    { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
    { wch: 20 }, { wch: 12 }, { wch: 50 }
  ];
  
  XLSX.writeFile(wb, filename || `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export audit logs to PDF
export const exportAuditLogsToPDF = (logs: AuditLogExportData[], filename?: string) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(16);
  doc.text('Journal d\'Audit du Réseau', 14, 20);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 27);
  
  const tableData = logs.map(log => [
    format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    log.action_type,
    log.action_category,
    log.target_type || 'N/A',
    log.severity
  ]);

  autoTable(doc, {
    head: [['Date', 'Action', 'Catégorie', 'Type cible', 'Sévérité']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 }
  });

  doc.save(filename || `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export channels to Excel
export const exportChannelsToExcel = (channels: ChannelExportData[], filename?: string) => {
  const data = channels.map(c => ({
    'Nom': c.name,
    'Description': c.description || 'N/A',
    'Type': c.type,
    'Catégorie': c.category || 'general',
    'Système': c.is_system ? 'Oui' : 'Non',
    'Public': c.is_public ? 'Oui' : 'Non',
    'Membres': c.member_count,
    'Messages': c.message_count,
    'Date création': format(new Date(c.created_at), 'dd/MM/yyyy', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Canaux');
  
  ws['!cols'] = [
    { wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 15 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }
  ];
  
  XLSX.writeFile(wb, filename || `channels_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export configuration to JSON
export const exportConfigurationToJSON = (config: ConfigExportData[], filename?: string) => {
  const exportData = {
    exportDate: new Date().toISOString(),
    configuration: config.reduce((acc, c) => {
      acc[c.key] = { value: c.value, type: c.type, category: c.category };
      return acc;
    }, {} as Record<string, any>)
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `config_${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export full network report to PDF
export const exportNetworkReportToPDF = (
  pharmacies: PharmacyExportData[],
  channels: ChannelExportData[],
  stats: { total_pharmacies: number; active_pharmacies: number; total_channels: number; total_messages: number },
  filename?: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header
  doc.setFontSize(20);
  doc.text('Rapport du Réseau PharmaSoft', 14, 20);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 28);
  
  // Statistics
  doc.setFontSize(14);
  doc.text('Statistiques Générales', 14, 45);
  doc.setFontSize(10);
  doc.text(`• Pharmacies totales: ${stats.total_pharmacies}`, 20, 55);
  doc.text(`• Pharmacies actives: ${stats.active_pharmacies}`, 20, 62);
  doc.text(`• Canaux réseau: ${stats.total_channels}`, 20, 69);
  doc.text(`• Messages échangés: ${stats.total_messages}`, 20, 76);
  
  // Pharmacies summary
  doc.setFontSize(14);
  doc.text('Résumé des Pharmacies', 14, 95);
  
  const pharmacyTableData = pharmacies.slice(0, 10).map(p => [
    p.name,
    p.city || 'N/A',
    p.status,
    String(p.user_count)
  ]);

  autoTable(doc, {
    head: [['Nom', 'Ville', 'Statut', 'Utilisateurs']],
    body: pharmacyTableData,
    startY: 100,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 }
  });

  // Channels summary
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  doc.setFontSize(14);
  doc.text('Canaux de Communication', 14, finalY + 15);
  
  const channelTableData = channels.slice(0, 10).map(c => [
    c.name,
    c.type,
    c.is_public ? 'Public' : 'Privé',
    String(c.member_count)
  ]);

  autoTable(doc, {
    head: [['Nom', 'Type', 'Visibilité', 'Membres']],
    body: channelTableData,
    startY: finalY + 20,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [34, 197, 94], textColor: 255 }
  });

  doc.save(filename || `rapport_reseau_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

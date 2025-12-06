import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ChannelWithMetrics, KeywordAlert, ChannelPermission, PartnerAccount } from '@/hooks/useNetworkChannelManagement';

// Export channels to Excel
export const exportChannelsToExcel = (channels: ChannelWithMetrics[]) => {
  const data = channels.map(channel => ({
    'Nom': channel.name,
    'Description': channel.description,
    'Type': channel.type,
    'Catégorie': channel.category,
    'Statut': channel.status === 'active' ? 'Actif' : channel.status === 'archived' ? 'Archivé' : 'En pause',
    'Public': channel.is_public ? 'Oui' : 'Non',
    'Système': channel.is_system ? 'Oui' : 'Non',
    'Membres': channel.members_count,
    'Messages': channel.messages_count,
    'Mots-clés': channel.keywords.join(', '),
    'Auto-archivage (jours)': channel.auto_archive_days || '-',
    'Dernière activité': format(new Date(channel.last_activity), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Créé le': format(new Date(channel.created_at), 'dd/MM/yyyy', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Canaux');
  
  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `canaux_reseau_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export channels to PDF
export const exportChannelsToPDF = (channels: ChannelWithMetrics[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Rapport des Canaux Réseau', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  // Stats summary
  const activeCount = channels.filter(c => c.status === 'active').length;
  const publicCount = channels.filter(c => c.is_public).length;
  const totalMembers = channels.reduce((sum, c) => sum + c.members_count, 0);
  
  doc.setFontSize(12);
  doc.text(`Total: ${channels.length} canaux | Actifs: ${activeCount} | Publics: ${publicCount} | Membres: ${totalMembers}`, 14, 40);

  // Table
  const tableData = channels.map(channel => [
    channel.name,
    channel.type,
    channel.status === 'active' ? 'Actif' : 'Archivé',
    channel.is_public ? 'Oui' : 'Non',
    channel.members_count.toString(),
    channel.messages_count.toString(),
    format(new Date(channel.last_activity), 'dd/MM/yy', { locale: fr })
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['Nom', 'Type', 'Statut', 'Public', 'Membres', 'Messages', 'Activité']],
    body: tableData,
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 }
    }
  });

  doc.save(`canaux_reseau_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export keyword alerts to Excel
export const exportAlertsToExcel = (alerts: KeywordAlert[]) => {
  const data = alerts.map(alert => ({
    'Mot-clé': alert.keyword,
    'Statut': alert.is_active ? 'Actif' : 'Inactif',
    'Type d\'alerte': alert.alert_type === 'immediate' ? 'Immédiat' : alert.alert_type === 'daily' ? 'Quotidien' : 'Hebdomadaire',
    'Canaux surveillés': alert.channel_names.join(', '),
    'Nombre de déclenchements': alert.trigger_count,
    'Dernier déclenchement': alert.last_triggered_at ? format(new Date(alert.last_triggered_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-',
    'Destinataires': alert.recipients.join(', '),
    'Créé le': format(new Date(alert.created_at), 'dd/MM/yyyy', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alertes Mots-clés');
  
  XLSX.writeFile(wb, `alertes_mots_cles_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export permissions to Excel
export const exportPermissionsToExcel = (permissions: ChannelPermission[]) => {
  const data = permissions.map(perm => ({
    'Canal': perm.channel_name,
    'Rôle': perm.role,
    'Niveau': perm.permission_level === 'read' ? 'Lecture' : perm.permission_level === 'write' ? 'Écriture' : 'Administration',
    'Pharmacie': perm.pharmacy_name || '-',
    'Créé le': format(new Date(perm.created_at), 'dd/MM/yyyy', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Permissions');
  
  XLSX.writeFile(wb, `permissions_canaux_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export partners to Excel
export const exportPartnersToExcel = (partners: PartnerAccount[]) => {
  const data = partners.map(partner => ({
    'Nom': partner.display_name,
    'Type': partner.partner_type,
    'Email': partner.contact_email || '-',
    'Statut': partner.is_active ? 'Actif' : 'Inactif',
    'Dernière activité': partner.last_activity ? format(new Date(partner.last_activity), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-',
    'Créé le': format(new Date(partner.created_at), 'dd/MM/yyyy', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Partenaires');
  
  XLSX.writeFile(wb, `partenaires_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Combined export
export const exportAllChannelData = (
  channels: ChannelWithMetrics[],
  alerts: KeywordAlert[],
  permissions: ChannelPermission[],
  partners: PartnerAccount[]
) => {
  const wb = XLSX.utils.book_new();

  // Channels sheet
  const channelsData = channels.map(channel => ({
    'Nom': channel.name,
    'Type': channel.type,
    'Statut': channel.status,
    'Public': channel.is_public ? 'Oui' : 'Non',
    'Membres': channel.members_count,
    'Messages': channel.messages_count
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(channelsData), 'Canaux');

  // Alerts sheet
  const alertsData = alerts.map(alert => ({
    'Mot-clé': alert.keyword,
    'Actif': alert.is_active ? 'Oui' : 'Non',
    'Type': alert.alert_type,
    'Déclenchements': alert.trigger_count
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alertsData), 'Alertes');

  // Permissions sheet
  const permsData = permissions.map(perm => ({
    'Canal': perm.channel_name,
    'Rôle': perm.role,
    'Niveau': perm.permission_level
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(permsData), 'Permissions');

  // Partners sheet
  const partnersData = partners.map(p => ({
    'Nom': p.display_name,
    'Type': p.partner_type,
    'Actif': p.is_active ? 'Oui' : 'Non'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partnersData), 'Partenaires');

  XLSX.writeFile(wb, `export_canaux_complet_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

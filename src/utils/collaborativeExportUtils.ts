import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  CollaborativeTask, 
  SharedDocument, 
  CollaborativeEvent, 
  CollaborativeWorkspace 
} from '@/hooks/useCollaborativeProductivity';

// ===== TASKS EXPORT =====
export const exportTasksToExcel = (tasks: CollaborativeTask[], filename?: string) => {
  const data = tasks.map(task => ({
    'Titre': task.title,
    'Description': task.description || '',
    'Assigné à': task.assignee_name || task.assignee_pharmacy_id || '',
    'Priorité': getPriorityLabel(task.priority),
    'Statut': getStatusLabel(task.status),
    'Échéance': task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy', { locale: fr }) : '',
    'Tags': (task.tags || []).join(', '),
    'Réseau': task.is_network_task ? 'Oui' : 'Non',
    'Créée le': format(new Date(task.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tâches');
  
  const name = filename || `taches_collaboratives_${format(new Date(), 'yyyy-MM-dd')}`;
  XLSX.writeFile(wb, `${name}.xlsx`);
};

export const exportTasksToPDF = (tasks: CollaborativeTask[], filename?: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Tâches Collaboratives', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = tasks.map(task => [
    task.title.substring(0, 30),
    getPriorityLabel(task.priority),
    getStatusLabel(task.status),
    task.assignee_name || '-',
    task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-'
  ]);
  
  (doc as any).autoTable({
    startY: 40,
    head: [['Titre', 'Priorité', 'Statut', 'Assigné', 'Échéance']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  const name = filename || `taches_collaboratives_${format(new Date(), 'yyyy-MM-dd')}`;
  doc.save(`${name}.pdf`);
};

// ===== DOCUMENTS EXPORT =====
export const exportDocumentsToExcel = (documents: SharedDocument[], filename?: string) => {
  const data = documents.map(doc => ({
    'Nom': doc.name,
    'Description': doc.description || '',
    'Catégorie': doc.category,
    'Type': doc.file_type || '',
    'Taille': formatFileSize(doc.file_size),
    'Uploadé par': doc.uploaded_by_name || '',
    'Téléchargements': doc.download_count,
    'Partagé': doc.is_network_document ? 'Oui' : 'Non',
    'Créé le': format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Documents');
  
  const name = filename || `documents_partages_${format(new Date(), 'yyyy-MM-dd')}`;
  XLSX.writeFile(wb, `${name}.xlsx`);
};

export const exportDocumentsToPDF = (documents: SharedDocument[], filename?: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Documents Partagés', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = documents.map(d => [
    d.name.substring(0, 35),
    d.category,
    d.file_type || '-',
    formatFileSize(d.file_size),
    d.download_count.toString()
  ]);
  
  (doc as any).autoTable({
    startY: 40,
    head: [['Nom', 'Catégorie', 'Type', 'Taille', 'Téléchargements']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 197, 94] }
  });
  
  const name = filename || `documents_partages_${format(new Date(), 'yyyy-MM-dd')}`;
  doc.save(`${name}.pdf`);
};

// ===== EVENTS EXPORT =====
export const exportEventsToExcel = (events: CollaborativeEvent[], filename?: string) => {
  const data = events.map(event => ({
    'Titre': event.title,
    'Description': event.description || '',
    'Type': getEventTypeLabel(event.event_type),
    'Date': format(new Date(event.event_date), 'dd/MM/yyyy', { locale: fr }),
    'Heure': event.event_time || '',
    'Lieu': event.location || (event.is_virtual ? 'Virtuel' : ''),
    'Organisateur': event.organizer_name || '',
    'Participants': event.participants?.length || 0,
    'Réseau': event.is_network_event ? 'Oui' : 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Événements');
  
  const name = filename || `evenements_${format(new Date(), 'yyyy-MM-dd')}`;
  XLSX.writeFile(wb, `${name}.xlsx`);
};

export const exportEventsToPDF = (events: CollaborativeEvent[], filename?: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Calendrier Collaboratif', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);
  
  const tableData = events.map(e => [
    e.title.substring(0, 30),
    getEventTypeLabel(e.event_type),
    format(new Date(e.event_date), 'dd/MM/yyyy'),
    e.event_time || '-',
    e.location || (e.is_virtual ? 'Virtuel' : '-'),
    (e.participants?.length || 0).toString()
  ]);
  
  (doc as any).autoTable({
    startY: 40,
    head: [['Titre', 'Type', 'Date', 'Heure', 'Lieu', 'Participants']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [168, 85, 247] }
  });
  
  const name = filename || `evenements_${format(new Date(), 'yyyy-MM-dd')}`;
  doc.save(`${name}.pdf`);
};

// ===== WORKSPACES EXPORT =====
export const exportWorkspacesToExcel = (workspaces: CollaborativeWorkspace[], filename?: string) => {
  const data = workspaces.map(ws => ({
    'Nom': ws.name,
    'Description': ws.description || '',
    'Statut': getWorkspaceStatusLabel(ws.status),
    'Progression': `${ws.progress_percent}%`,
    'Membres': ws.members_count || 0,
    'Tâches': ws.tasks_count || 0,
    'Documents': ws.documents_count || 0,
    'Réseau': ws.is_network_workspace ? 'Oui' : 'Non',
    'Créé le': format(new Date(ws.created_at), 'dd/MM/yyyy', { locale: fr })
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Espaces de travail');
  
  const name = filename || `espaces_travail_${format(new Date(), 'yyyy-MM-dd')}`;
  XLSX.writeFile(wb, `${name}.xlsx`);
};

export const exportWorkspaceReportPDF = (workspace: CollaborativeWorkspace, filename?: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(`Rapport: ${workspace.name}`, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 32);
  
  // Summary section
  doc.setFontSize(14);
  doc.text('Résumé', 14, 50);
  
  doc.setFontSize(11);
  const summaryY = 60;
  doc.text(`Description: ${workspace.description || 'Aucune'}`, 14, summaryY);
  doc.text(`Statut: ${getWorkspaceStatusLabel(workspace.status)}`, 14, summaryY + 8);
  doc.text(`Progression: ${workspace.progress_percent}%`, 14, summaryY + 16);
  doc.text(`Membres: ${workspace.members_count || 0}`, 14, summaryY + 24);
  doc.text(`Tâches: ${workspace.tasks_count || 0}`, 14, summaryY + 32);
  doc.text(`Documents: ${workspace.documents_count || 0}`, 14, summaryY + 40);
  doc.text(`Réseau: ${workspace.is_network_workspace ? 'Oui' : 'Non'}`, 14, summaryY + 48);
  
  // Goals section
  if (workspace.goals && workspace.goals.length > 0) {
    doc.setFontSize(14);
    doc.text('Objectifs', 14, summaryY + 65);
    
    const goalsData = workspace.goals.map(g => [
      g.title,
      g.completed ? '✓ Terminé' : '○ En cours'
    ]);
    
    (doc as any).autoTable({
      startY: summaryY + 72,
      head: [['Objectif', 'Statut']],
      body: goalsData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    });
  }
  
  const name = filename || `rapport_${workspace.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}`;
  doc.save(`${name}.pdf`);
};

// ===== HELPERS =====
const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente'
  };
  return labels[priority] || priority;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée'
  };
  return labels[status] || status;
};

const getEventTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    meeting: 'Réunion',
    training: 'Formation',
    event: 'Événement',
    deadline: 'Échéance'
  };
  return labels[type] || type;
};

const getWorkspaceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Actif',
    archived: 'Archivé',
    completed: 'Terminé'
  };
  return labels[status] || status;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

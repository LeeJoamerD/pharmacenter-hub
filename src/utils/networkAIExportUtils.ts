import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AIConversation, AIMessage, AIInsight } from '@/hooks/useNetworkConversationalAI';

export const exportConversationsToPDF = (conversations: AIConversation[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Conversations IA - ' + pharmacyName, 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  const tableData = conversations.map(conv => [
    conv.title,
    conv.context,
    conv.status === 'active' ? 'Actif' : conv.status === 'paused' ? 'En pause' : 'Terminé',
    format(new Date(conv.created_at), 'dd/MM/yyyy', { locale: fr }),
    (conv.participants?.length || 1).toString(),
  ]);

  autoTable(doc, {
    head: [['Titre', 'Contexte', 'Statut', 'Créé le', 'Participants']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`conversations-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportConversationsToExcel = (conversations: AIConversation[], pharmacyName: string) => {
  const data = conversations.map(conv => ({
    'Titre': conv.title,
    'Contexte': conv.context,
    'Statut': conv.status === 'active' ? 'Actif' : conv.status === 'paused' ? 'En pause' : 'Terminé',
    'Créé le': format(new Date(conv.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Dernière mise à jour': format(new Date(conv.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Participants': conv.participants?.length || 1,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conversations');
  XLSX.writeFile(wb, `conversations-ia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportChatHistoryToPDF = (
  conversation: AIConversation,
  messages: AIMessage[],
  pharmacyName: string
) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(conversation.title, 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  let yPosition = 45;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  const maxWidth = doc.internal.pageSize.width - 28;

  messages.forEach((msg) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    const roleLabel = msg.role === 'user' ? 'Utilisateur' : msg.role === 'assistant' ? 'Assistant IA' : 'Système';
    const timestamp = format(new Date(msg.created_at), 'HH:mm', { locale: fr });
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${roleLabel} - ${timestamp}`, margin, yPosition);
    yPosition += 5;

    doc.setFontSize(10);
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(msg.content, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    if (msg.confidence) {
      doc.setFontSize(8);
      doc.setTextColor(59, 130, 246);
      doc.text(`Confiance: ${Math.round(msg.confidence * 100)}%`, margin, yPosition);
      yPosition += 4;
    }

    yPosition += 8;
  });

  doc.save(`chat-${conversation.title.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportInsightsToPDF = (insights: AIInsight[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Insights IA - ' + pharmacyName, 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  const tableData = insights.map(insight => [
    insight.title,
    insight.type === 'recommendation' ? 'Recommandation' :
    insight.type === 'alert' ? 'Alerte' :
    insight.type === 'trend' ? 'Tendance' : 'Optimisation',
    insight.impact === 'critical' ? 'Critique' :
    insight.impact === 'high' ? 'Élevé' :
    insight.impact === 'medium' ? 'Moyen' : 'Faible',
    `${Math.round(insight.confidence * 100)}%`,
    insight.is_applied ? 'Appliqué' : insight.is_read ? 'Lu' : 'Non lu',
    format(new Date(insight.created_at), 'dd/MM/yyyy', { locale: fr }),
  ]);

  autoTable(doc, {
    head: [['Titre', 'Type', 'Impact', 'Confiance', 'Statut', 'Date']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [234, 179, 8] },
  });

  doc.save(`insights-ia-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportInsightsToExcel = (insights: AIInsight[], pharmacyName: string) => {
  const data = insights.map(insight => ({
    'Titre': insight.title,
    'Description': insight.description,
    'Type': insight.type === 'recommendation' ? 'Recommandation' :
            insight.type === 'alert' ? 'Alerte' :
            insight.type === 'trend' ? 'Tendance' : 'Optimisation',
    'Impact': insight.impact === 'critical' ? 'Critique' :
              insight.impact === 'high' ? 'Élevé' :
              insight.impact === 'medium' ? 'Moyen' : 'Faible',
    'Confiance': `${Math.round(insight.confidence * 100)}%`,
    'Lu': insight.is_read ? 'Oui' : 'Non',
    'Appliqué': insight.is_applied ? 'Oui' : 'Non',
    'Date d\'application': insight.applied_at 
      ? format(new Date(insight.applied_at), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '-',
    'Créé le': format(new Date(insight.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Pharmacies concernées': insight.pharmacies_affected?.length || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Insights');
  XLSX.writeFile(wb, `insights-ia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

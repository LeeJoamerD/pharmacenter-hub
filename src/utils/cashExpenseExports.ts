import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CashExpenseSearchResult } from '@/hooks/useCashExpenseSearch';

const formatDate = (date?: string | null) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
};

const formatAmount = (amount?: number | null) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/[\u202F\u00A0]/g, ' ');
};

const getAgentName = (r: CashExpenseSearchResult) => {
  if (r.agent_prenoms || r.agent_noms) {
    return `${r.agent_prenoms || ''} ${r.agent_noms || ''}`.trim();
  }
  return '-';
};

const getStatut = (r: CashExpenseSearchResult) => {
  if (r.est_annule) return 'Annulée';
  return 'Active';
};

const MOTIF_LABELS: Record<string, string> = {
  fournitures: 'Fournitures de bureau',
  entretien: 'Entretien et réparations',
  transport: 'Transport et déplacement',
  charges: 'Charges diverses',
  salaires: 'Avances sur salaires',
  impots: 'Impôts et taxes',
  divers: 'Dépenses diverses',
};

const mapToRow = (r: CashExpenseSearchResult) => ({
  'Date': formatDate(r.date_mouvement),
  'Description': r.description || '-',
  'Motif': MOTIF_LABELS[r.motif] || r.motif || '-',
  'Montant': formatAmount(r.montant),
  'Agent': getAgentName(r),
  'Session': r.session_statut === 'Ouverte' ? 'Ouverte' : 'Fermée',
  'Statut': getStatut(r),
});

export const exportCashExpensesToExcel = (expenses: CashExpenseSearchResult[]) => {
  const rows = expenses.map(mapToRow);
  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] || '').length)) + 2
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dépenses de caisse');
  XLSX.writeFile(wb, `depenses_caisse_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

export const exportCashExpensesToPDF = (expenses: CashExpenseSearchResult[]) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Dépenses de Caisse', 14, 15);
  doc.setFontSize(9);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} — ${expenses.length} dépense(s)`, 14, 22);

  const headers = ['Date', 'Description', 'Motif', 'Montant', 'Agent', 'Session', 'Statut'];

  const body = expenses.map(r => [
    formatDate(r.date_mouvement),
    r.description || '-',
    MOTIF_LABELS[r.motif] || r.motif || '-',
    formatAmount(r.montant),
    getAgentName(r),
    r.session_statut === 'Ouverte' ? 'Ouverte' : 'Fermée',
    getStatut(r),
  ]);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 27,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`depenses_caisse_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

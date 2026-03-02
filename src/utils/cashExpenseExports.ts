import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CashExpenseSearchResult } from '@/hooks/useCashExpenseSearch';
import type { CashExpenseSearchFilters } from '@/hooks/useCashExpenseSearch';

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

export interface ExpenseFilterLabels {
  agentsList?: { id: string; noms: string; prenoms: string }[];
  sessionsList?: { id: string; numero_session: string }[];
}

const buildFilterSummary = (filters: CashExpenseSearchFilters, labels?: ExpenseFilterLabels): string[] => {
  const lines: string[] = [];

  if (filters.dateFrom) lines.push(`Date début : ${format(new Date(filters.dateFrom), 'dd/MM/yyyy')}`);
  if (filters.dateTo) lines.push(`Date fin : ${format(new Date(filters.dateTo), 'dd/MM/yyyy')}`);
  if (filters.motif) lines.push(`Motif : ${MOTIF_LABELS[filters.motif] || filters.motif}`);
  if (filters.agentId) {
    const agent = labels?.agentsList?.find(a => a.id === filters.agentId);
    lines.push(`Agent : ${agent ? `${agent.prenoms} ${agent.noms}` : filters.agentId}`);
  }
  if (filters.sessionId) {
    const session = labels?.sessionsList?.find(s => s.id === filters.sessionId);
    lines.push(`Session : ${session ? session.numero_session : filters.sessionId}`);
  }
  if (filters.sessionStatus && filters.sessionStatus !== 'all') {
    lines.push(`Statut session : ${filters.sessionStatus === 'open' ? 'Ouverte' : 'Fermée'}`);
  }
  if (filters.montantMin) lines.push(`Montant min : ${formatAmount(parseFloat(filters.montantMin))}`);
  if (filters.montantMax) lines.push(`Montant max : ${formatAmount(parseFloat(filters.montantMax))}`);
  if (filters.includesCancelled) lines.push('Annulées incluses');
  if (filters.search) lines.push(`Recherche : "${filters.search}"`);

  return lines;
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

export const exportCashExpensesToExcel = (
  expenses: CashExpenseSearchResult[],
  filters?: CashExpenseSearchFilters,
  labels?: ExpenseFilterLabels,
  totalMontant?: number
) => {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const filterLines = filters ? buildFilterSummary(filters, labels) : [];
  const summaryData = [
    ['Dépenses de Caisse'],
    [`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`],
    [`${expenses.length} dépense(s)`],
    [`Montant Total : ${formatAmount(totalMontant)} FCFA`],
    [],
    ...(filterLines.length > 0
      ? [['Filtres appliqués'], ...filterLines.map(l => [l])]
      : []),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

  const rows = expenses.map(mapToRow);
  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] || '').length)) + 2
  }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Dépenses de caisse');
  XLSX.writeFile(wb, `depenses_caisse_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

export const exportCashExpensesToPDF = (
  expenses: CashExpenseSearchResult[],
  filters?: CashExpenseSearchFilters,
  labels?: ExpenseFilterLabels,
  totalMontant?: number
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Dépenses de Caisse', 14, 15);
  doc.setFontSize(9);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} — ${expenses.length} dépense(s)`, 14, 22);

  // Total Montant
  doc.setFontSize(10);
  doc.text(`Montant Total : ${formatAmount(totalMontant)} FCFA`, 14, 28);

  let startY = 34;

  // Add active filters
  if (filters) {
    const filterLines = buildFilterSummary(filters, labels);
    if (filterLines.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('Filtres : ' + filterLines.join(' | '), 14, startY);
      doc.setTextColor(0);
      startY += 6;
    }
  }

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
    startY,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`depenses_caisse_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

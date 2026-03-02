import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CashSessionSearchResult } from '@/hooks/useCashSessionSearch';
import type { CashSessionSearchFilters } from '@/hooks/useCashSessionSearch';

const formatDate = (date?: string) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
};

const formatAmount = (amount?: number) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/[\u202F\u00A0]/g, ' ');
};

const getCaissierName = (s: CashSessionSearchResult) => {
  if (s.caissier_prenoms || s.caissier_noms) {
    return `${s.caissier_prenoms || ''} ${s.caissier_noms || ''}`.trim();
  }
  return '-';
};

const mapSessionToRow = (s: CashSessionSearchResult) => ({
  'N° Session': s.numero_session || '-',
  'Statut': s.statut || '-',
  'Type': s.type_session || '-',
  'Caissier': getCaissierName(s),
  'Caisse': s.caisse_nom || '-',
  'Date ouverture': formatDate(s.date_ouverture),
  'Date fermeture': formatDate(s.date_fermeture),
  'Fond ouverture': formatAmount(s.fond_caisse_ouverture),
  'Montant théorique': formatAmount(s.montant_theorique_fermeture),
  'Montant réel': formatAmount(s.montant_reel_fermeture),
  'Écart': formatAmount(s.ecart),
});

interface FilterLabels {
  personnelList?: { id: string; prenoms: string; noms: string }[];
  caissesList?: { id: string; nom_caisse: string }[];
}

const buildFilterSummary = (filters: CashSessionSearchFilters, labels?: FilterLabels): string[] => {
  const lines: string[] = [];

  if (filters.dateFrom) lines.push(`Date début : ${format(new Date(filters.dateFrom), 'dd/MM/yyyy')}`);
  if (filters.dateTo) lines.push(`Date fin : ${format(new Date(filters.dateTo), 'dd/MM/yyyy')}`);
  if (filters.statut) lines.push(`Statut : ${filters.statut}`);
  if (filters.cashierId) {
    const person = labels?.personnelList?.find(p => p.id === filters.cashierId);
    lines.push(`Caissier : ${person ? `${person.prenoms} ${person.noms}` : filters.cashierId}`);
  }
  if (filters.caisseId) {
    const caisse = labels?.caissesList?.find(c => c.id === filters.caisseId);
    lines.push(`Caisse : ${caisse ? caisse.nom_caisse : filters.caisseId}`);
  }
  if (filters.minAmount) lines.push(`Montant min : ${formatAmount(parseFloat(filters.minAmount))}`);
  if (filters.maxAmount) lines.push(`Montant max : ${formatAmount(parseFloat(filters.maxAmount))}`);

  return lines;
};

export const exportCashSessionsToExcel = (
  sessions: CashSessionSearchResult[],
  filters?: CashSessionSearchFilters,
  labels?: FilterLabels
) => {
  const wb = XLSX.utils.book_new();

  // Filter summary sheet if filters active
  if (filters) {
    const filterLines = buildFilterSummary(filters, labels);
    if (filterLines.length > 0) {
      const filterData = [
        ['Filtres appliqués'],
        ...filterLines.map(l => [l]),
        [],
        [`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`],
        [`${sessions.length} session(s)`],
      ];
      const wsFilters = XLSX.utils.aoa_to_sheet(filterData);
      XLSX.utils.book_append_sheet(wb, wsFilters, 'Filtres');
    }
  }

  const rows = sessions.map(mapSessionToRow);
  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] || '').length)) + 2
  }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Sessions de caisse');
  XLSX.writeFile(wb, `sessions_caisse_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

export const exportCashSessionsToPDF = (
  sessions: CashSessionSearchResult[],
  filters?: CashSessionSearchFilters,
  labels?: FilterLabels
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Historique des Sessions de Caisse', 14, 15);
  doc.setFontSize(9);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} — ${sessions.length} session(s)`, 14, 22);

  // Add active filters
  let startY = 27;
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

  const headers = ['N° Session', 'Statut', 'Type', 'Caissier', 'Caisse', 'Ouverture', 'Fermeture', 'Fond ouv.', 'Théorique', 'Réel', 'Écart'];

  const body = sessions.map(s => [
    s.numero_session || '-',
    s.statut || '-',
    s.type_session || '-',
    getCaissierName(s),
    s.caisse_nom || '-',
    formatDate(s.date_ouverture),
    formatDate(s.date_fermeture),
    formatAmount(s.fond_caisse_ouverture),
    formatAmount(s.montant_theorique_fermeture),
    formatAmount(s.montant_reel_fermeture),
    formatAmount(s.ecart),
  ]);

  autoTable(doc, {
    head: [headers],
    body,
    startY,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`sessions_caisse_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

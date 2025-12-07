import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExportOptions {
  pharmacyName?: string;
  period?: string;
  currency?: string;
}

// Chart of accounts export
export const exportChartOfAccountsPDF = (accounts: any[], options: ExportOptions = {}) => {
  const doc = new jsPDF();
  const { pharmacyName = 'PharmaSoft', currency = 'FCFA' } = options;

  doc.setFontSize(18);
  doc.text('Plan Comptable SYSCOHADA', 14, 22);
  doc.setFontSize(11);
  doc.text(pharmacyName, 14, 30);
  doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, 36);

  const tableData = accounts.map(account => [
    account.numero_compte || '',
    account.libelle_compte || '',
    account.classe || '',
    account.type_compte || '',
    account.is_active ? 'Actif' : 'Inactif',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['N° Compte', 'Libellé', 'Classe', 'Type', 'Statut']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`plan_comptable_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportChartOfAccountsExcel = (accounts: any[], options: ExportOptions = {}) => {
  const { pharmacyName = 'PharmaSoft' } = options;

  const wsData = [
    ['Plan Comptable SYSCOHADA'],
    [pharmacyName],
    [`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`],
    [],
    ['N° Compte', 'Libellé', 'Classe', 'Type', 'Solde Débit', 'Solde Crédit', 'Statut'],
  ];

  accounts.forEach(account => {
    wsData.push([
      account.numero_compte || '',
      account.libelle_compte || '',
      account.classe || '',
      account.type_compte || '',
      account.solde_debit || 0,
      account.solde_credit || 0,
      account.is_active ? 'Actif' : 'Inactif',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Plan Comptable');
  XLSX.writeFile(wb, `plan_comptable_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Anomalies export
export const exportAnomaliesPDF = (anomalies: any[], options: ExportOptions = {}) => {
  const doc = new jsPDF();
  const { pharmacyName = 'PharmaSoft' } = options;

  doc.setFontSize(18);
  doc.text('Rapport des Anomalies Comptables', 14, 22);
  doc.setFontSize(11);
  doc.text(pharmacyName, 14, 30);
  doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, 36);

  const severityLabels: Record<string, string> = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Élevée',
    critical: 'Critique',
  };

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    investigating: 'En cours',
    resolved: 'Résolu',
    dismissed: 'Ignoré',
  };

  const tableData = anomalies.map(anomaly => [
    anomaly.title || '',
    severityLabels[anomaly.severity] || anomaly.severity,
    statusLabels[anomaly.status] || anomaly.status,
    format(new Date(anomaly.detected_at), 'dd/MM/yyyy', { locale: fr }),
    anomaly.suggested_correction?.substring(0, 50) + '...' || '',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['Titre', 'Sévérité', 'Statut', 'Détectée le', 'Correction suggérée']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [192, 57, 43] },
  });

  doc.save(`anomalies_comptables_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportAnomaliesExcel = (anomalies: any[], options: ExportOptions = {}) => {
  const { pharmacyName = 'PharmaSoft' } = options;

  const wsData = [
    ['Rapport des Anomalies Comptables'],
    [pharmacyName],
    [`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`],
    [],
    ['Titre', 'Type', 'Sévérité', 'Statut', 'Détectée le', 'Correction suggérée', 'Notes de résolution'],
  ];

  anomalies.forEach(anomaly => {
    wsData.push([
      anomaly.title || '',
      anomaly.anomaly_type || '',
      anomaly.severity || '',
      anomaly.status || '',
      anomaly.detected_at ? format(new Date(anomaly.detected_at), 'dd/MM/yyyy', { locale: fr }) : '',
      anomaly.suggested_correction || '',
      anomaly.resolution_notes || '',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Anomalies');
  XLSX.writeFile(wb, `anomalies_comptables_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Optimizations export
export const exportOptimizationsPDF = (optimizations: any[], options: ExportOptions = {}) => {
  const doc = new jsPDF();
  const { pharmacyName = 'PharmaSoft', currency = 'FCFA' } = options;

  doc.setFontSize(18);
  doc.text('Optimisations Fiscales', 14, 22);
  doc.setFontSize(11);
  doc.text(pharmacyName, 14, 30);
  doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, 36);

  const tableData = optimizations.map(opt => [
    opt.title || '',
    opt.category || '',
    `${(opt.estimated_savings || 0).toLocaleString('fr-FR')} ${currency}`,
    opt.status || '',
    opt.deadline ? format(new Date(opt.deadline), 'dd/MM/yyyy', { locale: fr }) : '-',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['Titre', 'Catégorie', 'Économies estimées', 'Statut', 'Échéance']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [39, 174, 96] },
  });

  // Summary
  const totalSavings = optimizations.reduce((sum, o) => sum + (o.estimated_savings || 0), 0);
  const implementedSavings = optimizations
    .filter(o => o.status === 'implemented')
    .reduce((sum, o) => sum + (o.estimated_savings || 0), 0);

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Total économies estimées: ${totalSavings.toLocaleString('fr-FR')} ${currency}`, 14, finalY);
  doc.text(`Économies réalisées: ${implementedSavings.toLocaleString('fr-FR')} ${currency}`, 14, finalY + 6);

  doc.save(`optimisations_fiscales_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportOptimizationsExcel = (optimizations: any[], options: ExportOptions = {}) => {
  const { pharmacyName = 'PharmaSoft', currency = 'FCFA' } = options;

  const wsData = [
    ['Optimisations Fiscales'],
    [pharmacyName],
    [`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`],
    [],
    ['Titre', 'Type', 'Catégorie', 'Économies estimées', 'Confiance', 'Priorité', 'Statut', 'Échéance'],
  ];

  optimizations.forEach(opt => {
    wsData.push([
      opt.title || '',
      opt.optimization_type || '',
      opt.category || '',
      opt.estimated_savings || 0,
      `${((opt.confidence || 0) * 100).toFixed(0)}%`,
      opt.priority || '',
      opt.status || '',
      opt.deadline ? format(new Date(opt.deadline), 'dd/MM/yyyy', { locale: fr }) : '',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Optimisations');
  XLSX.writeFile(wb, `optimisations_fiscales_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Fiscal calendar export
export const exportFiscalCalendarPDF = (obligations: any[], options: ExportOptions = {}) => {
  const doc = new jsPDF();
  const { pharmacyName = 'PharmaSoft', currency = 'FCFA' } = options;

  doc.setFontSize(18);
  doc.text('Calendrier Fiscal', 14, 22);
  doc.setFontSize(11);
  doc.text(pharmacyName, 14, 30);
  doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, 36);

  const statusLabels: Record<string, string> = {
    en_attente: 'En attente',
    payee: 'Payée',
    en_retard: 'En retard',
  };

  const tableData = obligations.map(obl => {
    const dueDate = new Date(obl.date_echeance);
    const isOverdue = dueDate < new Date() && obl.statut === 'en_attente';
    return [
      obl.type_obligation || '',
      obl.description || '',
      format(dueDate, 'dd/MM/yyyy', { locale: fr }),
      `${(obl.montant || 0).toLocaleString('fr-FR')} ${currency}`,
      isOverdue ? 'En retard' : statusLabels[obl.statut] || obl.statut,
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [['Type', 'Description', 'Échéance', 'Montant', 'Statut']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [155, 89, 182] },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.cell.text[0] === 'En retard') {
        data.cell.styles.textColor = [192, 57, 43];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`calendrier_fiscal_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportFiscalCalendarExcel = (obligations: any[], options: ExportOptions = {}) => {
  const { pharmacyName = 'PharmaSoft' } = options;

  const wsData = [
    ['Calendrier Fiscal'],
    [pharmacyName],
    [`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`],
    [],
    ['Type', 'Description', 'Période', 'Échéance', 'Montant', 'Statut'],
  ];

  obligations.forEach(obl => {
    wsData.push([
      obl.type_obligation || '',
      obl.description || '',
      obl.periode_concernee || '',
      obl.date_echeance ? format(new Date(obl.date_echeance), 'dd/MM/yyyy', { locale: fr }) : '',
      obl.montant || 0,
      obl.statut || '',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Calendrier Fiscal');
  XLSX.writeFile(wb, `calendrier_fiscal_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Entries export
export const exportEntriesPDF = (entries: any[], options: ExportOptions = {}) => {
  const doc = new jsPDF();
  const { pharmacyName = 'PharmaSoft', period = '' } = options;

  doc.setFontSize(18);
  doc.text('Journal des Écritures Comptables', 14, 22);
  doc.setFontSize(11);
  doc.text(pharmacyName, 14, 30);
  if (period) doc.text(`Période: ${period}`, 14, 36);
  doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, period ? 42 : 36);

  const tableData = entries.map(entry => [
    entry.numero_piece || '',
    entry.date_ecriture ? format(new Date(entry.date_ecriture), 'dd/MM/yyyy', { locale: fr }) : '',
    entry.libelle?.substring(0, 40) || '',
    entry.statut || '',
    entry.piece_justificative ? 'Oui' : 'Non',
  ]);

  autoTable(doc, {
    startY: period ? 50 : 44,
    head: [['N° Pièce', 'Date', 'Libellé', 'Statut', 'Justificatif']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [52, 73, 94] },
  });

  doc.save(`journal_ecritures_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportEntriesExcel = (entries: any[], options: ExportOptions = {}) => {
  const { pharmacyName = 'PharmaSoft', period = '' } = options;

  const wsData = [
    ['Journal des Écritures Comptables'],
    [pharmacyName],
    period ? [`Période: ${period}`] : [],
    [`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`],
    [],
    ['N° Pièce', 'Date', 'Libellé', 'Statut', 'Justificatif'],
  ].filter(row => row.length > 0);

  entries.forEach(entry => {
    wsData.push([
      entry.numero_piece || '',
      entry.date_ecriture ? format(new Date(entry.date_ecriture), 'dd/MM/yyyy', { locale: fr }) : '',
      entry.libelle || '',
      entry.statut || '',
      entry.piece_justificative ? 'Oui' : 'Non',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Écritures');
  XLSX.writeFile(wb, `journal_ecritures_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Consultations export
export const exportConsultationsPDF = (consultations: any[], options: ExportOptions = {}) => {
  const doc = new jsPDF();
  const { pharmacyName = 'PharmaSoft' } = options;

  doc.setFontSize(18);
  doc.text('Historique des Consultations IA', 14, 22);
  doc.setFontSize(11);
  doc.text(pharmacyName, 14, 30);
  doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, 36);

  const tableData = consultations.map(c => [
    format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    c.consultation_type || 'général',
    c.question?.substring(0, 50) + '...' || '',
    `${((c.confidence || 0) * 100).toFixed(0)}%`,
    c.is_useful === true ? 'Utile' : c.is_useful === false ? 'Pas utile' : '-',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['Date', 'Type', 'Question', 'Confiance', 'Feedback']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 160, 133] },
  });

  doc.save(`consultations_ia_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportConsultationsExcel = (consultations: any[], options: ExportOptions = {}) => {
  const { pharmacyName = 'PharmaSoft' } = options;

  const wsData = [
    ['Historique des Consultations IA'],
    [pharmacyName],
    [`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`],
    [],
    ['Date', 'Type', 'Question', 'Réponse', 'Confiance', 'Utile'],
  ];

  consultations.forEach(c => {
    wsData.push([
      c.created_at ? format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '',
      c.consultation_type || '',
      c.question || '',
      c.ai_response || '',
      `${((c.confidence || 0) * 100).toFixed(0)}%`,
      c.is_useful === true ? 'Oui' : c.is_useful === false ? 'Non' : '',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Consultations IA');
  XLSX.writeFile(wb, `consultations_ia_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Full report export
export const exportFullAccountingReportPDF = (
  data: {
    chartOfAccounts: any[];
    entries: any[];
    anomalies: any[];
    optimizations: any[];
    obligations: any[];
    metrics: any;
  },
  options: ExportOptions = {}
) => {
  const doc = new jsPDF();
  const { pharmacyName = 'PharmaSoft', currency = 'FCFA' } = options;

  // Title page
  doc.setFontSize(24);
  doc.text('Rapport Comptable Complet', 105, 100, { align: 'center' });
  doc.setFontSize(14);
  doc.text(pharmacyName, 105, 120, { align: 'center' });
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 105, 130, { align: 'center' });

  // Metrics summary
  doc.addPage();
  doc.setFontSize(18);
  doc.text('Synthèse', 14, 22);

  if (data.metrics) {
    doc.setFontSize(11);
    doc.text(`Écritures: ${data.metrics.entries?.total || 0} (${data.metrics.entries?.balance_rate || 0}% équilibrées)`, 14, 36);
    doc.text(`Anomalies en attente: ${data.metrics.anomalies?.pending || 0}`, 14, 44);
    doc.text(`Taux de conformité fiscale: ${data.metrics.fiscal?.compliance_rate || 0}%`, 14, 52);
    doc.text(`Économies fiscales réalisées: ${(data.metrics.optimizations?.realized_savings || 0).toLocaleString('fr-FR')} ${currency}`, 14, 60);
  }

  doc.save(`rapport_comptable_complet_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { VisionDetection, ShelfAnalysis, QualityControl, BatchRecognition } from '@/hooks/useComputerVision';

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateStr;
  }
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    verified: 'Vérifié',
    pending: 'En attente',
    failed: 'Échec',
    rejected: 'Rejeté',
    active: 'Actif',
    warning: 'Attention',
    error: 'Erreur',
    processing: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé'
  };
  return labels[status] || status;
};

// Export detections to PDF
export function exportDetectionsToPDF(detections: VisionDetection[], pharmacyName: string = 'PharmaSoft') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport des Détections Vision', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  const tableData = detections.map(d => [
    d.detected_name,
    d.detected_barcode || '-',
    `${d.confidence}%`,
    getStatusLabel(d.status),
    d.detected_price ? `${d.detected_price} FCFA` : '-',
    formatDate(d.created_at)
  ]);

  autoTable(doc, {
    head: [['Produit', 'Code-barres', 'Confiance', 'Statut', 'Prix', 'Date']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`detections-vision-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export detections to Excel
export function exportDetectionsToExcel(detections: VisionDetection[], pharmacyName: string = 'PharmaSoft') {
  const data = detections.map(d => ({
    'Produit': d.detected_name,
    'Code-barres': d.detected_barcode || '',
    'Confiance (%)': d.confidence,
    'Statut': getStatusLabel(d.status),
    'Prix': d.detected_price || '',
    'Stock détecté': d.detected_stock || '',
    'Date expiration': d.detected_expiry_date || '',
    'Emballage': d.packaging_status || '',
    'Temps traitement (ms)': d.processing_time_ms || '',
    'Date': formatDate(d.created_at)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Détections');
  XLSX.writeFile(wb, `detections-vision-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export shelf analyses to PDF
export function exportShelfAnalysisToPDF(analyses: ShelfAnalysis[], pharmacyName: string = 'PharmaSoft') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport Analyse des Étagères', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  const tableData = analyses.map(a => [
    a.shelf_name,
    a.total_products.toString(),
    a.stockouts_detected.toString(),
    a.misplacements_detected.toString(),
    `${a.compliance_score}%`,
    formatDate(a.scanned_at)
  ]);

  autoTable(doc, {
    head: [['Étagère', 'Produits', 'Ruptures', 'Mal placés', 'Conformité', 'Scanné le']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 197, 94] }
  });

  doc.save(`analyses-etageres-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export shelf analyses to Excel
export function exportShelfAnalysisToExcel(analyses: ShelfAnalysis[], pharmacyName: string = 'PharmaSoft') {
  const data = analyses.map(a => ({
    'Étagère': a.shelf_name,
    'Emplacement': a.shelf_location || '',
    'Total produits': a.total_products,
    'Ruptures': a.stockouts_detected,
    'Mal placés': a.misplacements_detected,
    'Conformité (%)': a.compliance_score,
    'Problèmes': Array.isArray(a.issues) ? a.issues.join('; ') : '',
    'Scanné le': formatDate(a.scanned_at)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Analyses Étagères');
  XLSX.writeFile(wb, `analyses-etageres-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export quality controls to PDF
export function exportQualityReportPDF(controls: QualityControl[], pharmacyName: string = 'PharmaSoft') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport Contrôle Qualité Visuel', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  const typeLabels: Record<string, string> = {
    expiry_date: "Date d'expiration",
    packaging: "Intégrité emballage",
    barcode: "Code-barres lisible",
    price_label: "Étiquetage prix"
  };

  const tableData = controls.map(c => [
    typeLabels[c.control_type] || c.control_type,
    c.checked_items.toString(),
    c.alerts_generated.toString(),
    `${c.accuracy}%`,
    getStatusLabel(c.status),
    formatDate(c.checked_at)
  ]);

  autoTable(doc, {
    head: [['Type', 'Vérifiés', 'Alertes', 'Précision', 'Statut', 'Date']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [168, 85, 247] }
  });

  doc.save(`controle-qualite-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export quality controls to Excel
export function exportQualityReportExcel(controls: QualityControl[], pharmacyName: string = 'PharmaSoft') {
  const typeLabels: Record<string, string> = {
    expiry_date: "Date d'expiration",
    packaging: "Intégrité emballage",
    barcode: "Code-barres lisible",
    price_label: "Étiquetage prix"
  };

  const data = controls.map(c => ({
    'Type de contrôle': typeLabels[c.control_type] || c.control_type,
    'Éléments vérifiés': c.checked_items,
    'Alertes générées': c.alerts_generated,
    'Précision (%)': c.accuracy,
    'Statut': getStatusLabel(c.status),
    'Date': formatDate(c.checked_at)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contrôle Qualité');
  XLSX.writeFile(wb, `controle-qualite-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export batch recognitions to PDF
export function exportBatchReportPDF(batches: BatchRecognition[], pharmacyName: string = 'PharmaSoft') {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport Traitement par Lots', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  const tableData = batches.map(b => [
    b.batch_name,
    b.total_items.toString(),
    b.recognized_count.toString(),
    b.failed_count.toString(),
    b.accuracy ? `${b.accuracy}%` : '-',
    getStatusLabel(b.status),
    formatDate(b.started_at)
  ]);

  autoTable(doc, {
    head: [['Lot', 'Total', 'Reconnus', 'Échecs', 'Précision', 'Statut', 'Date']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [249, 115, 22] }
  });

  doc.save(`traitements-lots-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export batch recognitions to Excel
export function exportBatchReportExcel(batches: BatchRecognition[], pharmacyName: string = 'PharmaSoft') {
  const data = batches.map(b => ({
    'Nom du lot': b.batch_name,
    'Total items': b.total_items,
    'Reconnus': b.recognized_count,
    'Échecs': b.failed_count,
    'Doublons': b.duplicates_count,
    'Nouveaux': b.new_products_count,
    'Précision (%)': b.accuracy || '',
    'Temps (ms)': b.processing_time_ms || '',
    'Statut': getStatusLabel(b.status),
    'Démarré le': formatDate(b.started_at),
    'Terminé le': formatDate(b.completed_at)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Traitements Lots');
  XLSX.writeFile(wb, `traitements-lots-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

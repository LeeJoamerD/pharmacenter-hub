import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LotForExport {
  numero_lot: string;
  produit?: {
    libelle_produit: string;
    code_cip: string;
  };
  quantite_initiale: number;
  quantite_restante: number;
  date_peremption: string | null;
  prix_achat_unitaire: number;
  emplacement: string | null;
}

const calculateDaysToExpiration = (datePeremption: string | null): number | null => {
  if (!datePeremption) return null;
  const today = new Date();
  const expirationDate = new Date(datePeremption);
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const determineStatus = (lot: LotForExport): string => {
  const daysToExpiration = calculateDaysToExpiration(lot.date_peremption);
  const stockPercentage = (lot.quantite_restante / lot.quantite_initiale) * 100;

  if (stockPercentage <= 0) return 'Épuisé';
  if (daysToExpiration !== null && daysToExpiration <= 0) return 'Expiré';
  if (daysToExpiration !== null && daysToExpiration <= 30) return 'Expiration Proche';
  return 'Actif';
};

export const exportLotsToExcel = (lots: LotForExport[], filename: string = 'lots') => {
  const exportData = lots.map(lot => ({
    'Numéro Lot': lot.numero_lot,
    'Produit': lot.produit?.libelle_produit || 'N/A',
    'Code CIP': lot.produit?.code_cip || 'N/A',
    'Stock Initial': lot.quantite_initiale,
    'Stock Restant': lot.quantite_restante,
    'Date Péremption': lot.date_peremption 
      ? format(new Date(lot.date_peremption), 'dd/MM/yyyy', { locale: fr }) 
      : 'N/A',
    'Jours Restants': calculateDaysToExpiration(lot.date_peremption) || 'N/A',
    'Prix Achat': lot.prix_achat_unitaire,
    'Valeur Stock': (lot.quantite_restante * lot.prix_achat_unitaire).toFixed(2),
    'Emplacement': lot.emplacement || 'Non défini',
    'Statut': determineStatus(lot)
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Set column widths
  const columnWidths = [
    { wch: 15 }, // Numéro Lot
    { wch: 30 }, // Produit
    { wch: 12 }, // Code CIP
    { wch: 12 }, // Stock Initial
    { wch: 12 }, // Stock Restant
    { wch: 15 }, // Date Péremption
    { wch: 15 }, // Jours Restants
    { wch: 12 }, // Prix Achat
    { wch: 12 }, // Valeur Stock
    { wch: 15 }, // Emplacement
    { wch: 15 }, // Statut
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lots');
  
  XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
};

export const exportLotsToPDF = (lots: LotForExport[], filename: string = 'lots') => {
  const doc = new jsPDF('landscape');
  
  // Add title
  doc.setFontSize(18);
  doc.text('Liste des Lots', 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 28);
  
  // Prepare table data
  const tableData = lots.map(lot => [
    lot.numero_lot,
    lot.produit?.libelle_produit || 'N/A',
    lot.produit?.code_cip || 'N/A',
    `${lot.quantite_restante}/${lot.quantite_initiale}`,
    lot.date_peremption 
      ? format(new Date(lot.date_peremption), 'dd/MM/yyyy', { locale: fr })
      : 'N/A',
    calculateDaysToExpiration(lot.date_peremption)?.toString() || 'N/A',
    `${lot.prix_achat_unitaire.toFixed(2)} XAF`,
    lot.emplacement || 'Non défini',
    determineStatus(lot)
  ]);

  // Add table
  autoTable(doc, {
    head: [['N° Lot', 'Produit', 'CIP', 'Stock', 'Péremption', 'Jours', 'Prix', 'Emplacement', 'Statut']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 35 },
  });

  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY || 35;
  doc.setFontSize(10);
  doc.text(`Total des lots: ${lots.length}`, 14, finalY + 10);
  
  const totalValue = lots.reduce((sum, lot) => sum + (lot.quantite_restante * lot.prix_achat_unitaire), 0);
  doc.text(`Valeur totale du stock: ${totalValue.toFixed(2)} XAF`, 14, finalY + 16);

  // Save PDF
  doc.save(`${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
};

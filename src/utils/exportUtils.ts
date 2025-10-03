import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CurrentStockItem } from '@/hooks/useCurrentStockDirect';

export const exportToExcel = (products: CurrentStockItem[], filename: string = 'stock_disponible') => {
  // Préparer les données pour l'export
  const exportData = products.map(product => ({
    'Produit': product.libelle_produit,
    'Code CIP': product.code_cip,
    'Famille': product.famille_libelle || 'N/A',
    'Rayon': product.rayon_libelle || 'N/A',
    'Stock Actuel': product.stock_actuel,
    'Stock Limite': product.stock_limite,
    'Statut': product.statut_stock,
    'Rotation': product.rotation,
    'Prix Achat (FCFA)': product.prix_achat,
    'Prix Vente TTC (FCFA)': product.prix_vente_ttc,
    'Valorisation (FCFA)': product.valeur_stock
  }));

  // Créer le workbook et la feuille
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock Disponible');

  // Ajuster la largeur des colonnes
  const colWidths = [
    { wch: 30 }, // Produit
    { wch: 15 }, // Code CIP
    { wch: 20 }, // Famille
    { wch: 20 }, // Rayon
    { wch: 12 }, // Stock Actuel
    { wch: 12 }, // Stock Limite
    { wch: 12 }, // Statut
    { wch: 12 }, // Rotation
    { wch: 15 }, // Prix Achat
    { wch: 15 }, // Prix Vente TTC
    { wch: 15 }  // Valorisation
  ];
  ws['!cols'] = colWidths;

  // Générer le fichier Excel
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToPDF = (products: CurrentStockItem[], filename: string = 'stock_disponible') => {
  const doc = new jsPDF('landscape');
  
  // Titre
  doc.setFontSize(16);
  doc.text('Stock Disponible', 14, 15);
  
  // Date d'export
  doc.setFontSize(10);
  doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
  
  // Préparer les données
  const tableData = products.map(product => [
    product.libelle_produit,
    product.code_cip,
    product.famille_libelle || 'N/A',
    product.stock_actuel.toString(),
    product.statut_stock,
    product.rotation,
    `${product.prix_vente_ttc.toLocaleString()} FCFA`,
    `${product.valeur_stock.toLocaleString()} FCFA`
  ]);

  // Générer le tableau
  autoTable(doc, {
    startY: 28,
    head: [['Produit', 'Code', 'Famille', 'Stock', 'Statut', 'Rotation', 'Prix Vente', 'Valorisation']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 35 },
      7: { cellWidth: 35 }
    }
  });

  // Statistiques en bas
  const finalY = (doc as any).lastAutoTable.finalY || 28;
  doc.setFontSize(10);
  doc.text(`Total produits: ${products.length}`, 14, finalY + 10);
  
  const totalValue = products.reduce((sum, p) => sum + p.valeur_stock, 0);
  doc.text(`Valorisation totale: ${totalValue.toLocaleString()} FCFA`, 14, finalY + 16);

  // Sauvegarder le PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

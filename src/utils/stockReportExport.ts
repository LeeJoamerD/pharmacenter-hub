import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { StockReportsData } from '@/types/stockReports';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

interface PharmacyInfo {
  name: string;
  logo_url?: string;
}

// Helper function for currency formatting in non-hook context
const formatCurrencyValue = (amount: number, currencySymbol: string = DEFAULT_SETTINGS.currency.symbol): string => {
  // For FCFA (no decimals), round to integer
  const isNoDecimal = DEFAULT_SETTINGS.currency.noDecimalCurrencies.includes(currencySymbol);
  if (isNoDecimal) {
    return `${Math.round(amount).toLocaleString('fr-FR')} ${currencySymbol}`;
  }
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`;
};

export const exportStockReportToPDF = async (
  reportData: StockReportsData,
  period: string,
  category: string,
  pharmacyInfo: PharmacyInfo,
  currencySymbol: string = DEFAULT_SETTINGS.currency.symbol
) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Mapping des périodes pour affichage
  const periodLabels: Record<string, string> = {
    'week': 'Cette semaine',
    'month': 'Ce mois',
    'quarter': 'Ce trimestre'
  };

  const categoryLabels: Record<string, string> = {
    'all': 'Toutes catégories',
    'medicines': 'Médicaments',
    'parapharmacy': 'Parapharmacie',
    'medical': 'Matériel médical'
  };

  // 1. En-tête
  doc.setFontSize(20);
  doc.text(pharmacyInfo.name, 20, yPosition);
  yPosition += 10;

  doc.setFontSize(14);
  doc.text(`Rapport d'Analyse de Stock`, 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.text(`Période: ${periodLabels[period] || period} | Catégorie: ${categoryLabels[category] || category}`, 20, yPosition);
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition + 5);
  yPosition += 15;

  // 2. Section KPIs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicateurs Clés de Performance', 20, yPosition);
  yPosition += 5;

  (doc as any).autoTable({
    startY: yPosition,
    head: [['Indicateur', 'Valeur', 'Variation']],
    body: [
      [
        'Valeur Stock Total', 
        `${formatCurrencyValue(reportData.kpis.valeurStockTotal, currencySymbol)}`, 
        `${reportData.kpis.valeurStockVariation > 0 ? '+' : ''}${reportData.kpis.valeurStockVariation.toFixed(1)}%`
      ],
      [
        'Produits en Stock', 
        reportData.kpis.produitsEnStock.toString(), 
        '-'
      ],
      [
        'Références Actives', 
        reportData.kpis.referencesActives.toString(), 
        '-'
      ],
      [
        'Alertes Critiques', 
        reportData.kpis.alertesCritiques.toString(), 
        `${reportData.kpis.ruptures} ruptures + ${reportData.kpis.peremptions} péremptions`
      ],
      [
        'Taux de Rotation', 
        reportData.kpis.tauxRotation.toFixed(2), 
        `${reportData.kpis.tauxRotationVariation > 0 ? '+' : ''}${reportData.kpis.tauxRotationVariation.toFixed(1)}%`
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // 3. Section Niveaux de Stock
  if (reportData.stockLevels.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Niveaux de Stock par Catégorie', 20, yPosition);
    yPosition += 5;

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Catégorie', 'Stock Actuel', 'Critique', 'Faible', 'Limite', 'Valorisation', 'Statut']],
      body: reportData.stockLevels.map(level => [
        level.categorie,
        level.stock_actuel.toString(),
        level.stock_critique.toString(),
        level.stock_faible.toString(),
        level.stock_limite.toString(),
        formatCurrencyValue(level.valorisation, currencySymbol),
        level.statut.toUpperCase()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      styles: { fontSize: 9 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 4. Section Alertes Critiques
  if (reportData.criticalStock.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Produits en Alerte Critique', 20, yPosition);
    yPosition += 5;

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Produit', 'Stock', 'Limite', 'Statut', 'Expiration']],
      body: reportData.criticalStock.slice(0, 15).map(item => [
        item.produit,
        item.stock_actuel.toString(),
        item.stock_limite.toString(),
        item.statut.toUpperCase(),
        item.expiration || 'N/A'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      styles: { fontSize: 8 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Section Péremptions
  if (reportData.expiryAlerts.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Alertes de Péremption', 20, yPosition);
    yPosition += 5;

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Produit', 'Lot', 'Quantité', 'Expiration', 'Jours Restants', 'Urgence']],
      body: reportData.expiryAlerts.slice(0, 15).map(alert => [
        alert.produit,
        alert.lot,
        alert.quantite.toString(),
        new Date(alert.expiration).toLocaleDateString('fr-FR'),
        alert.jours_restants.toString(),
        alert.urgence.toUpperCase()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [251, 146, 60], textColor: 255 },
      styles: { fontSize: 8 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 6. Section Résumé des Mouvements
  if (reportData.movementHistory.length > 0) {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé des Mouvements', 20, yPosition);
    yPosition += 5;

    const totalEntrees = reportData.movementHistory.reduce((sum, m) => sum + m.entrees, 0);
    const totalSorties = reportData.movementHistory.reduce((sum, m) => sum + m.sorties, 0);
    const soldeFinal = totalEntrees - totalSorties;

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Période', 'Total Entrées', 'Total Sorties', 'Solde']],
      body: [
        [
          periodLabels[period] || period,
          totalEntrees.toString(),
          totalSorties.toString(),
          soldeFinal.toString()
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 9 }
    });
  }

  // 7. Pied de page sur toutes les pages
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(
      `${pharmacyInfo.name} - Rapport de Stock - Page ${i}/${pageCount}`,
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // 8. Téléchargement
  doc.save(`rapport-stock-${period}-${Date.now()}.pdf`);
};

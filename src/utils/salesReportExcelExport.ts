import * as XLSX from 'xlsx';
import type { AnalyticsKPI, TopProductAnalytics, StaffPerformanceData, CategoryBreakdown, PaymentMethodBreakdown } from '@/hooks/useSalesAnalytics';

export interface ExcelReportData {
  kpis: AnalyticsKPI;
  topProducts: TopProductAnalytics[];
  staffPerformance: StaffPerformanceData[];
  categoryData: CategoryBreakdown[];
  paymentMethods: PaymentMethodBreakdown[];
}

interface TenantInfo {
  companyName: string;
  logoUrl?: string;
}

/**
 * Export sales analytics to Excel file
 */
export async function exportSalesReportToExcel(
  reportData: ExcelReportData,
  period: string,
  category: string,
  tenantInfo: TenantInfo
): Promise<void> {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // === Sheet 1: KPIs ===
  const kpisData = [
    ['RAPPORT D\'ANALYTICS VENTES'],
    [`Entreprise: ${tenantInfo.companyName}`],
    [`Période: ${getPeriodLabel(period)}`],
    [`Catégorie: ${getCategoryLabel(category)}`],
    [`Généré le: ${new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}`],
    [],
    ['Indicateur', 'Valeur', 'Variation (%)'],
    ['Chiffre d\'Affaires', reportData.kpis.caTotal.toFixed(0) + ' FCFA', reportData.kpis.caVariation.toFixed(1)],
    ['Nombre de Transactions', reportData.kpis.transactions.toString(), reportData.kpis.transactionsVariation.toFixed(1)],
    ['Panier Moyen', reportData.kpis.panierMoyen.toFixed(0) + ' FCFA', reportData.kpis.panierMoyenVariation.toFixed(1)],
    ['Clients Uniques', reportData.kpis.clientsUniques.toString(), reportData.kpis.clientsUniquesVariation.toFixed(1)],
  ];
  const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
  
  // Styling for KPIs sheet
  wsKPIs['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');

  // === Sheet 2: Top Products ===
  if (reportData.topProducts && reportData.topProducts.length > 0) {
    const productsData = [
      ['TOP 10 PRODUITS'],
      [],
      ['Produit', 'Catégorie', 'Quantité', 'CA (FCFA)', 'Marge (FCFA)', '% du CA'],
    ];
    
    reportData.topProducts.forEach(product => {
      productsData.push([
        product.libelle,
        product.categorie || 'N/A',
        product.quantite.toString(),
        product.ca.toFixed(0),
        product.marge.toFixed(0),
        product.pourcentage_ca.toFixed(1) + '%',
      ]);
    });

    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    wsProducts['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Produits');
  }

  // === Sheet 3: Staff Performance ===
  if (reportData.staffPerformance && reportData.staffPerformance.length > 0) {
    const staffData = [
      ['PERFORMANCE DU PERSONNEL'],
      [],
      ['Agent', 'CA (FCFA)', 'Transactions', 'Panier Moyen (FCFA)', 'Performance (%)'],
    ];
    
    reportData.staffPerformance.forEach(staff => {
      staffData.push([
        staff.nom,
        staff.ca.toFixed(0),
        staff.transactions.toString(),
        staff.panier_moyen.toFixed(0),
        staff.performance.toFixed(1) + '%',
      ]);
    });

    const wsStaff = XLSX.utils.aoa_to_sheet(staffData);
    wsStaff['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsStaff, 'Performance Personnel');
  }

  // === Sheet 4: Categories Breakdown ===
  if (reportData.categoryData && reportData.categoryData.length > 0) {
    const categoriesData = [
      ['RÉPARTITION PAR CATÉGORIE'],
      [],
      ['Catégorie', 'Montant (FCFA)', 'Pourcentage (%)'],
    ];
    
    reportData.categoryData.forEach(cat => {
      categoriesData.push([
        cat.name,
        cat.value.toFixed(0),
        cat.percentage.toFixed(1) + '%',
      ]);
    });

    const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);
    wsCategories['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Catégories');
  }

  // === Sheet 5: Payment Methods ===
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    const paymentData = [
      ['MODES DE PAIEMENT'],
      [],
      ['Mode', 'Montant (FCFA)', 'Transactions', 'Pourcentage (%)'],
    ];
    
    reportData.paymentMethods.forEach(payment => {
      paymentData.push([
        payment.name,
        payment.montant.toFixed(0),
        payment.transactions.toString(),
        payment.pourcentage.toFixed(1) + '%',
      ]);
    });

    const wsPayment = XLSX.utils.aoa_to_sheet(paymentData);
    wsPayment['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsPayment, 'Modes de Paiement');
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Rapport_Analytics_${period}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
}

/**
 * Get period label in French
 */
function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    day: "Aujourd'hui",
    week: 'Cette semaine',
    month: 'Ce mois',
    year: 'Cette année',
    custom: 'Période personnalisée',
  };
  return labels[period] || period;
}

/**
 * Get category label in French
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    all: 'Toutes catégories',
    medicines: 'Médicaments',
    parapharmacy: 'Parapharmacie',
    medical: 'Dispositifs médicaux',
  };
  return labels[category] || category;
}

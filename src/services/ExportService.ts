import { LowStockItem } from '@/hooks/useLowStockData';
import { StockAlert } from '@/hooks/useStockAlerts';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeMetrics?: boolean;
  includeCharts?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    categories?: string[];
    statuses?: string[];
    urgencyLevels?: string[];
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename: string;
  error?: string;
}

export class ExportService {
  /**
   * Export low stock data
   */
  static async exportLowStockData(
    items: LowStockItem[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const filename = `stock_faible_${new Date().toISOString().split('T')[0]}.${options.format}`;

      switch (options.format) {
        case 'csv':
          return await this.exportToCSV(items, filename);
        case 'excel':
          return await this.exportToExcel(items, filename, options);
        case 'pdf':
          return await this.exportToPDF(items, filename, options);
        default:
          throw new Error('Format d\'export non supporté');
      }
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        downloadUrl: '',
        filename: ''
      };
    }
  }

  static async exportABCAnalysisData(items: any[], options: ExportOptions): Promise<ExportResult> {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `analyse-abc-${timestamp}`;

      switch (options.format) {
        case 'csv':
          return await this.exportABCToCSV(items, filename);
        case 'excel':
          return await this.exportABCToExcel(items, filename, options);
        case 'pdf':
          return await this.exportABCToPDF(items, filename, options);
        default:
          throw new Error('Format d\'export non supporté');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export ABC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        downloadUrl: '',
        filename: ''
      };
    }
  }

  // Méthodes spécifiques pour l'analyse ABC
  static async exportABCToCSV(items: any[], filename: string): Promise<ExportResult> {
    try {
      const csvHeader = 'Produit,Catégorie,Classe ABC,Chiffre d\'Affaires,% CA,% Cumulé,Quantité Vendue,Rotation,Stock Actuel\n';
      const csvRows = items.map(item => 
        `"${item.nom}","${item.categorie}","${item.classe}",${item.chiffreAffaires},${item.pourcentageCA.toFixed(2)},${item.pourcentageCumule.toFixed(2)},${item.quantiteVendue},${item.rotation.toFixed(2)},${item.stockActuel}`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      return {
        success: true,
        downloadUrl: url,
        filename: `${filename}.csv`,
        error: ''
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'export CSV',
        downloadUrl: '',
        filename: ''
      };
    }
  }

  static async exportABCToExcel(items: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    return this.exportABCToCSV(items, filename);
  }

  static async exportABCToPDF(items: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const htmlContent = this.generateABCHTMLReport(items, options);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      return {
        success: true,
        downloadUrl: url,
        filename: `${filename}.html`,
        error: ''
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'export PDF',
        downloadUrl: '',
        filename: ''
      };
    }
  }

  static generateABCHTMLReport(items: any[], options: ExportOptions): string {
    const totalCA = items.reduce((sum, item) => sum + item.chiffreAffaires, 0);
    const classeACount = items.filter(item => item.classe === 'A').length;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Analyse ABC - Rapport Détaillé</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
          th { background-color: #f8f9fa; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Analyse ABC - Classification Pareto</h1>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Classe</th>
              <th>CA</th>
              <th>% CA</th>
              <th>% Cumulé</th>
              <th>Qté Vendue</th>
              <th>Rotation</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td>${item.nom}</td>
                <td>${item.categorie}</td>
                <td><strong>${item.classe}</strong></td>
                <td>${item.chiffreAffaires.toLocaleString('fr-FR')} €</td>
                <td>${item.pourcentageCA.toFixed(2)}%</td>
                <td>${item.pourcentageCumule.toFixed(2)}%</td>
                <td>${item.quantiteVendue.toLocaleString('fr-FR')}</td>
                <td>${item.rotation.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
        filename: '',
        error: error instanceof Error ? error.message : 'Erreur d\'export'
      };
    }
  }

  /**
   * Export alerts data
   */
  static async exportAlertsData(
    alerts: StockAlert[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const filename = `alertes_stock_${new Date().toISOString().split('T')[0]}.${options.format}`;

      switch (options.format) {
        case 'csv':
          return await this.exportAlertsToCSV(alerts, filename);
        case 'excel':
          return await this.exportAlertsToExcel(alerts, filename);
        case 'pdf':
          return await this.exportAlertsToPDF(alerts, filename);
        default:
          throw new Error('Format d\'export non supporté');
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Erreur d\'export'
      };
    }
  }

  /**
   * Export to CSV format
   */
  private static async exportToCSV(items: LowStockItem[], filename: string): Promise<ExportResult> {
    const headers = [
      'Code Produit',
      'Nom Produit', 
      'DCI',
      'Quantité Actuelle',
      'Seuil Minimum',
      'Seuil Optimal',
      'Unité',
      'Catégorie',
      'Fournisseur Principal',
      'Prix Unitaire',
      'Valeur Stock',
      'Dernier Mouvement',
      'Statut',
      'Rotation',
      'Jours sans Mouvement'
    ];

    const rows = items.map(item => [
      item.codeProduit,
      item.nomProduit,
      item.dci,
      item.quantiteActuelle.toString(),
      item.seuilMinimum.toString(),
      item.seuilOptimal.toString(),
      item.unite,
      item.categorie,
      item.fournisseurPrincipal,
      item.prixUnitaire.toString(),
      item.valeurStock.toString(),
      item.dernierMouvement ? item.dernierMouvement.toLocaleDateString() : 'N/A',
      item.statut,
      item.rotation,
      item.jours_sans_mouvement.toString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    return {
      success: true,
      downloadUrl: url,
      filename
    };
  }

  /**
   * Export to Excel format (simplified - would use a library like xlsx in production)
   */
  private static async exportToExcel(
    items: LowStockItem[], 
    filename: string, 
    options: ExportOptions
  ): Promise<ExportResult> {
    // For now, we'll export as CSV with .xlsx extension
    // In production, you'd use a library like 'xlsx' or 'exceljs'
    console.log('Excel export would use xlsx library in production');
    
    return await this.exportToCSV(items, filename.replace('.xlsx', '.csv'));
  }

  /**
   * Export to PDF format (simplified - would use a library like jsPDF in production)
   */
  private static async exportToPDF(
    items: LowStockItem[], 
    filename: string, 
    options: ExportOptions
  ): Promise<ExportResult> {
    // This would use jsPDF or similar in production
    console.log('PDF export would use jsPDF library in production');
    
    // For now, create a simple HTML report and print
    const htmlContent = this.generateHTMLReport(items, options);
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      downloadUrl: url,
      filename: filename.replace('.pdf', '.html')
    };
  }

  /**
   * Export alerts to CSV
   */
  private static async exportAlertsToCSV(alerts: StockAlert[], filename: string): Promise<ExportResult> {
    const headers = [
      'ID Alerte',
      'Type',
      'Produit',
      'Niveau Urgence',
      'Message',
      'Quantité Actuelle',
      'Quantité Seuil',
      'Jours Restants',
      'Statut',
      'Date Alerte',
      'Date Traitement'
    ];

    const rows = alerts.map(alert => [
      alert.id,
      alert.type,
      alert.produit_libelle,
      alert.niveau_urgence,
      alert.message,
      alert.quantite_actuelle.toString(),
      (alert.quantite_seuil || '').toString(),
      (alert.jours_restants || '').toString(),
      alert.statut,
      new Date(alert.date_alerte).toLocaleDateString(),
      alert.date_traitement ? new Date(alert.date_traitement).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    return {
      success: true,
      downloadUrl: url,
      filename
    };
  }

  /**
   * Export alerts to Excel (placeholder)
   */
  private static async exportAlertsToExcel(alerts: StockAlert[], filename: string): Promise<ExportResult> {
    return await this.exportAlertsToCSV(alerts, filename.replace('.xlsx', '.csv'));
  }

  /**
   * Export alerts to PDF (placeholder)
   */
  private static async exportAlertsToPDF(alerts: StockAlert[], filename: string): Promise<ExportResult> {
    const htmlContent = this.generateAlertsHTMLReport(alerts);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      downloadUrl: url,
      filename: filename.replace('.pdf', '.html')
    };
  }

  /**
   * Generate HTML report for low stock items
   */
  private static generateHTMLReport(items: LowStockItem[], options: ExportOptions): string {
    const date = new Date().toLocaleDateString('fr-FR');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Stock Faible - ${date}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
          .metric { text-align: center; }
          .metric h3 { margin: 0; color: #d32f2f; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .critical { background-color: #ffebee; }
          .low { background-color: #fff3e0; }
          .attention { background-color: #f3e5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rapport de Stock Faible</h1>
          <p>Généré le ${date}</p>
        </div>
        
        ${options.includeMetrics ? `
        <div class="metrics">
          <div class="metric">
            <h3>${items.filter(i => i.statut === 'critique').length}</h3>
            <p>Produits Critiques</p>
          </div>
          <div class="metric">
            <h3>${items.filter(i => i.statut === 'faible').length}</h3>
            <p>Stock Faible</p>
          </div>
          <div class="metric">
            <h3>${items.length}</h3>
            <p>Total Produits</p>
          </div>
          <div class="metric">
            <h3>${items.reduce((sum, i) => sum + i.valeurStock, 0).toLocaleString()} F</h3>
            <p>Valeur à Risque</p>
          </div>
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Produit</th>
              <th>Stock Actuel</th>
              <th>Seuil Min</th>
              <th>Statut</th>
              <th>Valeur</th>
              <th>Fournisseur</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr class="${item.statut}">
                <td>${item.codeProduit}</td>
                <td>${item.nomProduit}</td>
                <td>${item.quantiteActuelle}</td>
                <td>${item.seuilMinimum}</td>
                <td>${item.statut.toUpperCase()}</td>
                <td>${item.valeurStock.toLocaleString()} F</td>
                <td>${item.fournisseurPrincipal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML report for alerts
   */
  private static generateAlertsHTMLReport(alerts: StockAlert[]): string {
    const date = new Date().toLocaleDateString('fr-FR');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Alertes Stock - ${date}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .critique { background-color: #ffebee; }
          .eleve { background-color: #fff3e0; }
          .moyen { background-color: #f3e5f5; }
          .faible { background-color: #e8f5e8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rapport des Alertes de Stock</h1>
          <p>Généré le ${date}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Produit</th>
              <th>Urgence</th>
              <th>Message</th>
              <th>Date Alerte</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${alerts.map(alert => `
              <tr class="${alert.niveau_urgence}">
                <td>${alert.type}</td>
                <td>${alert.produit_libelle}</td>
                <td>${alert.niveau_urgence.toUpperCase()}</td>
                <td>${alert.message}</td>
                <td>${new Date(alert.date_alerte).toLocaleDateString('fr-FR')}</td>
                <td>${alert.statut}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
}
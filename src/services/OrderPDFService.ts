import { ExportResult } from './ExportService';

export interface OrderPDFData {
  id: string;
  numero: string;
  fournisseur: any;
  dateCommande: string;
  dateLivraison: string;
  statut: string;
  responsable?: string;
}

export interface OrderLine {
  id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  remise?: number;
  produit?: {
    libelle_produit: string;
    code_cip?: string;
  };
  commande_id?: string;
}

export class OrderPDFService {
  
  static async generateOrderPDF(order: OrderPDFData, orderLines: OrderLine[] = []): Promise<ExportResult> {
    try {
      // Calculate totals
      const subtotalHT = orderLines.reduce((sum, line) => {
        const lineTotal = line.quantite * line.prix_unitaire;
        const remise = (line.remise || 0) / 100;
        return sum + (lineTotal - (lineTotal * remise));
      }, 0);
      
      const centimeAdditionnel = subtotalHT * 0.05; // 5%
      const tva = (subtotalHT + centimeAdditionnel) * 0.18; // 18%
      const totalTTC = subtotalHT + centimeAdditionnel + tva;
      
      // Generate HTML content
      const htmlContent = this.generateOrderHTML(order, orderLines, {
        subtotalHT,
        centimeAdditionnel,
        tva,
        totalTTC
      });
      
      // Create blob and download URL
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const filename = `commande_${order.numero}_${new Date().toISOString().split('T')[0]}.html`;
      
      return {
        success: true,
        downloadUrl,
        filename
      };
      
    } catch (error) {
      console.error('Erreur génération PDF commande:', error);
      return {
        success: false,
        downloadUrl: '',
        filename: '',
        error: 'Erreur lors de la génération du document'
      };
    }
  }
  
  private static generateOrderHTML(
    order: OrderPDFData, 
    orderLines: OrderLine[], 
    totals: { subtotalHT: number; centimeAdditionnel: number; tva: number; totalTTC: number }
  ): string {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bon de Commande ${order.numero}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 28px;
        }
        .order-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 25px;
        }
        .order-info h3 {
            margin: 0 0 10px 0;
            color: #1e293b;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            color: #64748b;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status.en-cours { background: #e2e8f0; color: #475569; }
        .status.confirme { background: #dbeafe; color: #1e40af; }
        .status.expedie { background: #fef3c7; color: #92400e; }
        .status.livre { background: #d1fae5; color: #065f46; }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        th, td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f1f5f9;
            font-weight: bold;
            color: #1e293b;
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
        }
        .totals h3 {
            margin: 0 0 15px 0;
            color: #1e293b;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 4px 0;
        }
        .total-line.final {
            border-top: 2px solid #3b82f6;
            padding-top: 12px;
            margin-top: 15px;
            font-weight: bold;
            font-size: 18px;
            color: #3b82f6;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BON DE COMMANDE</h1>
            <div style="text-align: right;">
                <div style="font-size: 18px; font-weight: bold;">${order.numero}</div>
                <div style="color: #64748b;">Généré le ${currentDate}</div>
            </div>
        </div>

        <div class="order-info">
            <h3>Informations Commande</h3>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="info-label">Fournisseur:</span><br>
                        ${order.fournisseur?.nom || 'Non spécifié'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date commande:</span><br>
                        ${new Date(order.dateCommande).toLocaleDateString('fr-FR')}
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="info-label">Date livraison prévue:</span><br>
                        ${new Date(order.dateLivraison).toLocaleDateString('fr-FR')}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Statut:</span><br>
                        <span class="status ${order.statut.toLowerCase().replace(' ', '-')}">${order.statut}</span>
                    </div>
                </div>
            </div>
            ${order.responsable ? `
            <div class="info-item" style="margin-top: 15px;">
                <span class="info-label">Responsable:</span> ${order.responsable}
            </div>
            ` : ''}
        </div>

        <h3>Détail des articles</h3>
        <table>
            <thead>
                <tr>
                    <th>Article</th>
                    <th>Code CIP</th>
                    <th class="text-right">Quantité</th>
                    <th class="text-right">Prix unitaire</th>
                    <th class="text-right">Remise</th>
                    <th class="text-right">Total HT</th>
                </tr>
            </thead>
            <tbody>
                ${orderLines.length > 0 ? orderLines.map(line => {
                  const lineTotal = line.quantite * line.prix_unitaire;
                  const remiseAmount = lineTotal * ((line.remise || 0) / 100);
                  const totalLine = lineTotal - remiseAmount;
                  
                  return `
                <tr>
                    <td>${line.produit?.libelle_produit || 'Produit'}</td>
                    <td>${line.produit?.code_cip || '-'}</td>
                    <td class="text-right">${line.quantite}</td>
                    <td class="text-right">${line.prix_unitaire.toLocaleString()} F CFA</td>
                    <td class="text-right">${line.remise || 0}%</td>
                    <td class="text-right">${totalLine.toLocaleString()} F CFA</td>
                </tr>
                  `;
                }).join('') : `
                <tr>
                    <td colspan="6" style="text-align: center; color: #64748b; font-style: italic;">
                        Aucun article dans cette commande
                    </td>
                </tr>
                `}
            </tbody>
        </table>

        <div class="totals">
            <h3>Récapitulatif financier</h3>
            <div class="total-line">
                <span>Sous-total HT:</span>
                <span>${totals.subtotalHT.toLocaleString()} F CFA</span>
            </div>
            <div class="total-line">
                <span>Centime Additionnel (5%):</span>
                <span>${totals.centimeAdditionnel.toLocaleString()} F CFA</span>
            </div>
            <div class="total-line">
                <span>TVA (18%):</span>
                <span>${totals.tva.toLocaleString()} F CFA</span>
            </div>
            <div class="total-line final">
                <span>TOTAL TTC:</span>
                <span>${totals.totalTTC.toLocaleString()} F CFA</span>
            </div>
        </div>

        <div class="footer">
            <p><strong>Note:</strong> Ce bon de commande est généré automatiquement par le système de gestion.</p>
            <p>Les prix indiqués sont en Francs CFA (F CFA) et incluent les taxes applicables.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}
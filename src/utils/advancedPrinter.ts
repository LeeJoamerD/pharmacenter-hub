import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PrintConfig {
  printerType: 'thermal' | 'a4' | 'label';
  printerName?: string;
  paperSize?: 'thermal_80mm' | 'thermal_58mm' | 'a4' | 'label_40x30mm';
  autoprint?: boolean;
  logo?: string;
}

export interface TransactionForPrint {
  numero_facture: string;
  date_vente: string;
  client?: {
    nom_complet: string;
    telephone?: string;
  };
  agent?: {
    noms: string;
    prenoms: string;
  };
  lignes_ventes: Array<{
    produit: { libelle_produit: string };
    quantite: number;
    prix_unitaire: number;
    montant_ligne_ttc: number;
  }>;
  montant_brut: number;
  montant_remise: number;
  montant_net: number;
  montant_tva: number;
  mode_paiement: string;
  montant_recu?: number;
  monnaie_rendue?: number;
}

/**
 * Gestionnaire d'impression avancé
 * Supporte tickets thermiques, factures A4, et étiquettes
 */
class AdvancedPrinter {
  private config: PrintConfig;

  constructor(config?: Partial<PrintConfig>) {
    this.config = {
      printerType: 'thermal',
      paperSize: 'thermal_80mm',
      autoprint: false,
      ...config,
    };
  }

  /**
   * Imprimer un ticket thermique (80mm)
   */
  async printThermalReceipt(transaction: TransactionForPrint): Promise<void> {
    const width = this.config.paperSize === 'thermal_58mm' ? 58 : 80;
    const receiptHTML = this.generateThermalHTML(transaction, width);

    if (this.config.autoprint) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    } else {
      // Afficher aperçu
      this.showPrintPreview(receiptHTML);
    }
  }

  /**
   * Imprimer une facture A4
   */
  async printA4Invoice(transaction: TransactionForPrint, pharmacyInfo: any): Promise<void> {
    const doc = new jsPDF();

    // En-tête avec logo
    if (this.config.logo) {
      doc.addImage(this.config.logo, 'PNG', 10, 10, 30, 30);
    }

    // Informations pharmacie
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(pharmacyInfo.nom_pharmacie || 'Pharmacie', 50, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(pharmacyInfo.adresse || '', 50, 27);
    doc.text(`Tél: ${pharmacyInfo.telephone || ''}`, 50, 32);
    doc.text(`NIU: ${pharmacyInfo.niu || ''}`, 50, 37);

    // Titre facture
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', 105, 60, { align: 'center' });

    // Infos facture
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`N°: ${transaction.numero_facture}`, 150, 20);
    doc.text(`Date: ${new Date(transaction.date_vente).toLocaleString('fr-FR')}`, 150, 27);

    // Client
    if (transaction.client) {
      doc.setFont('helvetica', 'bold');
      doc.text('Client:', 10, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(transaction.client.nom_complet, 10, 87);
      if (transaction.client.telephone) {
        doc.text(`Tél: ${transaction.client.telephone}`, 10, 94);
      }
    }

    // Tableau des produits
    const tableData = transaction.lignes_ventes.map(ligne => [
      ligne.produit.libelle_produit,
      ligne.quantite.toString(),
      ligne.prix_unitaire.toFixed(2),
      ligne.montant_ligne_ttc.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 105,
      head: [['Produit', 'Qté', 'Prix U.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 },
    });

    // Totaux
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Montant brut:`, 120, finalY);
    doc.text(`${transaction.montant_brut.toFixed(2)} FCFA`, 170, finalY, { align: 'right' });
    
    doc.text(`Remise:`, 120, finalY + 7);
    doc.text(`-${transaction.montant_remise.toFixed(2)} FCFA`, 170, finalY + 7, { align: 'right' });
    
    doc.text(`TVA:`, 120, finalY + 14);
    doc.text(`${transaction.montant_tva.toFixed(2)} FCFA`, 170, finalY + 14, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL:`, 120, finalY + 25);
    doc.text(`${transaction.montant_net.toFixed(2)} FCFA`, 170, finalY + 25, { align: 'right' });

    // Pied de page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Merci de votre confiance', 105, 280, { align: 'center' });

    // Sauvegarder ou imprimer
    if (this.config.autoprint) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`Facture_${transaction.numero_facture}.pdf`);
    }
  }

  /**
   * Imprimer une étiquette produit
   */
  async printProductLabel(product: any, quantity: number = 1): Promise<void> {
    const labelHTML = this.generateLabelHTML(product);
    
    for (let i = 0; i < quantity; i++) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(labelHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
      
      // Délai entre chaque impression
      if (i < quantity - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Générer HTML pour ticket thermique
   */
  private generateThermalHTML(transaction: TransactionForPrint, width: number): string {
    const widthPx = width === 80 ? '302px' : '220px';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket ${transaction.numero_facture}</title>
        <style>
          @page { size: ${width}mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            width: ${widthPx}; 
            font-family: 'Courier New', monospace; 
            font-size: 12px;
            padding: 10px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 16px; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="center bold large">PHARMACIE</div>
        <div class="center">Adresse pharmacie</div>
        <div class="center">Tél: 06 000 00 00</div>
        <div class="line"></div>
        
        <div class="center bold">TICKET DE VENTE</div>
        <div>N°: ${transaction.numero_facture}</div>
        <div>Date: ${new Date(transaction.date_vente).toLocaleString('fr-FR')}</div>
        ${transaction.client ? `<div>Client: ${transaction.client.nom_complet}</div>` : ''}
        <div class="line"></div>

        <table>
          ${transaction.lignes_ventes.map(ligne => `
            <tr>
              <td colspan="3">${ligne.produit.libelle_produit}</td>
            </tr>
            <tr>
              <td>${ligne.quantite} x ${ligne.prix_unitaire.toFixed(2)}</td>
              <td class="right">${ligne.montant_ligne_ttc.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>

        <div class="line"></div>
        <table>
          <tr>
            <td>Montant brut:</td>
            <td class="right">${transaction.montant_brut.toFixed(2)} FCFA</td>
          </tr>
          <tr>
            <td>Remise:</td>
            <td class="right">-${transaction.montant_remise.toFixed(2)} FCFA</td>
          </tr>
          <tr>
            <td>TVA:</td>
            <td class="right">${transaction.montant_tva.toFixed(2)} FCFA</td>
          </tr>
          <tr class="bold">
            <td>TOTAL:</td>
            <td class="right">${transaction.montant_net.toFixed(2)} FCFA</td>
          </tr>
        </table>

        <div class="line"></div>
        <div>Mode: ${transaction.mode_paiement}</div>
        ${transaction.montant_recu ? `
          <div>Reçu: ${transaction.montant_recu.toFixed(2)} FCFA</div>
          <div>Monnaie: ${transaction.monnaie_rendue?.toFixed(2)} FCFA</div>
        ` : ''}

        <div class="line"></div>
        <div class="center">Merci de votre confiance!</div>
        ${transaction.agent ? `
          <div class="center">Servi par: ${transaction.agent.noms} ${transaction.agent.prenoms}</div>
        ` : ''}
      </body>
      </html>
    `;
  }

  /**
   * Générer HTML pour étiquette produit
   */
  private generateLabelHTML(product: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Étiquette ${product.code_cip}</title>
        <style>
          @page { size: 40mm 30mm; margin: 0; }
          body { 
            width: 40mm; 
            height: 30mm; 
            font-family: Arial, sans-serif; 
            font-size: 8px;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .name { font-weight: bold; font-size: 9px; }
          .price { font-size: 12px; font-weight: bold; }
          .barcode { font-family: 'Courier New', monospace; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="name">${product.libelle_produit}</div>
        <div class="price">${product.prix_vente_ttc.toFixed(2)} FCFA</div>
        <div class="barcode">${product.code_cip}</div>
      </body>
      </html>
    `;
  }

  /**
   * Afficher aperçu d'impression
   */
  private showPrintPreview(html: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(config: Partial<PrintConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Test d'impression
   */
  async testPrint(): Promise<void> {
    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test d'impression</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="center">
          <h1>Test d'impression</h1>
          <p>Si vous voyez ce message, votre imprimante est correctement configurée.</p>
          <p>Type: ${this.config.printerType}</p>
          <p>Format: ${this.config.paperSize}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(testHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }
}

// Instance globale
let printerInstance: AdvancedPrinter | null = null;

/**
 * Obtenir l'instance de l'imprimante
 */
export const getPrinter = (config?: Partial<PrintConfig>): AdvancedPrinter => {
  if (!printerInstance) {
    printerInstance = new AdvancedPrinter(config);
  } else if (config) {
    printerInstance.updateConfig(config);
  }
  return printerInstance;
};

export default AdvancedPrinter;

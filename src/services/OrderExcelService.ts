import * as XLSX from 'xlsx';

export interface OrderExcelData {
  id: string;
  numero: string;
  fournisseur: any;
  dateCommande: string;
  dateLivraison: string;
  statut: string;
  responsable?: string;
  montantHT?: number;
  montantTVA?: number;
  montantCAdd?: number;
  montantASDI?: number;
  montantTTC?: number;
}

export interface OrderExcelLine {
  id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  produit?: {
    libelle_produit: string;
    code_cip?: string;
    ancien_code_cip?: string;
  };
}

export class OrderExcelService {
  
  static async generateOrderExcel(order: OrderExcelData, orderLines: OrderExcelLine[]): Promise<void> {
    // Préparer les données des lignes
    const lignesData = orderLines.map(line => ({
      'Article': line.produit?.libelle_produit || 'Produit',
      'Code CIP': line.produit?.code_cip || '-',
      'Ancien Code CIP': line.produit?.ancien_code_cip || '-',
      'Quantité': line.quantite,
      'Prix Unitaire': line.prix_unitaire,
      'Total Ligne HT': line.quantite * line.prix_unitaire
    }));
    
    // Créer le workbook
    const wb = XLSX.utils.book_new();
    
    // Feuille 1 : Informations de la commande
    const infoData = [
      ['BON DE COMMANDE', order.numero],
      [''],
      ['Fournisseur', typeof order.fournisseur === 'object' ? order.fournisseur?.nom : order.fournisseur || 'Non spécifié'],
      ['Date Commande', new Date(order.dateCommande).toLocaleDateString('fr-FR')],
      ['Date Livraison', new Date(order.dateLivraison).toLocaleDateString('fr-FR')],
      ['Statut', order.statut],
      ['Responsable', order.responsable || '-'],
      [''],
      ['RÉCAPITULATIF FINANCIER'],
      ['Sous-total HT', order.montantHT || 0],
      ['TVA (18%)', order.montantTVA || 0],
      ['Centime Additionnel (1%)', order.montantCAdd || 0],
      ['ASDI (0.42%)', order.montantASDI || 0],
      ['TOTAL TTC', order.montantTTC || 0]
    ];
    
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    
    // Définir la largeur des colonnes
    wsInfo['!cols'] = [
      { wch: 25 },
      { wch: 30 }
    ];
    
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations');
    
    // Feuille 2 : Détail des articles
    const wsLignes = XLSX.utils.json_to_sheet(lignesData);
    
    // Définir la largeur des colonnes pour les articles
    wsLignes['!cols'] = [
      { wch: 40 },  // Article
      { wch: 15 },  // Code CIP
      { wch: 18 },  // Ancien Code CIP
      { wch: 12 },  // Quantité
      { wch: 15 },  // Prix Unitaire
      { wch: 18 }   // Total Ligne HT
    ];
    
    XLSX.utils.book_append_sheet(wb, wsLignes, 'Articles');
    
    // Télécharger le fichier
    const filename = `commande_${order.numero}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
}

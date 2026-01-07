import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

export interface OrderLineTotals {
  sousTotal: number;
  remiseAmount: number;
  total: number;
}

export interface OrderTotals {
  sousTotal: number;
  totalRemises: number;
  tva: number;
  totalGeneral: number;
}

export class OrderCalculationService {
  static calculateLineTotals(
    quantite: number,
    prixUnitaire: number,
    remisePourcent: number = 0
  ): OrderLineTotals {
    const sousTotal = quantite * prixUnitaire;
    const remiseAmount = (sousTotal * remisePourcent) / 100;
    const total = sousTotal - remiseAmount;

    return {
      sousTotal,
      remiseAmount,
      total
    };
  }

  static calculateOrderTotals(
    lignes: Array<{
      quantite: number;
      prixUnitaire: number;
      remise?: number;
    }>,
    tauxTVA: number = 0.18 // 18% par défaut
  ): OrderTotals {
    let sousTotal = 0;
    let totalRemises = 0;

    lignes.forEach(ligne => {
      const lineTotals = this.calculateLineTotals(
        ligne.quantite,
        ligne.prixUnitaire,
        ligne.remise || 0
      );
      sousTotal += lineTotals.sousTotal;
      totalRemises += lineTotals.remiseAmount;
    });

    const montantApresRemise = sousTotal - totalRemises;
    const tva = montantApresRemise * tauxTVA;
    const totalGeneral = montantApresRemise + tva;

    return {
      sousTotal,
      totalRemises,
      tva,
      totalGeneral
    };
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ` ${DEFAULT_SETTINGS.currency.symbol}`;
  }

  static generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `CMD-${year}${month}-${timestamp}`;
  }

  static calculateDeliveryDate(
    commandeDate: Date,
    delaiLivraisonJours: number = 7
  ): Date {
    const deliveryDate = new Date(commandeDate);
    deliveryDate.setDate(deliveryDate.getDate() + delaiLivraisonJours);
    return deliveryDate;
  }

  static validateOrderLine(ligne: {
    produit_id: string;
    quantite: number;
    prixUnitaire: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!ligne.produit_id) {
      errors.push('Produit requis');
    }

    if (ligne.quantite <= 0) {
      errors.push('La quantité doit être supérieure à 0');
    }

    if (ligne.prixUnitaire < 0) {
      errors.push('Le prix unitaire ne peut pas être négatif');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateOrder(order: {
    fournisseur_id: string;
    lignes: Array<{
      produit_id: string;
      quantite: number;
      prixUnitaire: number;
    }>;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!order.fournisseur_id) {
      errors.push('Fournisseur requis');
    }

    if (!order.lignes || order.lignes.length === 0) {
      errors.push('Au moins une ligne de commande est requise');
    }

    order.lignes.forEach((ligne, index) => {
      const lineValidation = this.validateOrderLine(ligne);
      if (!lineValidation.isValid) {
        errors.push(`Ligne ${index + 1}: ${lineValidation.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
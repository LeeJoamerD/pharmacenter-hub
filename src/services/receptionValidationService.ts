import { supabase } from '@/integrations/supabase/client';

export interface ReceptionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ReceptionLineValidation {
  produit_id: string;
  quantite_commandee: number;
  quantite_recue: number;
  quantite_acceptee: number;
  numero_lot: string;
  date_expiration?: string;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class ReceptionValidationService {
  /**
   * Valide une réception complète
   */
  static async validateReception(receptionData: {
    commande_id?: string;
    fournisseur_id: string;
    reference_facture?: string;
    lignes: Array<{
      produit_id: string;
      quantite_commandee: number;
      quantite_recue: number;
      quantite_acceptee: number;
      numero_lot: string;
      date_expiration?: string;
      statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
      commentaire?: string;
    }>;
  }): Promise<ReceptionValidationResult> {
    const result: ReceptionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Validation de base
      if (!receptionData.fournisseur_id) {
        result.errors.push('Fournisseur obligatoire');
        result.isValid = false;
      }

      if (!receptionData.lignes || receptionData.lignes.length === 0) {
        result.errors.push('Au moins une ligne de réception est requise');
        result.isValid = false;
      }

      // Valider la commande si spécifiée
      if (receptionData.commande_id) {
        const orderValidation = await this.validateOrderForReception(receptionData.commande_id);
        result.errors.push(...orderValidation.errors);
        result.warnings.push(...orderValidation.warnings);
        result.suggestions.push(...orderValidation.suggestions);
        
        if (orderValidation.errors.length > 0) {
          result.isValid = false;
        }
      }

      // Valider chaque ligne
      for (const ligne of receptionData.lignes) {
        const lineValidation = await this.validateReceptionLine(ligne);
        result.errors.push(...lineValidation.errors);
        result.warnings.push(...lineValidation.warnings);
        result.suggestions.push(...lineValidation.suggestions);
        
        if (lineValidation.errors.length > 0) {
          result.isValid = false;
        }
      }

      // Validation des lots
      const lotValidation = this.validateLotNumbers(receptionData.lignes);
      result.errors.push(...lotValidation.errors);
      result.warnings.push(...lotValidation.warnings);

      // Validation des écarts de réception
      const discrepancyValidation = this.validateReceptionDiscrepancies(receptionData.lignes);
      result.warnings.push(...discrepancyValidation.warnings);
      result.suggestions.push(...discrepancyValidation.suggestions);

    } catch (error) {
      result.errors.push('Erreur lors de la validation de la réception');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valide une commande pour réception
   */
  private static async validateOrderForReception(commandeId: string): Promise<ReceptionValidationResult> {
    const result: ReceptionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      const { data: order, error } = await supabase
        .from('commandes_fournisseurs')
        .select('*')
        .eq('id', commandeId)
        .single();

      if (error || !order) {
        result.errors.push('Commande introuvable');
        result.isValid = false;
        return result;
      }

      // Vérifier le statut de la commande
      if (order.statut === 'Annulé') {
        result.errors.push('Impossible de recevoir une commande annulée');
        result.isValid = false;
      }

      if (order.statut === 'Livré') {
        result.warnings.push('Cette commande a déjà été marquée comme livrée');
      }

      // Vérifier s'il y a déjà des réceptions partielles
      const { data: existingReceptions } = await supabase
        .from('receptions_fournisseurs')
        .select('*')
        .eq('commande_id', commandeId);

      if (existingReceptions && existingReceptions.length > 0) {
        result.warnings.push('Des réceptions partielles existent déjà pour cette commande');
        result.suggestions.push('Vérifiez les quantités déjà reçues pour éviter les doublons');
      }

    } catch (error) {
      result.errors.push('Erreur lors de la validation de la commande');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valide une ligne de réception
   */
  private static async validateReceptionLine(ligne: {
    produit_id: string;
    quantite_commandee: number;
    quantite_recue: number;
    quantite_acceptee: number;
    numero_lot: string;
    date_expiration?: string;
    statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
    commentaire?: string;
  }): Promise<ReceptionLineValidation> {
    const result: ReceptionLineValidation = {
      ...ligne,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Validation du produit
      const { data: product, error } = await supabase
        .from('produits')
        .select('*')
        .eq('id', ligne.produit_id)
        .single();

      if (error || !product) {
        result.errors.push(`Produit introuvable (ID: ${ligne.produit_id})`);
        return result;
      }

      // Validation des quantités
      if (ligne.quantite_recue < 0) {
        result.errors.push('La quantité reçue ne peut pas être négative');
      }

      if (ligne.quantite_acceptee < 0) {
        result.errors.push('La quantité acceptée ne peut pas être négative');
      }

      if (ligne.quantite_acceptee > ligne.quantite_recue) {
        result.errors.push('La quantité acceptée ne peut pas être supérieure à la quantité reçue');
      }

      // Validation du numéro de lot
      if (!ligne.numero_lot || ligne.numero_lot.trim() === '') {
        result.errors.push('Numéro de lot obligatoire');
      } else {
        // Vérifier si le lot existe déjà
        const existingLot = await this.checkExistingLot(ligne.produit_id, ligne.numero_lot);
        if (existingLot) {
          result.warnings.push(`Lot ${ligne.numero_lot} existe déjà pour ce produit`);
          result.suggestions.push('Vérifiez si ce n\'est pas un doublon ou utilisez un numéro de lot différent');
        }
      }

      // Validation de la date d'expiration
      if (ligne.date_expiration) {
        const expirationDate = new Date(ligne.date_expiration);
        const today = new Date();
        const daysToExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (expirationDate <= today) {
          result.errors.push('Produit déjà expiré');
        } else if (daysToExpiry <= 30) {
          result.warnings.push(`Produit expire dans ${daysToExpiry} jours`);
        } else if (daysToExpiry <= 90) {
          result.warnings.push(`Date d'expiration proche: ${daysToExpiry} jours`);
        }

        // Vérifier la cohérence avec d'autres lots du même produit
        const avgExpiryDays = await this.getAverageExpiryDays(ligne.produit_id);
        if (avgExpiryDays > 0 && Math.abs(daysToExpiry - avgExpiryDays) > avgExpiryDays * 0.5) {
          result.warnings.push('Date d\'expiration inhabituelle pour ce produit');
        }
      } else if ((product as any).forme_pharmaceutique) {
        result.warnings.push('Date d\'expiration manquante pour un produit pharmaceutique');
      }

      // Validation des écarts de quantité
      const quantityDifference = ligne.quantite_recue - ligne.quantite_commandee;
      const percentageDifference = ligne.quantite_commandee > 0 ? 
        Math.abs(quantityDifference) / ligne.quantite_commandee * 100 : 0;

      if (quantityDifference !== 0) {
        if (percentageDifference > 10) {
          result.warnings.push(
            `Écart important de quantité: ${quantityDifference > 0 ? '+' : ''}${quantityDifference} unités (${percentageDifference.toFixed(1)}%)`
          );
        } else if (percentageDifference > 5) {
          result.suggestions.push(
            `Léger écart de quantité: ${quantityDifference > 0 ? '+' : ''}${quantityDifference} unités`
          );
        }
      }

      // Validation du statut de conformité
      if (ligne.statut === 'non-conforme' && ligne.quantite_acceptee > 0) {
        result.warnings.push('Quantité acceptée pour un produit non-conforme');
      }

      if (ligne.statut === 'conforme' && ligne.quantite_acceptee < ligne.quantite_recue) {
        result.suggestions.push('Produit conforme mais quantité acceptée partielle - Vérifiez le motif');
      }

      // Validation du commentaire pour les non-conformités
      if ((ligne.statut === 'non-conforme' || ligne.statut === 'partiellement-conforme') && 
          (!ligne.commentaire || ligne.commentaire.trim() === '')) {
        result.warnings.push('Commentaire recommandé pour les produits non-conformes');
      }

    } catch (error) {
      result.errors.push(`Erreur lors de la validation de la ligne: ${error}`);
    }

    return result;
  }

  /**
   * Valide les numéros de lot
   */
  private static validateLotNumbers(lignes: Array<{ numero_lot: string; produit_id: string }>): ReceptionValidationResult {
    const result: ReceptionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Vérifier les doublons de lots dans la même réception
    const lotNumbers = lignes.map(l => `${l.produit_id}-${l.numero_lot}`);
    const duplicates = lotNumbers.filter((lot, index) => lotNumbers.indexOf(lot) !== index);

    if (duplicates.length > 0) {
      result.errors.push('Numéros de lot en double détectés dans la réception');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valide les écarts de réception
   */
  private static validateReceptionDiscrepancies(lignes: Array<{
    quantite_commandee: number;
    quantite_recue: number;
    quantite_acceptee: number;
  }>): ReceptionValidationResult {
    const result: ReceptionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const totalCommanded = lignes.reduce((sum, l) => sum + l.quantite_commandee, 0);
    const totalReceived = lignes.reduce((sum, l) => sum + l.quantite_recue, 0);
    const totalAccepted = lignes.reduce((sum, l) => sum + l.quantite_acceptee, 0);

    const receptionRate = totalCommanded > 0 ? (totalReceived / totalCommanded) * 100 : 0;
    const acceptanceRate = totalReceived > 0 ? (totalAccepted / totalReceived) * 100 : 0;

    if (receptionRate < 90) {
      result.warnings.push(`Taux de réception faible: ${receptionRate.toFixed(1)}%`);
      result.suggestions.push('Contactez le fournisseur pour les quantités manquantes');
    }

    if (acceptanceRate < 95) {
      result.warnings.push(`Taux d'acceptation faible: ${acceptanceRate.toFixed(1)}%`);
      result.suggestions.push('Analysez les causes de non-conformité avec le fournisseur');
    }

    if (receptionRate > 110) {
      result.warnings.push(`Sur-livraison détectée: ${receptionRate.toFixed(1)}%`);
      result.suggestions.push('Vérifiez s\'il y a eu une erreur ou si c\'est un bonus fournisseur');
    }

    return result;
  }

  /**
   * Vérifie si un lot existe déjà
   */
  private static async checkExistingLot(produitId: string, numeroLot: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select('id')
        .eq('produit_id', produitId)
        .eq('numero_lot', numeroLot)
        .limit(1);

      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calcule la durée moyenne d'expiration pour un produit
   */
  private static async getAverageExpiryDays(produitId: string): Promise<number> {
    try {
      const { data: lots } = await supabase
        .from('lots')
        .select('date_peremption, date_reception')
        .eq('produit_id', produitId)
        .not('date_peremption', 'is', null)
        .not('date_reception', 'is', null)
        .limit(10);

      if (!lots || lots.length === 0) return 0;

      const avgDays = lots.reduce((sum, lot) => {
        const expiry = new Date(lot.date_peremption!);
        const reception = new Date(lot.date_reception!);
        const days = Math.ceil((expiry.getTime() - reception.getTime()) / (1000 * 3600 * 24));
        return sum + days;
      }, 0) / lots.length;

      return avgDays;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Génère un rapport de réception
   */
  static generateReceptionReport(receptionData: {
    lignes: Array<{
      produit_id: string;
      quantite_commandee: number;
      quantite_recue: number;
      quantite_acceptee: number;
      statut: string;
    }>;
  }): {
    summary: {
      totalLines: number;
      totalCommanded: number;
      totalReceived: number;
      totalAccepted: number;
      receptionRate: number;
      acceptanceRate: number;
      conformityRate: number;
    };
    byStatus: Record<string, number>;
  } {
    const summary = {
      totalLines: receptionData.lignes.length,
      totalCommanded: receptionData.lignes.reduce((sum, l) => sum + l.quantite_commandee, 0),
      totalReceived: receptionData.lignes.reduce((sum, l) => sum + l.quantite_recue, 0),
      totalAccepted: receptionData.lignes.reduce((sum, l) => sum + l.quantite_acceptee, 0),
      receptionRate: 0,
      acceptanceRate: 0,
      conformityRate: 0
    };

    summary.receptionRate = summary.totalCommanded > 0 ? 
      (summary.totalReceived / summary.totalCommanded) * 100 : 0;
    
    summary.acceptanceRate = summary.totalReceived > 0 ? 
      (summary.totalAccepted / summary.totalReceived) * 100 : 0;

    const conformLines = receptionData.lignes.filter(l => l.statut === 'conforme').length;
    summary.conformityRate = summary.totalLines > 0 ? 
      (conformLines / summary.totalLines) * 100 : 0;

    const byStatus = receptionData.lignes.reduce((acc, ligne) => {
      acc[ligne.statut] = (acc[ligne.statut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { summary, byStatus };
  }

  /**
   * Valide la possibilité de modification d'une réception
   */
  static async canModifyReception(receptionId: string): Promise<{ canModify: boolean; reason?: string }> {
    try {
      // Pour l'instant, on autorise toujours la modification des réceptions
      // Cette logique peut être étendue selon les besoins métier
      return { canModify: true };
    } catch (error) {
      return { canModify: false, reason: 'Erreur lors de la vérification' };
    }
  }
}
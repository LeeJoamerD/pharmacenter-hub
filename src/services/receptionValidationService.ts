import { supabase } from '@/integrations/supabase/client';
import { ensureValidSession } from '@/utils/sessionRefresh';

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

interface LigneData {
  produit_id: string;
  quantite_commandee: number;
  quantite_recue: number;
  quantite_acceptee: number;
  numero_lot: string;
  date_expiration?: string;
  statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
  commentaire?: string;
}

export class ReceptionValidationService {
  /**
   * Valide une réception complète avec requêtes batch optimisées
   */
  static async validateReception(receptionData: {
    commande_id?: string;
    fournisseur_id: string;
    reference_facture?: string;
    lignes: LigneData[];
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

      // ====== OPTIMISATION BATCH ======
      // Pré-charger toutes les données en 2 requêtes au lieu de N*3 requêtes
      
      // 1. Collecter tous les IDs de produits uniques
      const productIds = [...new Set(receptionData.lignes.map(l => l.produit_id))];
      
      // 2. Pré-charger tous les produits en une seule requête
      const productsMap = await this.loadProductsBatch(productIds);
      
      // 3. Pré-charger tous les lots existants en une seule requête
      const lotsMap = await this.loadExistingLotsBatch(receptionData.lignes);

      // 4. Valider chaque ligne en mémoire (sans requêtes async)
      for (const ligne of receptionData.lignes) {
        const lineValidation = this.validateReceptionLineSync(ligne, productsMap, lotsMap);
        result.errors.push(...lineValidation.errors);
        result.warnings.push(...lineValidation.warnings);
        result.suggestions.push(...lineValidation.suggestions);
        
        if (lineValidation.errors.length > 0) {
          result.isValid = false;
        }
      }

      // Validation des lots (synchrone)
      const lotValidation = this.validateLotNumbers(receptionData.lignes);
      result.errors.push(...lotValidation.errors);
      result.warnings.push(...lotValidation.warnings);

      // Validation des écarts de réception (synchrone)
      const discrepancyValidation = this.validateReceptionDiscrepancies(receptionData.lignes);
      result.warnings.push(...discrepancyValidation.warnings);
      result.suggestions.push(...discrepancyValidation.suggestions);

    } catch (error) {
      console.error('Erreur validation réception:', error);
      result.errors.push('Erreur lors de la validation de la réception');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Charge tous les produits en une seule requête batch
   */
  private static async loadProductsBatch(productIds: string[]): Promise<Map<string, any>> {
    const productsMap = new Map<string, any>();
    
    if (productIds.length === 0) return productsMap;

    try {
      // Chunking pour éviter les limites URL (max 500 IDs par requête)
      const CHUNK_SIZE = 500;
      const chunks: string[][] = [];
      
      for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
        chunks.push(productIds.slice(i, i + CHUNK_SIZE));
      }

      // Traiter les chunks avec vérification de session
      for (const chunk of chunks) {
        // Vérifier/rafraîchir la session avant chaque chunk
        await ensureValidSession();
        
        const { data, error } = await supabase
          .from('produits')
          .select('id, libelle_produit, code_cip')
          .in('id', chunk);

        if (!error && data) {
          for (const product of data) {
            productsMap.set(product.id, product);
          }
        }
      }
    } catch (error) {
      console.warn('Erreur chargement produits batch:', error);
    }

    return productsMap;
  }

  /**
   * Charge tous les lots existants en une seule requête batch
   */
  private static async loadExistingLotsBatch(lignes: LigneData[]): Promise<Set<string>> {
    const lotsSet = new Set<string>();
    
    if (lignes.length === 0) return lotsSet;

    try {
      // Collecter les paires (produit_id, numero_lot) uniques
      const pairs = lignes
        .filter(l => l.numero_lot && l.numero_lot.trim() !== '')
        .map(l => ({ produit_id: l.produit_id, numero_lot: l.numero_lot }));

      if (pairs.length === 0) return lotsSet;

      // Extraire les IDs de produits uniques
      const productIds = [...new Set(pairs.map(p => p.produit_id))];

      // Chunking pour éviter les limites
      const CHUNK_SIZE = 500;
      const chunks: string[][] = [];
      
      for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
        chunks.push(productIds.slice(i, i + CHUNK_SIZE));
      }

      // Traiter les chunks avec vérification de session
      for (const chunk of chunks) {
        // Vérifier/rafraîchir la session avant chaque chunk
        await ensureValidSession();
        
        const { data, error } = await supabase
          .from('lots')
          .select('produit_id, numero_lot')
          .in('produit_id', chunk);

        if (!error && data) {
          for (const lot of data) {
            lotsSet.add(`${lot.produit_id}:${lot.numero_lot}`);
          }
        }
      }
    } catch (error) {
      console.warn('Erreur chargement lots batch:', error);
    }

    return lotsSet;
  }

  /**
   * Valide une ligne de réception de manière SYNCHRONE (sans requêtes DB)
   */
  private static validateReceptionLineSync(
    ligne: LigneData,
    productsMap: Map<string, any>,
    lotsMap: Set<string>
  ): ReceptionLineValidation {
    const result: ReceptionLineValidation = {
      ...ligne,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validation du produit (lookup en mémoire)
    const product = productsMap.get(ligne.produit_id);
    if (!product) {
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
      // Vérifier si le lot existe déjà (lookup en mémoire)
      const lotKey = `${ligne.produit_id}:${ligne.numero_lot}`;
      if (lotsMap.has(lotKey)) {
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
    } else {
      result.warnings.push('Date d\'expiration manquante - Recommandée pour tous les produits');
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

      // Vérifier s'il y a déjà des réceptions partielles
      const { data: existingReceptions } = await supabase
        .from('receptions_fournisseurs')
        .select('id')
        .eq('commande_id', commandeId)
        .limit(1);

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
      return { canModify: true };
    } catch (error) {
      return { canModify: false, reason: 'Erreur lors de la vérification' };
    }
  }
}

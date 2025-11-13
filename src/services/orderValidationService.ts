import { supabase } from '@/integrations/supabase/client';

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface OrderLineValidation {
  produit_id: string;
  quantite_commandee: number;
  prix_achat_unitaire_attendu?: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class OrderValidationService {
  /**
   * Valide une commande complète
   */
  static async validateOrder(orderData: {
    fournisseur_id: string;
    lignes: Array<{
      produit_id: string;
      quantite_commandee: number;
      prix_achat_unitaire_attendu?: number;
    }>;
  }): Promise<OrderValidationResult> {
    const result: OrderValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Validation de base
      if (!orderData.fournisseur_id) {
        result.errors.push('Fournisseur obligatoire');
        result.isValid = false;
      }

      if (!orderData.lignes || orderData.lignes.length === 0) {
        result.errors.push('Au moins une ligne de commande est requise');
        result.isValid = false;
      }

      // Valider le fournisseur
      if (orderData.fournisseur_id) {
        const supplierValidation = await this.validateSupplier(orderData.fournisseur_id);
        result.errors.push(...supplierValidation.errors);
        result.warnings.push(...supplierValidation.warnings);
        result.suggestions.push(...supplierValidation.suggestions);
        
        if (supplierValidation.errors.length > 0) {
          result.isValid = false;
        }
      }

      // Valider chaque ligne
      for (const ligne of orderData.lignes) {
        const lineValidation = await this.validateOrderLine(ligne);
        result.errors.push(...lineValidation.errors);
        result.warnings.push(...lineValidation.warnings);
        result.suggestions.push(...lineValidation.suggestions);
        
        if (lineValidation.errors.length > 0) {
          result.isValid = false;
        }
      }

      // Validation des doublons
      const duplicateValidation = this.validateDuplicateProducts(orderData.lignes);
      result.errors.push(...duplicateValidation.errors);
      result.warnings.push(...duplicateValidation.warnings);

      // Validation du montant total
      const totalValidation = await this.validateOrderTotal(orderData.lignes);
      result.warnings.push(...totalValidation.warnings);
      result.suggestions.push(...totalValidation.suggestions);

    } catch (error) {
      result.errors.push('Erreur lors de la validation de la commande');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valide un fournisseur
   */
  private static async validateSupplier(fournisseurId: string): Promise<OrderValidationResult> {
    const result: OrderValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      const { data: supplier, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .eq('id', fournisseurId)
        .single();

      if (error || !supplier) {
        result.errors.push('Fournisseur introuvable');
        result.isValid = false;
        return result;
      }

      // Vérifications des informations de contact
      if (!supplier.telephone_appel && !supplier.email) {
        result.warnings.push('Aucune information de contact pour ce fournisseur');
      }

      if (!supplier.adresse) {
        result.warnings.push('Adresse du fournisseur manquante');
      }

    } catch (error) {
      result.errors.push('Erreur lors de la validation du fournisseur');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valide une ligne de commande
   */
  private static async validateOrderLine(ligne: {
    produit_id: string;
    quantite_commandee: number;
    prix_achat_unitaire_attendu?: number;
  }): Promise<OrderLineValidation> {
    const result: OrderLineValidation = {
      ...ligne,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Validation du produit
      const { data: product, error } = await supabase
        .from('produits_with_stock')
        .select('*')
        .eq('id', ligne.produit_id)
        .single();

      if (error || !product) {
        result.errors.push(`Produit introuvable (ID: ${ligne.produit_id})`);
        return result;
      }

      if (!product.is_active) {
        result.errors.push(`Produit inactif: ${(product as any).libelle_produit || 'Nom inconnu'}`);
        return result;
      }

      // Validation de la quantité
      if (ligne.quantite_commandee <= 0) {
        result.errors.push('La quantité doit être supérieure à 0');
      }

      // Vérifier les seuils de stock
      const currentStock = (product as any).stock_actuel || 0;
      const stockLimite = (product as any).stock_limite || 0;
      const stockAlerte = (product as any).stock_alerte || 0;

      if (currentStock <= stockLimite) {
        result.suggestions.push(`Stock critique pour ${(product as any).libelle_produit || 'Produit'} (${currentStock} unités)`);
      }

      // Suggestion de quantité optimale basée sur l'alerte
      if (stockAlerte > 0) {
        const quantiteOptimale = Math.max(stockAlerte * 2 - currentStock, 0);
        if (quantiteOptimale > 0 && Math.abs(ligne.quantite_commandee - quantiteOptimale) > quantiteOptimale * 0.2) {
          result.suggestions.push(
            `Quantité suggérée pour ${(product as any).libelle_produit || 'Produit'}: ${quantiteOptimale} unités (seuil alerte: ${stockAlerte})`
          );
        }
      }

      // Validation du prix
      if (ligne.prix_achat_unitaire_attendu !== undefined) {
        if (ligne.prix_achat_unitaire_attendu < 0) {
          result.errors.push('Le prix d\'achat ne peut pas être négatif');
        }

        // Comparaison avec le prix d'achat actuel
        if ((product as any).prix_achat && ligne.prix_achat_unitaire_attendu > 0) {
          const difference = ((ligne.prix_achat_unitaire_attendu - (product as any).prix_achat) / (product as any).prix_achat) * 100;
          
          if (difference > 20) {
            result.warnings.push(
              `Prix d'achat élevé pour ${(product as any).libelle_produit || 'Produit'} (+${difference.toFixed(1)}% vs prix actuel)`
            );
          } else if (difference < -20) {
            result.warnings.push(
              `Prix d'achat très bas pour ${(product as any).libelle_produit || 'Produit'} (${difference.toFixed(1)}% vs prix actuel) - Vérifier la qualité`
            );
          }
        }
      }

    } catch (error) {
      result.errors.push(`Erreur lors de la validation de la ligne: ${error}`);
    }

    return result;
  }

  /**
   * Valide les doublons dans les lignes de commande
   */
  private static validateDuplicateProducts(lignes: Array<{ produit_id: string }>): OrderValidationResult {
    const result: OrderValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const productIds = lignes.map(l => l.produit_id);
    const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);

    if (duplicates.length > 0) {
      result.warnings.push(`Produits en double détectés. Vérifiez les lignes de commande.`);
      result.suggestions.push('Considérez la fusion des lignes pour les mêmes produits');
    }

    return result;
  }

  /**
   * Valide le montant total de la commande
   */
  private static async validateOrderTotal(lignes: Array<{
    quantite_commandee: number;
    prix_achat_unitaire_attendu?: number;
  }>): Promise<OrderValidationResult> {
    const result: OrderValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const total = lignes.reduce((sum, ligne) => {
      return sum + (ligne.quantite_commandee * (ligne.prix_achat_unitaire_attendu || 0));
    }, 0);

    if (total === 0) {
      result.warnings.push('Montant total de la commande est nul - Vérifiez les prix');
    } else if (total > 1000000) {
      result.warnings.push('Montant de commande très élevé - Validation recommandée');
    }

    return result;
  }

  /**
   * Valide la possibilité de modification d'une commande
   */
  static async canModifyOrder(commandeId: string): Promise<{ canModify: boolean; reason?: string }> {
    try {
      const { data: order, error } = await supabase
        .from('commandes_fournisseurs')
        .select('statut')
        .eq('id', commandeId)
        .single();

      if (error || !order) {
        return { canModify: false, reason: 'Commande introuvable' };
      }

      const nonModifiableStatuses = ['Expédié', 'En transit', 'Livré', 'Annulé'];
      
      if (nonModifiableStatuses.includes(order.statut || '')) {
        return { 
          canModify: false, 
          reason: `Impossible de modifier une commande avec le statut: ${order.statut}` 
        };
      }

      return { canModify: true };
    } catch (error) {
      return { canModify: false, reason: 'Erreur lors de la vérification' };
    }
  }

  /**
   * Génère des suggestions d'optimisation pour une commande
   */
  static async generateOrderOptimizations(orderData: {
    fournisseur_id: string;
    lignes: Array<{
      produit_id: string;
      quantite_commandee: number;
    }>;
  }): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // Suggestion de groupage par famille
      const productFamilies = await this.getProductFamilies(orderData.lignes.map(l => l.produit_id));
      if (productFamilies.size > 3) {
        suggestions.push('Considérez séparer cette commande par famille de produits pour une meilleure gestion');
      }

      // Suggestion basée sur les délais de livraison
      const totalQuantity = orderData.lignes.reduce((sum, l) => sum + l.quantite_commandee, 0);
      if (totalQuantity > 1000) {
        suggestions.push('Commande volumineuse - Vérifiez les délais de livraison avec le fournisseur');
      }

      // Suggestion de produits complémentaires
      const complementaryProducts = await this.findComplementaryProducts(orderData.fournisseur_id, orderData.lignes.map(l => l.produit_id));
      if (complementaryProducts.length > 0) {
        suggestions.push(`Produits complémentaires disponibles chez ce fournisseur: ${complementaryProducts.slice(0, 3).join(', ')}`);
      }

    } catch (error) {
      // Ignore errors in suggestions
    }

    return suggestions;
  }

  /**
   * Récupère les familles de produits
   */
  private static async getProductFamilies(productIds: string[]): Promise<Set<string>> {
    try {
      const { data: products } = await supabase
        .from('produits_with_stock')
        .select('famille_id')
        .in('id', productIds);

      return new Set(products?.map(p => p.famille_id).filter(Boolean) || []);
    } catch (error) {
      return new Set();
    }
  }

  /**
   * Trouve des produits complémentaires
   */
  private static async findComplementaryProducts(fournisseurId: string, currentProductIds: string[]): Promise<string[]> {
    try {
      // Cette logique pourrait être améliorée avec un algorithme de recommandation
      // Pour l'instant, on retourne des produits populaires du même fournisseur
      const { data: orders } = await supabase
        .from('commandes_fournisseurs')
        .select(`
          lignes_commande_fournisseur(
            produit_id,
            produits(libelle_produit)
          )
        `)
        .eq('fournisseur_id', fournisseurId)
        .limit(5);

      const allProducts = orders?.flatMap(o => 
        o.lignes_commande_fournisseur?.map(l => (l.produits as any)?.libelle_produit).filter(Boolean)
      ) || [];

      return [...new Set(allProducts)].filter(name => name && !currentProductIds.includes(name));
    } catch (error) {
      return [];
    }
  }
}
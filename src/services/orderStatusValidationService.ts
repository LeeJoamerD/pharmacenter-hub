export interface StatusTransition {
  from: string;
  to: string;
  allowed: boolean;
  canModify: boolean;
  requiredFields?: string[];
  description: string;
}

export interface StatusValidationResult {
  canTransition: boolean;
  canModify: boolean;
  errors: string[];
  warnings: string[];
  requiredFields: string[];
}

export class OrderStatusValidationService {
  // Define all possible order statuses in workflow order
  static readonly ORDER_STATUSES = [
    'Brouillon',
    'En cours', 
    'Confirmé',
    'Expédié',
    'Livré',
    'Réceptionné',
    'Annulé'
  ] as const;

  // Define status transition rules
  private static readonly STATUS_TRANSITIONS: StatusTransition[] = [
    // From Brouillon
    { from: 'Brouillon', to: 'En cours', allowed: true, canModify: true, description: 'Mise en cours de la commande' },
    { from: 'Brouillon', to: 'Confirmé', allowed: true, canModify: true, description: 'Confirmation directe de la commande' },
    { from: 'Brouillon', to: 'Annulé', allowed: true, canModify: false, description: 'Annulation de la commande' },
    
    // From En cours
    { from: 'En cours', to: 'Confirmé', allowed: true, canModify: true, description: 'Confirmation de la commande' },
    { from: 'En cours', to: 'Brouillon', allowed: true, canModify: true, description: 'Retour au brouillon' },
    { from: 'En cours', to: 'Annulé', allowed: true, canModify: false, description: 'Annulation de la commande' },
    
    // From Confirmé
    { from: 'Confirmé', to: 'Expédié', allowed: true, canModify: false, description: 'Expédition de la commande' },
    { from: 'Confirmé', to: 'En cours', allowed: true, canModify: true, description: 'Retour en cours (avant expédition)' },
    { from: 'Confirmé', to: 'Annulé', allowed: true, canModify: false, description: 'Annulation de la commande confirmée' },
    
    // From Expédié
    { from: 'Expédié', to: 'Livré', allowed: true, canModify: false, description: 'Livraison de la commande' },
    { from: 'Expédié', to: 'Réceptionné', allowed: true, canModify: false, description: 'Réception directe de la commande' },
    
    // From Livré
    { from: 'Livré', to: 'Réceptionné', allowed: true, canModify: false, description: 'Réception de la commande livrée' },
    
    // Terminal states - no transitions allowed
    { from: 'Réceptionné', to: '', allowed: false, canModify: false, description: 'Commande terminée' },
    { from: 'Annulé', to: '', allowed: false, canModify: false, description: 'Commande annulée' }
  ];

  /**
   * Check if a status transition is allowed
   */
  static canTransitionTo(currentStatus: string, targetStatus: string): StatusValidationResult {
    const transition = this.STATUS_TRANSITIONS.find(t => 
      t.from === currentStatus && t.to === targetStatus
    );

    if (!transition) {
      return {
        canTransition: false,
        canModify: false,
        errors: [`Transition de "${currentStatus}" vers "${targetStatus}" non autorisée`],
        warnings: [],
        requiredFields: []
      };
    }

    return {
      canTransition: transition.allowed,
      canModify: transition.canModify,
      errors: transition.allowed ? [] : [`Transition "${currentStatus}" → "${targetStatus}" interdite`],
      warnings: [],
      requiredFields: transition.requiredFields || []
    };
  }

  /**
   * Check if an order can be modified based on its current status
   */
  static canModifyOrder(currentStatus: string): StatusValidationResult {
    // Orders can be modified in draft and in-progress states
    const modifiableStatuses = ['Brouillon', 'En cours'];
    const canModify = modifiableStatuses.includes(currentStatus);

    return {
      canTransition: true,
      canModify,
      errors: canModify ? [] : [`Les commandes avec le statut "${currentStatus}" ne peuvent pas être modifiées`],
      warnings: canModify && currentStatus === 'En cours' ? 
        ['Cette commande est en cours, les modifications nécessitent une nouvelle validation'] : [],
      requiredFields: []
    };
  }

  /**
   * Get all possible next statuses for a given current status
   */
  static getNextStatuses(currentStatus: string): string[] {
    return this.STATUS_TRANSITIONS
      .filter(t => t.from === currentStatus && t.allowed)
      .map(t => t.to)
      .filter(status => status !== ''); // Remove empty targets (terminal states)
  }

  /**
   * Get status information including description and properties
   */
  static getStatusInfo(status: string) {
    const statusProperties = {
      'Brouillon': { 
        color: 'bg-gray-100 text-gray-800', 
        icon: '📝', 
        description: 'Commande en cours de préparation',
        canModify: true,
        canDelete: true
      },
      'En cours': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: '⏳', 
        description: 'Commande prête pour validation',
        canModify: true,
        canDelete: true
      },
      'Confirmé': { 
        color: 'bg-orange-100 text-orange-800', 
        icon: '✅', 
        description: 'Commande confirmée, en attente d\'expédition',
        canModify: false,
        canDelete: false
      },
      'Expédié': { 
        color: 'bg-purple-100 text-purple-800', 
        icon: '🚚', 
        description: 'Commande expédiée par le fournisseur',
        canModify: false,
        canDelete: false
      },
      'Livré': { 
        color: 'bg-indigo-100 text-indigo-800', 
        icon: '📦', 
        description: 'Commande livrée, en attente de réception',
        canModify: false,
        canDelete: false
      },
      'Réceptionné': { 
        color: 'bg-green-100 text-green-800', 
        icon: '✅', 
        description: 'Commande réceptionnée et traitée',
        canModify: false,
        canDelete: false
      },
      'Annulé': { 
        color: 'bg-red-100 text-red-800', 
        icon: '❌', 
        description: 'Commande annulée',
        canModify: false,
        canDelete: false
      }
    };

    return statusProperties[status as keyof typeof statusProperties] || {
      color: 'bg-gray-100 text-gray-800',
      icon: '❓',
      description: 'Statut inconnu',
      canModify: false,
      canDelete: false
    };
  }

  /**
   * Validate order data before saving/updating
   */
  static validateOrderData(orderData: any, targetStatus: string): StatusValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredFields: string[] = [];

    // Basic validation
    if (!orderData.fournisseur_id) {
      errors.push('Un fournisseur doit être sélectionné');
      requiredFields.push('fournisseur_id');
    }

    if (!orderData.lignes || orderData.lignes.length === 0) {
      errors.push('Au moins un produit doit être ajouté à la commande');
      requiredFields.push('lignes');
    }

    // Status-specific validation
    if (targetStatus === 'Confirmé') {
      if (!orderData.date_commande) {
        errors.push('La date de commande est requise pour la confirmation');
        requiredFields.push('date_commande');
      }

      // Check if all order lines have valid prices
      const invalidLines = orderData.lignes?.filter((line: any) => 
        !line.prix_achat_unitaire_attendu || line.prix_achat_unitaire_attendu <= 0
      );

      if (invalidLines && invalidLines.length > 0) {
        warnings.push(`${invalidLines.length} ligne(s) ont des prix invalides`);
      }
    }

    return {
      canTransition: errors.length === 0,
      canModify: true,
      errors,
      warnings,
      requiredFields
    };
  }

  /**
   * Get the logical next status in the workflow
   */
  static getNextLogicalStatus(currentStatus: string): string | null {
    const workflow = [
      'Brouillon',
      'En cours',
      'Confirmé', 
      'Expédié',
      'Livré',
      'Réceptionné'
    ];

    const currentIndex = workflow.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < workflow.length - 1) {
      return workflow[currentIndex + 1];
    }

    return null; // Already at terminal state or invalid status
  }
}
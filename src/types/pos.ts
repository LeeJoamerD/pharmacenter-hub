/**
 * Types spécifiques au Point de Vente (POS)
 */

export interface POSProduct {
  id: string;
  tenant_id: string;
  name: string;
  libelle_produit: string;
  dci?: string;
  code_cip?: string;
  
  // Prix depuis les LOTS (source de vérité) via RPC get_pos_products FIFO
  prix_vente_ht: number;
  prix_vente_ttc: number;
  taux_tva: number;
  tva_montant: number;
  taux_centime_additionnel: number;
  centime_additionnel_montant: number;
  
  // Alias pour compatibilité (à déprécier)
  price: number;
  price_ht: number;
  tva_rate: number;
  
  stock: number;
  category: string;
  requiresPrescription: boolean;
  lots: LotInfo[];
  
  // Info expiration pour affichage/blocage
  earliest_expiration_date?: string;
  has_valid_stock?: boolean;
  all_lots_expired?: boolean;
}

export interface LotInfo {
  id: string;
  numero_lot: string;
  quantite_restante: number;
  date_peremption: Date | null;
  prix_achat_unitaire: number;
  // Prix calculés depuis le lot (source de vérité pour la vente)
  prix_vente_ht?: number;
  prix_vente_ttc?: number;
  taux_tva?: number;
  montant_tva?: number;
  taux_centime_additionnel?: number;
  montant_centime_additionnel?: number;
}

export interface TransactionData {
  cart: CartItemWithLot[];
  customer: CustomerInfo;
  payment: PaymentInfo;
  session_caisse_id: string;
  caisse_id?: string;
  agent_id: string;
}

export interface CartItemWithLot {
  product: POSProduct;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
  lot?: LotInfo;
}

export type CustomerType = 'Ordinaire' | 'Conventionné' | 'Entreprise' | 'Personnel';

export interface CustomerInfo {
  id?: string;
  type: CustomerType;
  name?: string;
  phone?: string;
  email?: string;
  // Informations d'assurance
  assureur_id?: string;
  assureur_libelle?: string;
  insurance?: {
    company: string;
    number: string;
    coverage_rate: number;
  };
  // Taux et remises - discount_rate optionnel avec défaut 0
  discount_rate?: number;
  taux_remise_automatique?: number;
  taux_agent?: number;
  taux_ayant_droit?: number;
  taux_ticket_moderateur?: number;
  // Crédit et caution
  limite_credit?: number;
  peut_prendre_bon?: boolean;
  caution?: number;
  utiliser_caution?: boolean; // Choix utilisateur pour utiliser la caution
  // Références pour facturation future
  societe_id?: string;
  personnel_id?: string;
  // Alias pour compatibilité
  discountRate?: number;
}

export interface PaymentInfo {
  method: 'Espèces' | 'Carte' | 'Mobile Money' | 'Assurance';
  amount_received: number;
  change: number;
  reference?: string;
}

export interface VenteResult {
  vente_id: string;
  numero_facture: string;
  success: boolean;
  receipt_url?: string;
  error?: string;
}

export interface CashSession {
  id: string;
  tenant_id: string;
  caisse_id: string;
  numero_session: string;
  date_ouverture: string;
  date_fermeture: string | null;
  fond_caisse_ouverture: number;
  fond_caisse_fermeture: number | null;
  montant_total_ventes: number;
  montant_theorique_fermeture?: number;
  montant_reel_fermeture?: number;
  ecart?: number;
  statut: string;
  caisse?: {
    nom: string;
    description: string;
  };
  caissier?: {
    id: string;
    noms: string;
    prenoms: string;
    role: string;
  };
}

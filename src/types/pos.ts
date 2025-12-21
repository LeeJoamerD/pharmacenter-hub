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
  
  // Prix depuis la table produits (source de vérité)
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
}

export interface LotInfo {
  id: string;
  numero_lot: string;
  quantite_restante: number;
  date_peremption: Date;
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

export interface CustomerInfo {
  id?: string;
  type: 'ordinaire' | 'assure' | 'particulier';
  name?: string;
  phone?: string;
  insurance?: {
    company: string;
    number: string;
    coverage_rate: number;
  };
  discount_rate: number;
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

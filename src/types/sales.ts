// Types de base pour le module Ventes

export interface Client {
  id: number;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  type_client: 'Ordinaire' | 'Assuré' | 'Conventionné' | 'Entreprise' | 'Personnel';
  numero_assure?: string;
  assureur_id?: number;
  convention_id?: number;
  limite_credit?: number;
  solde_credit?: number;
  date_creation: Date;
  actif: boolean;
}

export interface Produit {
  id: number;
  libelle_produit: string;
  code_cip?: string;
  prix_unitaire: number;
  prix_public: number;
  taux_tva: number;
  famille_id?: number;
  dci_id?: number;
  laboratoires_id?: number;
  prescription_requise: boolean;
  stock_limite?: number;
  actif: boolean;
}

export interface Lot {
  id: number;
  produit_id: number;
  numero_lot: string;
  date_peremption: Date;
  quantite_initiale: number;
  quantite_restante: number;
  prix_achat: number;
  date_reception: Date;
  fournisseur_id?: number;
  statut: 'Actif' | 'Périmé' | 'Bloqué';
}

export interface Vente {
  id: number;
  numero_facture: string;
  date_vente: Date;
  client_id?: number;
  agent_id: number;
  caisse_id: number;
  session_caisse_id: number;
  total_ht: number;
  total_ttc: number;
  tva: number;
  remise: number;
  type_paiement: 'Espèces' | 'Carte' | 'Mobile Money' | 'Assureur' | 'Conventionné';
  statut: 'Terminée' | 'Proforma' | 'Annulée';
  is_proforma: boolean;
  montant_paye?: number;
  monnaie?: number;
  notes?: string;
  date_creation: Date;
}

export interface LigneVente {
  id: number;
  vente_id: number;
  produit_id: number;
  lot_id?: number;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  remise: number;
  taux_tva: number;
  montant_tva: number;
}

export interface SessionCaisse {
  id: number;
  caisse_id: number;
  agent_id: number;
  date_ouverture: Date;
  date_fermeture?: Date;
  montant_ouverture: number;
  montant_fermeture?: number;
  statut: 'Ouverte' | 'Fermée';
  recettes_attendues?: number;
  ecart?: number;
  observations?: string;
}

export interface DepenseCaisse {
  id: number;
  session_caisse_id: number;
  montant: number;
  description: string;
  categorie: string;
  date_depense: Date;
  justificatif?: string;
  approuve_par?: number;
}

export interface Caisse {
  id: number;
  nom: string;
  description?: string;
  emplacement?: string;
  actif: boolean;
  date_creation: Date;
}

export interface Agent {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  role: string;
  actif: boolean;
  date_embauche: Date;
}

// Types pour l'interface utilisateur
export interface CartItem {
  produit: Produit;
  lot?: Lot;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  total: number;
}

export interface PaymentMethod {
  type: Vente['type_paiement'];
  label: string;
  icon: string;
  enabled: boolean;
}

export interface PosSettings {
  show_stock: boolean;
  auto_print: boolean;
  default_payment: Vente['type_paiement'];
  sound_enabled: boolean;
  barcode_scanner: boolean;
}

export interface SalesFilters {
  date_debut?: Date;
  date_fin?: Date;
  client_id?: number;
  agent_id?: number;
  caisse_id?: number;
  statut?: Vente['statut'];
  type_paiement?: Vente['type_paiement'];
  montant_min?: number;
  montant_max?: number;
}

export interface SalesReport {
  periode: string;
  total_ventes: number;
  nombre_transactions: number;
  panier_moyen: number;
  total_remises: number;
  total_tva: number;
  repartition_paiements: Record<Vente['type_paiement'], number>;
  top_produits: Array<{
    produit: Produit;
    quantite: number;
    chiffre_affaires: number;
  }>;
  performance_agents: Array<{
    agent: Agent;
    nombre_ventes: number;
    chiffre_affaires: number;
  }>;
}

// Types pour les analytics
export interface SalesMetrics {
  today: {
    revenue: number;
    transactions: number;
    average_basket: number;
  };
  month: {
    revenue: number;
    target: number;
    progress: number;
    transactions: number;
  };
  trends: {
    revenue_trend: number;
    transaction_trend: number;
    basket_trend: number;
  };
}

export interface CustomerAnalytics {
  total_customers: number;
  new_customers_month: number;
  customer_retention: number;
  average_purchase_frequency: number;
  customer_lifetime_value: number;
  top_customers: Array<{
    client: Client;
    total_purchases: number;
    total_spent: number;
    last_purchase: Date;
  }>;
}

export interface ProductAnalytics {
  total_products_sold: number;
  revenue_by_category: Record<string, number>;
  top_selling_products: Array<{
    produit: Produit;
    quantity_sold: number;
    revenue: number;
    margin: number;
  }>;
  slow_moving_products: Array<{
    produit: Produit;
    days_since_last_sale: number;
    current_stock: number;
  }>;
}
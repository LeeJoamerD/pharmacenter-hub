/**
 * Configuration de mapping des colonnes Excel par fournisseur
 * Chaque lettre (A-T) peut être associée à un champ du tableau de réception
 */
export interface ExcelColumnMapping {
  bon_livraison?: string;        // Lettre de la colonne Excel (ex: "B")
  cip?: string;                  // Code CIP/EAN13
  produit?: string;              // Libellé du produit
  categorie_tarification?: string; // Catégorie de tarification
  quantite_commandee?: string;   // Quantité commandée
  unite_gratuite?: string;       // Unité gratuite (optionnel)
  quantite_recue?: string;       // Quantité reçue
  quantite_acceptee?: string;    // Quantité acceptée
  prix_achat?: string;           // Prix d'achat
  numero_lot?: string;           // Numéro de lot
  date_expiration?: string;      // Date d'expiration
}

export interface SupplierExcelMapping {
  id: string;
  tenant_id: string;
  fournisseur_id: string;
  mapping_config: ExcelColumnMapping;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fournisseur?: {
    id: string;
    nom: string;
  };
}

// Liste des champs du tableau de réception disponibles pour le mapping
export const RECEPTION_TABLE_FIELDS = [
  { key: 'bon_livraison', label: 'Bon de livraison' },
  { key: 'cip', label: 'CIP/EAN13' },
  { key: 'produit', label: 'Produit' },
  { key: 'categorie_tarification', label: 'Cat. Tarification' },
  { key: 'quantite_commandee', label: 'Commandé' },
  { key: 'unite_gratuite', label: 'Unité gratuite' },
  { key: 'quantite_recue', label: 'Reçu' },
  { key: 'quantite_acceptee', label: 'Accepté' },
  { key: 'prix_achat', label: 'Prix' },
  { key: 'numero_lot', label: 'Lot' },
  { key: 'date_expiration', label: 'Expiration' },
] as const;

// Lettres Excel disponibles (A à T)
export const EXCEL_COLUMNS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'
] as const;

export type ExcelColumnLetter = typeof EXCEL_COLUMNS[number];
export type ReceptionFieldKey = typeof RECEPTION_TABLE_FIELDS[number]['key'];

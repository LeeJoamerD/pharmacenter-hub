export interface ExcelReceptionLine {
  reference: string;          // Colonne D (CIP/EAN13)
  produit: string;            // Colonne E (Libellé du produit)
  quantiteCommandee: number;  // Colonne F (Qté commandée)
  quantiteRecue: number;      // Colonne H (Qté livrée)
  quantiteAcceptee: number;   // Colonne H (Qté livrée) - copie
  prixAchatReel: number;      // Colonne I (Prix de cession)
  numeroLot: string;          // Colonne M (Lot)
  dateExpiration: string;     // Colonne N (Date péremption)
  statut: 'conforme' | 'non_conforme' | 'refuse';
  produitId?: string;         // Récupéré après matching
  rowNumber: number;          // Numéro de ligne pour traçabilité
  hasParsingError?: boolean;  // Indique si la ligne a une erreur de parsing
  parsingErrorMessage?: string; // Message d'erreur de parsing
  emplacement?: string;       // Position physique du lot dans l'officine
  commentaire?: string;       // Commentaire/remarque pour cette ligne
  categorieTarificationId?: string; // Catégorie de tarification pour cette ligne
}

export interface ParseResult {
  success: boolean;
  bonLivraison?: string;      // Colonne B (N° Facture)
  lines: ExcelReceptionLine[];
  errors: ParseError[];
  warnings: ParseWarning[];
}

export interface ParseError {
  rowNumber: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseWarning {
  rowNumber: number;
  message: string;
  field: string;
}

export interface ValidationResult {
  isValid: boolean;
  validLines: ExcelReceptionLine[];
  invalidLines: ExcelReceptionLine[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  productMatches: Map<string, string>; // reference -> produit_id
}

export interface ValidationError {
  rowNumber: number;
  reference: string;
  produit: string;
  message: string;
  type: 'product_not_found' | 'invalid_quantity' | 'invalid_price' | 'invalid_date' | 'missing_field';
}

export interface ValidationWarning {
  rowNumber: number;
  reference: string;
  message: string;
  type: 'price_mismatch' | 'quantity_discrepancy' | 'expiration_soon';
}

export interface ProductMatchResult {
  matched: Map<string, string>;        // reference -> produit_id
  notFound: string[];                  // références non trouvées
  ambiguous: Map<string, string[]>;    // référence -> [produit_ids multiples]
}

export interface AutoOrderCreationResult {
  orderId: string;
  orderNumber: string;
  linesCreated: number;
}

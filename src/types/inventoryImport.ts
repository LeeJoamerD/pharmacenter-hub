export interface ExcelInventoryLine {
  codeBarres: string;         // RubCodeBarres
  numeroLot: string;          // RubNumLot
  nomProduit: string;         // RubNomProd
  prixCession: number;        // RubprixCéssion
  prixPublic: number;         // RubPrixPublique
  datePeremption: string;     // RubDatePeremption
  rayon: string;              // RubRayon
  prixPublicTTC: number;      // RubPrixPublTTC
  cip?: string;               // CIP (optionnel)
  produitId?: string;         // Récupéré après matching
  rowNumber: number;          // Numéro de ligne pour traçabilité
}

export interface InventoryParseResult {
  success: boolean;
  lines: ExcelInventoryLine[];
  errors: InventoryParseError[];
  warnings: InventoryParseWarning[];
}

export interface InventoryParseError {
  rowNumber: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface InventoryParseWarning {
  rowNumber: number;
  message: string;
  field: string;
}

export interface InventoryValidationResult {
  isValid: boolean;
  validLines: ExcelInventoryLine[];
  invalidLines: ExcelInventoryLine[];
  errors: InventoryValidationError[];
  warnings: InventoryValidationWarning[];
  productMatches: Map<string, string>; // nomProduit -> produit_id
}

export interface InventoryValidationError {
  rowNumber: number;
  nomProduit: string;
  codeBarres: string;
  message: string;
  type: 'product_not_found' | 'invalid_quantity' | 'invalid_price' | 'invalid_date' | 'missing_field';
}

export interface InventoryValidationWarning {
  rowNumber: number;
  nomProduit: string;
  message: string;
  type: 'price_mismatch' | 'product_ambiguous' | 'expiration_soon';
}

export interface ProductMatchByNameResult {
  matched: Map<string, string>;          // nomProduit -> produit_id
  notFound: string[];                    // noms non trouvés
  ambiguous: Map<string, string[]>;      // nomProduit -> [produit_ids multiples]
}

export interface InventoryImportResult {
  lotsCreated: number;
  lotsUpdated: number;
  errors: string[];
}

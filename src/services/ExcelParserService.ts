import * as XLSX from 'xlsx';
import { format, parse, isValid } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ExcelReceptionLine, 
  ParseResult, 
  ValidationResult, 
  ProductMatchResult,
  ParseError,
  ValidationError,
  ValidationWarning,
  CatalogImportLine,
  CatalogParseResult
} from '@/types/excelImport';
import type { ExcelColumnMapping } from '@/types/excelMapping';

export class ExcelParserService {
  /**
   * Convertit une lettre de colonne Excel (A-Z) en index (0-25)
   */
  static columnLetterToIndex(letter: string): number {
    return letter.toUpperCase().charCodeAt(0) - 65;
  }

  /**
   * Parse un fichier Excel/CSV et extrait les données de réception
   * @param file Fichier Excel à parser
   * @param mapping Configuration de mapping optionnelle (si non fournie, utilise le mapping par défaut)
   */
  static async parseExcelFile(file: File, mapping?: ExcelColumnMapping): Promise<ParseResult> {
    const errors: ParseError[] = [];
    const lines: ExcelReceptionLine[] = [];
    let bonLivraison: string | undefined;

    // Définir les index de colonnes basés sur le mapping ou les valeurs par défaut
    const getColIndex = (field: keyof ExcelColumnMapping, defaultLetter: string): number => {
      const letter = mapping?.[field] || defaultLetter;
      return this.columnLetterToIndex(letter);
    };

    // Index des colonnes (par défaut ou configurés)
    const colBonLivraison = getColIndex('bon_livraison', 'B');
    const colCip = getColIndex('cip', 'D');
    const colAncienCip = mapping?.ancien_code_cip ? this.columnLetterToIndex(mapping.ancien_code_cip) : -1;
    const colProduit = getColIndex('produit', 'E');
    const colQteCommandee = getColIndex('quantite_commandee', 'F');
    const colQteRecue = getColIndex('quantite_recue', 'H');
    const colPrixAchat = getColIndex('prix_achat', 'I');
    const colNumeroLot = getColIndex('numero_lot', 'M');
    const colDateExpiration = getColIndex('date_expiration', 'N');
    const colCodeBarreLot = 21; // Colonne V (index 21) - Code barre Lot

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      
      // Prendre la première feuille
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON avec header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: true // Garde les types originaux (nombres, dates)
      }) as any[][];

      if (jsonData.length < 2) {
        errors.push({
          rowNumber: 0,
          column: 'General',
          message: 'Le fichier ne contient pas assez de lignes (minimum 2 : en-tête + données)',
          severity: 'error'
        });
        return { success: false, lines: [], errors, warnings: [] };
      }

      // Ignorer la ligne d'en-tête (index 0), commencer à partir de l'index 1
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 1; // Numéro de ligne Excel (1-indexed)

        // Récupérer le bon de livraison depuis la première ligne de données
        if (i === 1 && row[colBonLivraison]) {
          bonLivraison = String(row[colBonLivraison]).trim();
        }

        // Vérifier que la ligne n'est pas vide (basé sur la colonne CIP)
        if (!row || row.length === 0 || !row[colCip]) {
          continue; // Ignorer les lignes vides
        }

        try {
          const line: ExcelReceptionLine = {
            reference: this.convertScientificToString(this.cleanString(row[colCip])),
            ancienCodeCip: colAncienCip >= 0 
              ? this.convertScientificToString(this.cleanString(row[colAncienCip])) 
              : undefined,
            produit: this.cleanString(row[colProduit]),
            quantiteCommandee: this.parseNumber(row[colQteCommandee], 0),
            quantiteRecue: this.parseNumber(row[colQteRecue], 0),
            quantiteAcceptee: this.parseNumber(row[colQteRecue], 0), // Même valeur par défaut
            prixAchatReel: this.parseNumber(row[colPrixAchat], 0),
            numeroLot: this.cleanString(row[colNumeroLot]),
            dateExpiration: this.parseDate(row[colDateExpiration]),
            statut: 'conforme',
            rowNumber,
            codeBarreLot: this.convertScientificToString(this.cleanString(row[colCodeBarreLot])) || undefined,
            regionCode: this.cleanString(row[0]) || undefined // Colonne A - Code région (BZV, PNR, etc.)
          };

          // Validation basique
          if (!line.reference) {
            errors.push({
              rowNumber,
              column: `${mapping?.cip || 'D'} (CIP/EAN13)`,
              message: 'Référence produit manquante',
              severity: 'error'
            });
            line.hasParsingError = true;
            line.parsingErrorMessage = 'Référence produit manquante';
          }

          if (line.quantiteRecue <= 0) {
            errors.push({
              rowNumber,
              column: `${mapping?.quantite_recue || 'H'} (Qté livrée)`,
              message: 'Quantité livrée doit être supérieure à 0',
              severity: 'error'
            });
            line.hasParsingError = true;
            line.parsingErrorMessage = 'Quantité livrée doit être supérieure à 0';
          }

          // Toujours ajouter la ligne, même avec erreurs
          lines.push(line);
        } catch (error) {
          errors.push({
            rowNumber,
            column: 'General',
            message: `Erreur lors du parsing de la ligne : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            severity: 'error'
          });
        }
      }

      return {
        success: errors.filter(e => e.severity === 'error').length === 0,
        bonLivraison,
        lines,
        errors,
        warnings: []
      };
    } catch (error) {
      errors.push({
        rowNumber: 0,
        column: 'General',
        message: `Erreur lors de la lecture du fichier : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        severity: 'error'
      });
      return { success: false, lines: [], errors, warnings: [] };
    }
  }

  /**
   * Parse un fichier Excel simplifié pour import depuis le catalogue global
   * Structure attendue : Libellé (A), Code CIP (B), Date Péremption (C), Quantité (D)
   * Les données sont enrichies depuis le catalogue global avec prix Pointe-Noire
   */
  static async parseCatalogImportFile(file: File): Promise<CatalogParseResult> {
    const errors: ParseError[] = [];
    const lines: CatalogImportLine[] = [];

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: true
      }) as any[][];

      if (jsonData.length < 2) {
        errors.push({
          rowNumber: 0,
          column: 'General',
          message: 'Le fichier doit contenir au moins une ligne de données',
          severity: 'error'
        });
        return { success: false, lines: [], errors };
      }

      // Colonnes fixes : A=Libellé, B=Code CIP, C=Date Péremption, D=Quantité
      const COL_LIBELLE = 0;
      const COL_CODE_CIP = 1;
      const COL_DATE_PEREMPTION = 2;
      const COL_QUANTITE = 3;

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 1;

        // Ignorer les lignes vides
        if (!row || row.length === 0 || !row[COL_CODE_CIP]) continue;

        const codeCip = this.convertScientificToString(this.cleanString(row[COL_CODE_CIP]));
        const quantite = this.parseNumber(row[COL_QUANTITE], 0);
        
        if (!codeCip) {
          errors.push({
            rowNumber,
            column: 'B (Code CIP)',
            message: 'Code CIP manquant',
            severity: 'error'
          });
          continue;
        }
        
        if (quantite <= 0) {
          errors.push({
            rowNumber,
            column: 'D (Quantité)',
            message: 'Quantité doit être supérieure à 0',
            severity: 'error'
          });
          continue;
        }

        lines.push({
          libelle: this.cleanString(row[COL_LIBELLE]),
          codeCip,
          datePeremption: this.parseDate(row[COL_DATE_PEREMPTION]),
          quantite,
          rowNumber
        });
      }

      return {
        success: errors.filter(e => e.severity === 'error').length === 0,
        lines,
        errors
      };
    } catch (error) {
      errors.push({
        rowNumber: 0,
        column: 'General',
        message: `Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        severity: 'error'
      });
      return { success: false, lines: [], errors };
    }
  }

  /**
   * Valide les données parsées et trouve les correspondances produits
   */
  static async validateReceptionData(
    lines: ExcelReceptionLine[], 
    supplierId: string,
    tenantId?: string  // Nouveau paramètre pour forcer le tenant actif
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validLines: ExcelReceptionLine[] = [];
    const invalidLines: ExcelReceptionLine[] = [];

    // Récupérer toutes les références uniques et les normaliser
    const references = [...new Set(lines.map(l => String(l.reference).trim()))];
    
    // Matcher les produits avec le tenantId fourni
    const productMatches = await this.matchProductsByReference(references, tenantId);

    // Valider chaque ligne
    for (const line of lines) {
      const produitId = productMatches.matched.get(String(line.reference).trim());
      
      if (!produitId) {
        errors.push({
          rowNumber: line.rowNumber,
          reference: line.reference,
          produit: line.produit,
          message: `Produit avec référence "${line.reference}" non trouvé dans la base de données`,
          type: 'product_not_found'
        });
        invalidLines.push(line);
        continue;
      }

      // Ajouter l'ID produit à la ligne
      line.produitId = produitId;

      // Validations supplémentaires
      if (line.quantiteRecue < 0 || line.quantiteAcceptee < 0) {
        errors.push({
          rowNumber: line.rowNumber,
          reference: line.reference,
          produit: line.produit,
          message: 'Les quantités ne peuvent pas être négatives',
          type: 'invalid_quantity'
        });
        invalidLines.push(line);
        continue;
      }

      if (line.prixAchatReel < 0) {
        errors.push({
          rowNumber: line.rowNumber,
          reference: line.reference,
          produit: line.produit,
          message: 'Le prix ne peut pas être négatif',
          type: 'invalid_price'
        });
        invalidLines.push(line);
        continue;
      }

      // Avertissements
      if (line.quantiteAcceptee > line.quantiteRecue) {
        warnings.push({
          rowNumber: line.rowNumber,
          reference: line.reference,
          message: 'Quantité acceptée supérieure à la quantité reçue',
          type: 'quantity_discrepancy'
        });
      }

      if (line.quantiteCommandee > 0 && line.quantiteRecue > line.quantiteCommandee * 1.1) {
        warnings.push({
          rowNumber: line.rowNumber,
          reference: line.reference,
          message: 'Quantité reçue dépasse de plus de 10% la quantité commandée',
          type: 'quantity_discrepancy'
        });
      }

      // Vérifier la date d'expiration
      if (line.dateExpiration) {
        try {
          const expDate = new Date(line.dateExpiration);
          const now = new Date();
          const sixMonths = new Date();
          sixMonths.setMonth(sixMonths.getMonth() + 6);

          if (expDate < now) {
            errors.push({
              rowNumber: line.rowNumber,
              reference: line.reference,
              produit: line.produit,
              message: 'Date d\'expiration dépassée',
              type: 'invalid_date'
            });
            invalidLines.push(line);
            continue;
          }

          if (expDate < sixMonths) {
            warnings.push({
              rowNumber: line.rowNumber,
              reference: line.reference,
              message: 'Produit expire dans moins de 6 mois',
              type: 'expiration_soon'
            });
          }
        } catch (error) {
          errors.push({
            rowNumber: line.rowNumber,
            reference: line.reference,
            produit: line.produit,
            message: 'Date d\'expiration invalide',
            type: 'invalid_date'
          });
          invalidLines.push(line);
          continue;
        }
      }

      validLines.push(line);
    }

    return {
      isValid: errors.length === 0,
      validLines,
      invalidLines,
      errors,
      warnings,
      productMatches: productMatches.matched,
      productCategories: productMatches.productCategories
    };
  }

  /**
   * Découpe un tableau en chunks de taille maximale
   * Utilisé pour contourner la limite Supabase de 1000 résultats par requête
   */
  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Trouve les correspondances entre références et produits
   * Utilise le chunking pour contourner la limite Supabase de 1000 résultats
   */
  static async matchProductsByReference(references: string[], tenantId?: string): Promise<ProductMatchResult> {
    const matched = new Map<string, string>();
    const notFound: string[] = [];
    const ambiguous = new Map<string, string[]>();
    const productCategories = new Map<string, string | null>();

    try {
      // Résolution du tenant : priorité au tenantId fourni par l'UI
      let effectiveTenantId = tenantId;
      
      if (!effectiveTenantId) {
        // Fallback: récupérer via auth.getUser() + personnel
        const { data: user } = await supabase.auth.getUser();
        if (user?.user) {
          const { data: personnel } = await supabase
            .from('personnel')
            .select('tenant_id')
            .eq('auth_user_id', user.user.id)
            .maybeSingle();
          
          effectiveTenantId = personnel?.tenant_id;
        }
      }

      if (!effectiveTenantId) {
        throw new Error('Pharmacie active non déterminée. Reconnectez-vous ou sélectionnez une pharmacie.');
      }

      // Normaliser et dédupliquer les références AVANT la requête
      const normalizedReferences = [...new Set(references.map(ref => String(ref).trim()))];
      
      // ✅ CHUNKING SÉQUENTIEL : chunks de 200 pour éviter l'out-of-memory
      const CHUNK_SIZE = 200;
      const referenceChunks = this.chunkArray(normalizedReferences, CHUNK_SIZE);
      
      console.log('🔍 [matchProductsByReference] Début recherche:', normalizedReferences.length, 'refs,', referenceChunks.length, 'chunks');

      // Map pour dédoublonnage par id
      const produitsMap = new Map<string, any>();

      // ✅ Séquentiel par champ, séquentiel par chunk
      const fields = ['code_cip', 'code_barre_externe', 'ancien_code_cip'] as const;
      for (const field of fields) {
        for (const chunk of referenceChunks) {
          const { data, error } = await supabase
            .from('produits')
            .select('id, libelle_produit, code_cip, ancien_code_cip, code_barre_externe, categorie_tarification_id')
            .eq('tenant_id', effectiveTenantId)
            .in(field, chunk);
          
          if (error) throw error;
          if (data) {
            for (const p of data) {
              produitsMap.set(p.id, p);
            }
          }
        }
      }

      console.log('📦 [matchProductsByReference] Total produits trouvés:', produitsMap.size);

      // Build O(1) lookup maps once instead of O(n×m) filtering
      const cipMap = new Map<string, any>();
      const ancienCipMap = new Map<string, any>();
      const barcodeMap = new Map<string, any>();

      for (const p of produitsMap.values()) {
        const cip = String(p.code_cip || '').trim();
        const ancien = String(p.ancien_code_cip || '').trim();
        const barcode = String(p.code_barre_externe || '').trim();
        if (cip) cipMap.set(cip, p);
        if (ancien) ancienCipMap.set(ancien, p);
        if (barcode) barcodeMap.set(barcode, p);
      }

      // O(1) lookup per reference
      for (const ref of references) {
        const normalizedRef = String(ref).trim();
        const match = cipMap.get(normalizedRef)
          || ancienCipMap.get(normalizedRef)
          || barcodeMap.get(normalizedRef);

        if (match) {
          matched.set(ref, match.id);
          productCategories.set(ref, match.categorie_tarification_id || null);
        } else {
          notFound.push(ref);
        }
      }

      console.log('✅ [matchProductsByReference] Résultat final:', {
        matched: matched.size,
        notFound: notFound.length
      });

      return { matched, notFound, ambiguous, productCategories };
    } catch (error) {
      console.error('Erreur lors du matching des produits:', error);
      references.forEach(ref => notFound.push(ref));
      return { matched, notFound, ambiguous, productCategories };
    }
  }

  /**
   * Formatte une date Excel en string ISO
   */
  static parseDate(value: any): string {
    if (!value) return '';

    try {
      // Si c'est déjà une date
      if (value instanceof Date) {
        let year = value.getFullYear();
        if (year < 100) year += 2000;
        const correctedDate = new Date(year, value.getMonth(), value.getDate());
        return format(correctedDate, 'yyyy-MM-dd');
      }

      // Si c'est un nombre (date Excel)
      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        let year = date.y;
        if (year < 100) year += 2000;
        return format(new Date(year, date.m - 1, date.d), 'yyyy-MM-dd');
      }

      // Si c'est une string
      if (typeof value === 'string') {
        const formats = [
          'dd/MM/yy', 'MM/dd/yy', 'dd-MM/yy',
          'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy',
          'dd-MM-yyyy', 'yyyy/MM/dd'
        ];

        for (const fmt of formats) {
          try {
            const parsed = parse(value, fmt, new Date());
            if (isValid(parsed)) {
              return format(parsed, 'yyyy-MM-dd');
            }
          } catch {
            continue;
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Erreur parsing date:', error);
      return '';
    }
  }

  /**
   * Parse un nombre depuis une valeur Excel
   */
  static parseNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }

    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Nettoie une string Excel
   */
  static cleanString(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  /**
   * Convertit la notation scientifique d'Excel en chaîne de chiffres
   * Ex: "4.0085E+12" → "4008500130452"
   */
  static convertScientificToString(value: string): string {
    if (!value) return value;
    
    // Si c'est déjà un nombre normal (pas de notation scientifique), le retourner
    if (!/[eE][+-]?\d+/.test(value)) {
      return value;
    }
    
    // Convertir en nombre puis en chaîne avec précision
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Utiliser toFixed(0) pour éviter les décimales
    return num.toFixed(0);
  }
}

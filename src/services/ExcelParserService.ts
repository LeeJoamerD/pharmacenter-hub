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
  ValidationWarning
} from '@/types/excelImport';

export class ExcelParserService {
  /**
   * Parse un fichier Excel/CSV et extrait les données de réception
   */
  static async parseExcelFile(file: File): Promise<ParseResult> {
    const errors: ParseError[] = [];
    const lines: ExcelReceptionLine[] = [];
    let bonLivraison: string | undefined;

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
        raw: false
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
        if (i === 1 && row[1]) {
          bonLivraison = String(row[1]).trim();
        }

        // Vérifier que la ligne n'est pas vide
        if (!row || row.length === 0 || !row[3]) {
          continue; // Ignorer les lignes vides
        }

        try {
          const line: ExcelReceptionLine = {
            reference: this.cleanString(row[3]), // Colonne D (CIP/EAN13)
            produit: this.cleanString(row[4]), // Colonne E (Libellé du produit)
            quantiteCommandee: this.parseNumber(row[5], 0), // Colonne F
            quantiteRecue: this.parseNumber(row[7], 0), // Colonne H
            quantiteAcceptee: this.parseNumber(row[7], 0), // Colonne H (même valeur)
            prixAchatReel: this.parseNumber(row[8], 0), // Colonne I
            numeroLot: this.cleanString(row[12]), // Colonne M
            dateExpiration: this.parseDate(row[13]), // Colonne N
            statut: 'conforme',
            rowNumber
          };

          // Validation basique
          if (!line.reference) {
            errors.push({
              rowNumber,
              column: 'D (CIP/EAN13)',
              message: 'Référence produit manquante',
              severity: 'error'
            });
            continue;
          }

          if (line.quantiteRecue <= 0) {
            errors.push({
              rowNumber,
              column: 'H (Qté livrée)',
              message: 'Quantité livrée doit être supérieure à 0',
              severity: 'error'
            });
            continue;
          }

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
   * Valide les données parsées et trouve les correspondances produits
   */
  static async validateReceptionData(
    lines: ExcelReceptionLine[], 
    supplierId: string
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validLines: ExcelReceptionLine[] = [];
    const invalidLines: ExcelReceptionLine[] = [];

    // Récupérer toutes les références uniques
    const references = [...new Set(lines.map(l => l.reference))];
    
    // Matcher les produits
    const productMatches = await this.matchProductsByReference(references);

    // Valider chaque ligne
    for (const line of lines) {
      const produitId = productMatches.matched.get(line.reference);
      
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
      productMatches: productMatches.matched
    };
  }

  /**
   * Trouve les correspondances entre références et produits
   */
  static async matchProductsByReference(references: string[]): Promise<ProductMatchResult> {
    const matched = new Map<string, string>();
    const notFound: string[] = [];
    const ambiguous = new Map<string, string[]>();

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('Utilisateur non authentifié');

      const personnelQuery = (supabase as any)
        .from('personnel')
        .select('tenant_id')
        .eq('user_id', user.user.id)
        .single();
      
      const { data: personnel } = await personnelQuery;

      if (!personnel) throw new Error('Personnel non trouvé');

      // Rechercher les produits par référence (CIP ou code-barres externe)
      const { data: produits, error } = await (supabase
        .from('produits')
        .select('id, libelle_produit, code_cip, code_barre_externe')
        .eq('tenant_id', personnel.tenant_id)
        .or(`code_cip.in.(${references.join(',')}),code_barre_externe.in.(${references.join(',')})`) as any);

      if (error) throw error;

      const matched = new Map<string, string>();
      const notFound: string[] = [];
      const ambiguous = new Map<string, string[]>();

      for (const ref of references) {
        const matchingProducts = produits?.filter(p => 
          p.code_cip === ref || p.code_barre_externe === ref
        ) || [];
        
        if (matchingProducts.length === 0) {
          notFound.push(ref);
        } else if (matchingProducts.length === 1) {
          matched.set(ref, matchingProducts[0].id);
        } else {
          ambiguous.set(ref, matchingProducts.map(p => p.id));
        }
      }

      return { matched, notFound, ambiguous };
    } catch (error) {
      console.error('Erreur lors du matching des produits:', error);
      references.forEach(ref => notFound.push(ref));
      return { matched, notFound, ambiguous };
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
        return format(value, 'yyyy-MM-dd');
      }

      // Si c'est un nombre (date Excel)
      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        return format(new Date(date.y, date.m - 1, date.d), 'yyyy-MM-dd');
      }

      // Si c'est une string
      if (typeof value === 'string') {
        // Essayer différents formats
        const formats = [
          'yyyy-MM-dd',
          'dd/MM/yyyy',
          'MM/dd/yyyy',
          'dd-MM-yyyy',
          'yyyy/MM/dd'
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
}

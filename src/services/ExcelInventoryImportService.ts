import * as XLSX from 'xlsx';
import { format, parse, isValid } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ExcelInventoryLine, 
  InventoryParseResult, 
  InventoryValidationResult, 
  ProductMatchByNameResult,
  InventoryParseError,
  InventoryValidationError,
  InventoryValidationWarning,
  InventoryImportResult
} from '@/types/inventoryImport';

export class ExcelInventoryImportService {
  /**
   * Parse un fichier Excel d'inventaire
   */
  static async parseInventoryFile(file: File): Promise<InventoryParseResult> {
    const errors: InventoryParseError[] = [];
    const lines: ExcelInventoryLine[] = [];

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
          message: 'Le fichier ne contient pas assez de lignes',
          severity: 'error'
        });
        return { success: false, lines: [], errors, warnings: [] };
      }

      // Parser chaque ligne (ignorer l'en-tête)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 1;

        if (!row || row.length === 0 || !row[2]) {
          continue; // Ignorer les lignes vides
        }

        try {
          const line: ExcelInventoryLine = {
            codeBarres: this.cleanString(row[0]),              // RubCodeBarres
            numeroLot: this.cleanString(row[1]),               // RubNumLot
            nomProduit: this.cleanString(row[2]),              // RubNomProd
            prixCession: this.parseNumber(row[3], 0),          // RubprixCéssion
            prixPublic: this.parseNumber(row[4], 0),           // RubPrixPublique
            datePeremption: this.parseDate(row[5]),            // RubDatePeremption
            rayon: this.cleanString(row[6]),                   // RubRayon
            prixPublicTTC: this.parseNumber(row[7], 0),        // RubPrixPublTTC
            cip: row[8] ? this.cleanString(row[8]) : undefined, // CIP (optionnel)
            rowNumber
          };

          // Validation basique
          if (!line.nomProduit) {
            errors.push({
              rowNumber,
              column: 'RubNomProd',
              message: 'Nom du produit manquant',
              severity: 'error'
            });
            continue;
          }

          if (!line.numeroLot) {
            errors.push({
              rowNumber,
              column: 'RubNumLot',
              message: 'Numéro de lot manquant',
              severity: 'error'
            });
            continue;
          }

          lines.push(line);
        } catch (error) {
          errors.push({
            rowNumber,
            column: 'General',
            message: `Erreur lors du parsing : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            severity: 'error'
          });
        }
      }

      return {
        success: errors.filter(e => e.severity === 'error').length === 0,
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
   * Valide les données d'inventaire et match les produits par nom
   */
  static async validateInventoryData(
    lines: ExcelInventoryLine[],
    tenantId: string
  ): Promise<InventoryValidationResult> {
    const errors: InventoryValidationError[] = [];
    const warnings: InventoryValidationWarning[] = [];
    const validLines: ExcelInventoryLine[] = [];
    const invalidLines: ExcelInventoryLine[] = [];

    // Extraire les noms de produits uniques
    const uniqueProductNames = [...new Set(lines.map(l => l.nomProduit))];
    
    console.log('🔍 Recherche produits pour noms:', uniqueProductNames);
    
    // Matcher les produits par nom
    const matchResult = await this.matchProductsByName(uniqueProductNames, tenantId);
    
    console.log('📦 Produits trouvés:', matchResult);

    // Valider chaque ligne
    for (const line of lines) {
      const produitId = matchResult.matched.get(line.nomProduit);
      
      if (!produitId) {
        errors.push({
          rowNumber: line.rowNumber,
          nomProduit: line.nomProduit,
          codeBarres: line.codeBarres,
          message: `Produit "${line.nomProduit}" non trouvé dans la base de données`,
          type: 'product_not_found'
        });
        invalidLines.push(line);
        continue;
      }

      // Vérifier s'il y a ambiguïté
      const ambiguousIds = matchResult.ambiguous.get(line.nomProduit);
      if (ambiguousIds && ambiguousIds.length > 1) {
        warnings.push({
          rowNumber: line.rowNumber,
          nomProduit: line.nomProduit,
          message: `Plusieurs produits trouvés pour "${line.nomProduit}". Le premier sera utilisé.`,
          type: 'product_ambiguous'
        });
      }

      // Ajouter l'ID du produit
      line.produitId = produitId;
      validLines.push(line);
    }

    return {
      isValid: errors.length === 0,
      validLines,
      invalidLines,
      errors,
      warnings,
      productMatches: matchResult.matched
    };
  }

  /**
   * Matcher les produits par nom (recherche approximative)
   */
  private static async matchProductsByName(
    productNames: string[],
    tenantId: string
  ): Promise<ProductMatchByNameResult> {
    const matched = new Map<string, string>();
    const notFound: string[] = [];
    const ambiguous = new Map<string, string[]>();

    for (const nomProduit of productNames) {
      console.log(`  Recherche "${nomProduit}"...`);
      
      // Recherche exacte d'abord
      let { data: products, error } = await supabase
        .from('produits')
        .select('id, libelle_produit')
        .eq('tenant_id', tenantId)
        .ilike('libelle_produit', nomProduit)
        .limit(10);

      if (error) {
        console.error('Erreur lors de la recherche:', error);
        notFound.push(nomProduit);
        continue;
      }

      // Si aucun résultat exact, essayer une recherche partielle
      if (!products || products.length === 0) {
        ({ data: products, error } = await supabase
          .from('produits')
          .select('id, libelle_produit')
          .eq('tenant_id', tenantId)
          .ilike('libelle_produit', `%${nomProduit}%`)
          .limit(10));

        if (error || !products || products.length === 0) {
          console.log(`    → Produit non trouvé`);
          notFound.push(nomProduit);
          continue;
        }
      }

      console.log(`    → ${products.length} produit(s) trouvé(s)`);

      if (products.length === 1) {
        matched.set(nomProduit, products[0].id);
      } else if (products.length > 1) {
        // Plusieurs produits trouvés - prendre le premier mais signaler l'ambiguïté
        matched.set(nomProduit, products[0].id);
        ambiguous.set(nomProduit, products.map(p => p.id));
      }
    }

    return { matched, notFound, ambiguous };
  }

  /**
   * Importer les lots d'inventaire dans la base de données
   */
  static async importInventoryLots(
    validLines: ExcelInventoryLine[],
    tenantId: string
  ): Promise<InventoryImportResult> {
    let lotsCreated = 0;
    let lotsUpdated = 0;
    const errors: string[] = [];

    for (const line of validLines) {
      try {
        // Vérifier si le lot existe déjà
        const { data: existingLot } = await supabase
          .from('lots')
          .select('id, quantite_restante')
          .eq('tenant_id', tenantId)
          .eq('produit_id', line.produitId!)
          .eq('numero_lot', line.numeroLot)
          .maybeSingle();

        if (existingLot) {
          // Mettre à jour le lot existant
          const { error: updateError } = await supabase
            .from('lots')
            .update({
              date_peremption: line.datePeremption || null,
              prix_achat_unitaire: line.prixCession,
              emplacement: line.rayon,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLot.id);

          if (updateError) {
            errors.push(`Erreur mise à jour lot ${line.numeroLot}: ${updateError.message}`);
          } else {
            lotsUpdated++;
          }
        } else {
          // Créer un nouveau lot
          const { error: insertError } = await supabase
            .from('lots')
            .insert({
              tenant_id: tenantId,
              produit_id: line.produitId!,
              numero_lot: line.numeroLot,
              date_peremption: line.datePeremption || null,
              prix_achat_unitaire: line.prixCession,
              quantite_initiale: 0, // Sera mis à jour par un mouvement de stock
              quantite_restante: 0, // Sera mis à jour par un mouvement de stock
              emplacement: line.rayon,
              statut: 'actif'
            });

          if (insertError) {
            errors.push(`Erreur création lot ${line.numeroLot}: ${insertError.message}`);
          } else {
            lotsCreated++;
          }
        }
      } catch (error) {
        errors.push(
          `Erreur traitement ligne ${line.rowNumber}: ${
            error instanceof Error ? error.message : 'Erreur inconnue'
          }`
        );
      }
    }

    return { lotsCreated, lotsUpdated, errors };
  }

  // Fonctions utilitaires
  private static parseDate(value: any): string {
    if (!value) return '';
    
    if (value instanceof Date) {
      return format(value, 'yyyy-MM-dd');
    }
    
    if (typeof value === 'string') {
      const dateStr = value.trim();
      
      // Essayer différents formats
      const formats = ['dd/MM/yy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
      
      for (const formatStr of formats) {
        try {
          const parsedDate = parse(dateStr, formatStr, new Date());
          if (isValid(parsedDate)) {
            return format(parsedDate, 'yyyy-MM-dd');
          }
        } catch {
          continue;
        }
      }
    }
    
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    }
    
    return '';
  }

  private static parseNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    
    return defaultValue;
  }

  private static cleanString(value: any): string {
    if (!value) return '';
    return String(value).trim();
  }
}

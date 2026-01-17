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
            rowNumber
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
   * Trouve les correspondances entre références et produits
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

      // Normaliser les références AVANT la requête
      const normalizedReferences = references.map(ref => String(ref).trim());
      
      // 🔍 LOG DIAGNOSTIC: Début de la recherche
      console.log('🔍 [matchProductsByReference] === DÉBUT RECHERCHE ===');
      console.log('🔍 [matchProductsByReference] Tenant ID fourni par UI:', tenantId);
      console.log('🔍 [matchProductsByReference] Tenant ID effectif:', effectiveTenantId);
      console.log('🔍 [matchProductsByReference] Références normalisées:', normalizedReferences);

      // Rechercher les produits par code_cip - AVEC LIMITE ÉTENDUE à 5000
      const { data: produitsByCip, error: errorCip } = await (supabase
        .from('produits')
        .select('id, libelle_produit, code_cip, ancien_code_cip, code_barre_externe, categorie_tarification_id')
        .eq('tenant_id', effectiveTenantId)
        .in('code_cip', normalizedReferences)
        .range(0, 4999) as any);

      if (errorCip) throw errorCip;
      
      // 🔍 LOG DIAGNOSTIC: Résultats par code_cip
      console.log('📦 [matchProductsByReference] Résultats par code_cip:', {
        count: produitsByCip?.length || 0,
        limitAtteinte: produitsByCip?.length === 5000
      });

      // Rechercher les produits par code_barre_externe - AVEC LIMITE ÉTENDUE à 5000
      const { data: produitsByBarcode, error: errorBarcode } = await (supabase
        .from('produits')
        .select('id, libelle_produit, code_cip, ancien_code_cip, code_barre_externe, categorie_tarification_id')
        .eq('tenant_id', effectiveTenantId)
        .in('code_barre_externe', normalizedReferences)
        .range(0, 4999) as any);

      if (errorBarcode) throw errorBarcode;
      
      // 🔍 LOG DIAGNOSTIC: Résultats par code_barre_externe
      console.log('📦 [matchProductsByReference] Résultats par code_barre_externe:', {
        count: produitsByBarcode?.length || 0,
        limitAtteinte: produitsByBarcode?.length === 5000
      });

      // Rechercher les produits par ancien_code_cip - AVEC LIMITE ÉTENDUE à 5000
      const { data: produitsByAncienCip, error: errorAncienCip } = await (supabase
        .from('produits')
        .select('id, libelle_produit, code_cip, ancien_code_cip, code_barre_externe, categorie_tarification_id')
        .eq('tenant_id', effectiveTenantId)
        .in('ancien_code_cip', normalizedReferences)
        .range(0, 4999) as any);

      if (errorAncienCip) throw errorAncienCip;
      
      // 🔍 LOG DIAGNOSTIC: Résultats par ancien_code_cip
      console.log('📦 [matchProductsByReference] Résultats par ancien_code_cip:', {
        count: produitsByAncienCip?.length || 0,
        limitAtteinte: produitsByAncienCip?.length === 5000
      });

      // Combiner les résultats avec dédoublonnage par id
      const allProduits = [...(produitsByCip || []), ...(produitsByBarcode || []), ...(produitsByAncienCip || [])];
      const produits = [...new Map(allProduits.map(p => [p.id, p])).values()];

      // 🔍 LOG DIAGNOSTIC: Résumé final (limité à 50 pour lisibilité)
      console.log('📦 [matchProductsByReference] === RÉSUMÉ ===');
      console.log('📦 [matchProductsByReference] Total avant dédoublonnage:', allProduits.length);
      console.log('📦 [matchProductsByReference] Total après dédoublonnage:', produits.length);
      
      // 🔴 DIAGNOSTIC SPÉCIFIQUE pour 2038550
      const produits2038550 = produits.filter(p => String(p.ancien_code_cip || '').trim() === '2038550');
      if (produits2038550.length > 0) {
        console.log('🔴 [DIAGNOSTIC 2038550] Produits trouvés avec ancien_code_cip = 2038550:', produits2038550.map(p => ({
          id: p.id,
          libelle: p.libelle_produit,
          code_cip: p.code_cip,
          ancien_code_cip: p.ancien_code_cip
        })));
      } else {
        console.log('🔴 [DIAGNOSTIC 2038550] AUCUN produit trouvé avec ancien_code_cip = 2038550');
      }

      for (const ref of references) {
        const normalizedRef = String(ref).trim();
        
        // Chercher par code_cip, ancien_code_cip ou code_barre_externe (EAN13) avec normalisation
        const matchingProducts = produits?.filter(p => {
          const normalizedCip = String(p.code_cip || '').trim();
          const normalizedAncienCip = String(p.ancien_code_cip || '').trim();
          const normalizedBarcode = String(p.code_barre_externe || '').trim();
          return normalizedCip === normalizedRef || normalizedAncienCip === normalizedRef || normalizedBarcode === normalizedRef;
        }) || [];
        
        // 🔴 Log spécifique pour 2038550
        if (normalizedRef === '2038550') {
          console.log('🔴 [DIAGNOSTIC 2038550] Recherche pour ref "2038550":', {
            matchingProducts: matchingProducts.length,
            produits: matchingProducts.map(p => ({
              id: p.id,
              libelle: p.libelle_produit,
              code_cip: p.code_cip,
              ancien_code_cip: p.ancien_code_cip
            }))
          });
        }
        
        if (matchingProducts.length === 0) {
          notFound.push(ref);
        } else if (matchingProducts.length === 1) {
          matched.set(ref, matchingProducts[0].id);
          productCategories.set(ref, matchingProducts[0].categorie_tarification_id || null);
        } else {
          // Pour les produits avec plusieurs matchs (comme 2038550 avec 11 produits identiques),
          // on prend le premier pour éviter le statut "ambigu"
          matched.set(ref, matchingProducts[0].id);
          productCategories.set(ref, matchingProducts[0].categorie_tarification_id || null);
          
          if (normalizedRef === '2038550') {
            console.log('🔴 [DIAGNOSTIC 2038550] Plusieurs produits trouvés, premier sélectionné:', matchingProducts[0].id);
          }
        }
      }

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

    // 🔍 PHASE 1: Log de diagnostic au début
    console.log(`🔍 parseDate appelé:`, {
      value,
      type: typeof value,
      isDate: value instanceof Date,
      isNull: value === null,
      isUndefined: value === undefined,
      isEmpty: value === ''
    });

    try {
      // Si c'est déjà une date
      if (value instanceof Date) {
        let year = value.getFullYear();
        
        // Correction pour les années à 2 chiffres
        if (year < 100) {
          year += 2000;
        }
        
        // Créer une nouvelle date avec l'année corrigée
        const correctedDate = new Date(year, value.getMonth(), value.getDate());
        
        console.log(`📅 Parsing Date object:`, {
          original: value,
          yearOriginal: value.getFullYear(),
          yearCorrected: year,
          result: format(correctedDate, 'yyyy-MM-dd')
        });
        
        return format(correctedDate, 'yyyy-MM-dd');
      }

      // Si c'est un nombre (date Excel)
      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        
        // Correction pour les années à 2 chiffres
        // Si l'année est < 100, c'est probablement 20XX (ex: 26 → 2026)
        let year = date.y;
        if (year < 100) {
          year += 2000;
        }
        
        // Log pour debug
        console.log(`📅 Parsing date Excel:`, {
          value,
          parsed: date,
          yearCorrected: year,
          result: format(new Date(year, date.m - 1, date.d), 'yyyy-MM-dd')
        });
        
        return format(new Date(year, date.m - 1, date.d), 'yyyy-MM-dd');
      }

      // Si c'est une string
      if (typeof value === 'string') {
        // 📝 PHASE 2: Log de diagnostic pour strings
        console.log(`📝 Parsing date string: "${value}"`);
        
        // Essayer différents formats (commencer par les formats 2 chiffres)
        const formats = [
          'dd/MM/yy',      // Format Excel français (31/10/26)
          'MM/dd/yy',      // Format Excel US (10/31/26)
          'dd-MM/yy',      // Format avec tirets (31-10-26)
          'yyyy-MM-dd',    // Format ISO
          'dd/MM/yyyy',    // Format français 4 chiffres
          'MM/dd/yyyy',    // Format US 4 chiffres
          'dd-MM-yyyy',    // Format avec tirets 4 chiffres
          'yyyy/MM/dd'     // Format ISO avec slashes
        ];

        for (const fmt of formats) {
          try {
            const parsed = parse(value, fmt, new Date());
            if (isValid(parsed)) {
              console.log(`✅ Date string parsée avec format "${fmt}":`, {
                input: value,
                output: format(parsed, 'yyyy-MM-dd')
              });
              return format(parsed, 'yyyy-MM-dd');
            }
          } catch {
            continue;
          }
        }
        
        console.log(`❌ Date string non parsable: "${value}"`);
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

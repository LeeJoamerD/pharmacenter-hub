import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileUp, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, PlusCircle, Settings, Bot, ShieldAlert, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalCatalogLookup } from '@/hooks/useGlobalCatalogLookup';
import type { MappedProductData } from '@/hooks/useGlobalCatalogLookup';
import { ExcelParserService } from '@/services/ExcelParserService';
import { AutoOrderCreationService } from '@/services/AutoOrderCreationService';
import { ReceptionValidationService } from '@/services/receptionValidationService';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { usePriceCategories } from '@/hooks/usePriceCategories';
import { useSupplierExcelMappings } from '@/hooks/useSupplierExcelMappings';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
import { useStockSettings } from '@/hooks/useStockSettings';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import type { ExcelReceptionLine, ParseResult, ValidationResult, CatalogParseResult } from '@/types/excelImport';
import type { Reception } from '@/hooks/useReceptions';
import type { ExcelColumnMapping } from '@/types/excelMapping';

interface ReceptionExcelImportProps {
  suppliers: any[];
  orders: any[];
  onCreateReception: (receptionData: any) => Promise<any>;
  loading: boolean;
}

const ReceptionExcelImport: React.FC<ReceptionExcelImportProps> = ({
  suppliers,
  orders,
  onCreateReception,
  loading
}) => {
  const { formatAmount, getInputStep, isNoDecimalCurrency, getCurrencySymbol } = useCurrencyFormatting();
  const { categories: priceCategories } = usePriceCategories();
  const { getMappingBySupplier, mappings } = useSupplierExcelMappings();
  const { tenantId } = useTenant();
  const { searchGlobalCatalog, mapToLocalReferences, searchGlobalCatalogBatch, checkExistingProductsBatch } = useGlobalCatalogLookup();
  const { settings: stockSettings } = useStockSettings();
  const { settings: salesSettings } = useSalesSettings();
  
  // Paramètres d'arrondi depuis le service centralisé
  const roundingPrecision = stockSettings?.rounding_precision || 25;
  const roundingMethod = (salesSettings?.tax?.taxRoundingMethod as 'ceil' | 'floor' | 'round' | 'none') || 'ceil';
  
  // État pour le bouton Robot Site Fournisseur
  const [launchingRobot, setLaunchingRobot] = useState(false);
  
  // État pour l'import depuis le catalogue global
  const [catalogImporting, setCatalogImporting] = useState(false);
  const catalogFileInputRef = useRef<HTMLInputElement>(null);
  
  // État pour le mapping du fournisseur sélectionné
  const [currentMapping, setCurrentMapping] = useState<ExcelColumnMapping | null>(null);
  const [hasMappingConfig, setHasMappingConfig] = useState<boolean>(false);

  // Fonction pour déterminer la classe CSS de la catégorie de tarification
  const getCategoryColorClass = (categoryId: string | undefined | null): string => {
    if (!categoryId || categoryId === 'none' || categoryId === '') {
      return 'border-destructive bg-destructive/10'; // Rouge - catégorie manquante
    }
    
    const category = priceCategories?.find(cat => cat.id === categoryId);
    if (category && category.taux_tva > 0) {
      return 'border-blue-500 bg-blue-50'; // Bleu - avec TVA
    }
    
    return ''; // Normal - sans TVA
  };
  
  // États de base
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [bonLivraison, setBonLivraison] = useState<string>('');
  const [selectedForCatalog, setSelectedForCatalog] = useState<Set<number>>(new Set());
  const [addingToCatalog, setAddingToCatalog] = useState(false);
  const [editedLines, setEditedLines] = useState<Map<number, Partial<ExcelReceptionLine>>>(new Map());
  
  // États financiers (TVA/Centime/ASDI manuels)
  const [montantTva, setMontantTva] = useState<number>(0);
  const [montantCentimeAdditionnel, setMontantCentimeAdditionnel] = useState<number>(0);
  const [montantAsdi, setMontantAsdi] = useState<number>(0);
  
  // Flags pour savoir si l'utilisateur a modifié manuellement les champs
  const [userEditedTva, setUserEditedTva] = useState<boolean>(false);
  const [userEditedCentime, setUserEditedCentime] = useState<boolean>(false);
  const [userEditedAsdi, setUserEditedAsdi] = useState<boolean>(false);
  
  // États informations complémentaires
  const [transporteur, setTransporteur] = useState('');
  const [observations, setObservations] = useState('');
  
  // Contrôle qualité
  const [emballageConforme, setEmballageConforme] = useState<boolean>(false);
  const [temperatureRespectee, setTemperatureRespectee] = useState<boolean>(false);
  const [etiquetageCorrect, setEtiquetageCorrect] = useState<boolean>(false);
  
  // États pour l'AlertDialog d'avertissement TVA/Centime/ASDI à zéro
  const [showZeroWarningDialog, setShowZeroWarningDialog] = useState(false);
  
  // États pour l'indicateur de progression pendant la validation
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  
  // États pour le dialogue d'avertissements de validation qualité
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingWarnings, setPendingWarnings] = useState<string[]>([]);

  // Fonction pour calculer les prix de vente d'une ligne (pour sauvegarde directe dans lots)
  // Utilise le service unifié avec les paramètres d'arrondi configurés
  const calculateLinePricing = useCallback((line: ExcelReceptionLine) => {
    const edited = editedLines.get(line.rowNumber);
    const categoryId = edited?.categorieTarificationId ?? line.categorieTarificationId;
    const prixAchatReel = edited?.prixAchatReel ?? line.prixAchatReel;
    
    const category = priceCategories?.find(cat => cat.id === categoryId);
    if (!category || !prixAchatReel || prixAchatReel <= 0) {
      return {
        prixVenteHT: null,
        tauxTva: 0,
        montantTva: 0,
        tauxCentimeAdditionnel: 0,
        montantCentimeAdditionnel: 0,
        prixVenteTTC: null,
        prixVenteSuggere: null
      };
    }

    // Utiliser le service unifié avec les paramètres d'arrondi configurés
    const pricingResult = unifiedPricingService.calculateSalePrice({
      prixAchat: prixAchatReel,
      coefficientPrixVente: category.coefficient_prix_vente || 1,
      tauxTVA: category.taux_tva || 0,
      tauxCentimeAdditionnel: category.taux_centime_additionnel || 0,
      roundingPrecision: roundingPrecision,
      roundingMethod: roundingMethod,
      currencyCode: isNoDecimalCurrency() ? 'XAF' : undefined
    });

    return {
      prixVenteHT: pricingResult.prixVenteHT,
      tauxTva: pricingResult.tauxTVA,
      montantTva: pricingResult.montantTVA,
      tauxCentimeAdditionnel: pricingResult.tauxCentimeAdditionnel,
      montantCentimeAdditionnel: pricingResult.montantCentimeAdditionnel,
      prixVenteTTC: pricingResult.prixVenteTTC,
      prixVenteSuggere: pricingResult.prixVenteTTC
    };
  }, [priceCategories, editedLines, isNoDecimalCurrency, roundingPrecision, roundingMethod]);

  // Calcul automatique des suggestions TVA/Centime/ASDI basé sur les catégories produit
  const calculateAutoSuggestions = useCallback(() => {
    if (!parseResult?.lines || parseResult.lines.length === 0) {
      return { sousTotal: 0, autoTva: 0, autoCentime: 0, autoAsdi: 0 };
    }

    let autoTva = 0;
    let autoCentime = 0;
    let sousTotal = 0;

    parseResult.lines.forEach(line => {
      if (validationResult) {
        const isValid = validationResult.validLines.some(vl => vl.rowNumber === line.rowNumber);
        if (!isValid) return;
      }

      const edited = editedLines.get(line.rowNumber);
      const categoryId = edited?.categorieTarificationId ?? line.categorieTarificationId;
      const category = priceCategories?.find(cat => cat.id === categoryId);
      const tauxTva = category?.taux_tva || 0;
      const tauxCentime = category?.taux_centime_additionnel || 0;
      
      const prixAchatReel = edited?.prixAchatReel ?? line.prixAchatReel;
      const quantiteAcceptee = edited?.quantiteAcceptee ?? line.quantiteAcceptee;
      const lineTotalHT = quantiteAcceptee * prixAchatReel;
      
      sousTotal += lineTotalHT;
      
      // TVA seulement si taux > 0
      if (tauxTva > 0) {
        autoTva += lineTotalHT * (tauxTva / 100);
      }
      
      // Centime calculé sur la TVA
      if (tauxCentime > 0) {
        const tvaLine = tauxTva > 0 ? lineTotalHT * (tauxTva / 100) : 0;
        autoCentime += tvaLine * (tauxCentime / 100);
      }
    });

    // Arrondir si FCFA
    if (isNoDecimalCurrency()) {
      sousTotal = Math.round(sousTotal);
      autoTva = Math.round(autoTva);
      autoCentime = Math.round(autoCentime);
    }

    // ASDI automatique : ((Sous-total HT + TVA) × 0.42) / 100
    let autoAsdi = ((sousTotal + autoTva) * 0.42) / 100;
    if (isNoDecimalCurrency()) {
      autoAsdi = Math.round(autoAsdi);
    }

    return { sousTotal, autoTva, autoCentime, autoAsdi };
  }, [parseResult?.lines, validationResult, editedLines, priceCategories, isNoDecimalCurrency]);

  // Synchroniser les calculs automatiques vers les champs modifiables
  // SEULEMENT si l'utilisateur n'a pas modifié manuellement
  useEffect(() => {
    const { autoTva, autoCentime, autoAsdi } = calculateAutoSuggestions();
    if (!userEditedTva) {
      setMontantTva(autoTva);
    }
    if (!userEditedCentime) {
      setMontantCentimeAdditionnel(autoCentime);
    }
    if (!userEditedAsdi) {
      setMontantAsdi(autoAsdi);
    }
  }, [calculateAutoSuggestions, userEditedTva, userEditedCentime, userEditedAsdi]);

  // Calcul des totaux financiers avec ASDI (utilise les valeurs modifiables)
  // IMPORTANT: Aucun arrondi de précision sur le TTC - uniquement Math.round pour devises sans décimales
  // Le TTC est la somme EXACTE des composants pour garantir l'équilibre comptable
  const calculateTotals = useMemo(() => {
    const { sousTotal } = calculateAutoSuggestions();
    
    // Total TTC = Somme EXACTE des composants (HT + TVA + Centime + ASDI)
    // Les composants sont déjà arrondis via Math.round() dans calculateAutoSuggestions si XAF
    const totalGeneral = sousTotal + montantTva + montantCentimeAdditionnel + montantAsdi;
    
    return { sousTotal, totalGeneral };
  }, [calculateAutoSuggestions, montantTva, montantCentimeAdditionnel, montantAsdi]);

  // Liste des produits avec erreur "product_not_found"
  const productNotFoundLines = useMemo(() => {
    if (!validationResult || !parseResult) return [];
    return parseResult.lines.filter(line => 
      validationResult.errors.some(
        e => e.rowNumber === line.rowNumber && e.type === 'product_not_found'
      )
    );
  }, [validationResult, parseResult]);

  // Fonction pour sélectionner/désélectionner tous les produits non trouvés
  const handleSelectAll = () => {
    if (selectedForCatalog.size === productNotFoundLines.length) {
      setSelectedForCatalog(new Set());
    } else {
      const allRowNumbers = new Set(productNotFoundLines.map(l => l.rowNumber));
      setSelectedForCatalog(allRowNumbers);
    }
  };

  const allSelected = productNotFoundLines.length > 0 && 
                      selectedForCatalog.size === productNotFoundLines.length;

  // Filtrer les commandes avec statut "Livré" ou "Validé"
  const filteredOrders = orders.filter(
    o => o.statut === 'Livré' || o.statut === 'Validé'
  );

  // Charger le mapping quand le fournisseur change
  useEffect(() => {
    const loadMapping = async () => {
      if (!selectedSupplierId) {
        setCurrentMapping(null);
        setHasMappingConfig(false);
        return;
      }
      
      // Récupérer le nom du fournisseur pour la recherche par nom partagé
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      const supplierName = supplier?.nom || '';
      
      const mapping = await getMappingBySupplier(selectedSupplierId, supplierName);
      if (mapping) {
        setCurrentMapping(mapping.mapping_config);
        setHasMappingConfig(true);
      } else {
        setCurrentMapping(null);
        setHasMappingConfig(false);
      }
    };
    
    loadMapping();
  }, [selectedSupplierId, getMappingBySupplier, mappings, suppliers]);

  // Fonction pour lancer le robot Site Fournisseur
  const handleLaunchSupplierRobot = async () => {
    if (!selectedSupplierId) {
      toast.error('Veuillez d\'abord sélectionner un fournisseur');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    const fournisseurNom = supplier?.nom || '';

    if (!tenantId) {
      toast.error('Impossible de déterminer le tenant. Reconnectez-vous.');
      return;
    }

    setLaunchingRobot(true);

    try {
      const response = await fetch('https://eo31vjq9o5zpsr2.m.pipedream.net', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          fournisseur_nom: fournisseurNom,
        }),
      });

      if (response.ok) {
        toast.success('Le robot Site Fournisseur a été lancé avec succès. Vos factures apparaîtront dans quelques minutes.');
      } else {
        toast.error('Impossible de lancer l\'importation. Veuillez vérifier votre connexion ou vos accès.');
      }
    } catch (error) {
      console.error('Erreur lors du lancement du robot:', error);
      toast.error('Impossible de lancer l\'importation. Veuillez vérifier votre connexion ou vos accès.');
    } finally {
      setLaunchingRobot(false);
    }
  };

  // Handler pour l'import depuis le catalogue global (Prix Pointe-Noire)
  const handleCatalogFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Reset input
    e.target.value = '';
    
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      toast.error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10 MB)');
      return;
    }
    
    setCatalogImporting(true);
    setFile(selectedFile);
    setParseResult(null);
    setValidationResult(null);
    // Réinitialiser les flags d'édition manuelle
    setUserEditedTva(false);
    setUserEditedCentime(false);
    setUserEditedAsdi(false);
    
    try {
      // Étape 1: Parser le fichier avec structure simplifiée (4 colonnes fixes)
      const catalogParseResult: CatalogParseResult = await ExcelParserService.parseCatalogImportFile(selectedFile);
      
      if (!catalogParseResult.success || catalogParseResult.lines.length === 0) {
        toast.error(`Erreur lors du parsing: ${catalogParseResult.errors.length} erreur(s)`);
        if (catalogParseResult.errors.length > 0) {
          console.error('Erreurs parsing catalogue:', catalogParseResult.errors);
        }
        setCatalogImporting(false);
        return;
      }
      
      toast.info(`${catalogParseResult.lines.length} lignes extraites du fichier. Recherche dans le catalogue global...`);
      
      // Étape 2: Extraire tous les codes CIP uniques
      const allCodes = [...new Set(catalogParseResult.lines.map(l => l.codeCip).filter(c => c.length > 0))];
      
      // Étape 3: Recherche groupée dans le catalogue global avec chunking (gestion >1000 lignes)
      const CHUNK_SIZE = 200;
      const chunks: string[][] = [];
      for (let i = 0; i < allCodes.length; i += CHUNK_SIZE) {
        chunks.push(allCodes.slice(i, i + CHUNK_SIZE));
      }
      
      interface GlobalCatalogProduct {
        id: string;
        code_cip: string;
        ancien_code_cip: string | null;
        libelle_produit: string;
        libelle_categorie_tarification: string | null;
        prix_achat_reference_pnr: number | null;
        prix_vente_reference_pnr: number | null;
      }
      
      const globalProductsMap = new Map<string, GlobalCatalogProduct>();
      
      // Recherche par code_cip
      for (const chunk of chunks) {
        const { data, error } = await supabase
          .from('catalogue_global_produits')
          .select(`
            id,
            code_cip,
            ancien_code_cip,
            libelle_produit,
            libelle_categorie_tarification,
            prix_achat_reference_pnr,
            prix_vente_reference_pnr
          `)
          .in('code_cip', chunk);
        
        if (error) {
          console.error('Erreur recherche catalogue global:', error);
          continue;
        }
        
        data?.forEach(p => {
          if (p.code_cip) {
            globalProductsMap.set(p.code_cip, p as GlobalCatalogProduct);
          }
        });
      }
      
      // Recherche des non-trouvés par ancien_code_cip
      const notFound = allCodes.filter(c => !globalProductsMap.has(c));
      if (notFound.length > 0) {
        const notFoundChunks: string[][] = [];
        for (let i = 0; i < notFound.length; i += CHUNK_SIZE) {
          notFoundChunks.push(notFound.slice(i, i + CHUNK_SIZE));
        }
        
        for (const chunk of notFoundChunks) {
          const { data, error } = await supabase
            .from('catalogue_global_produits')
            .select(`
              id,
              code_cip,
              ancien_code_cip,
              libelle_produit,
              libelle_categorie_tarification,
              prix_achat_reference_pnr,
              prix_vente_reference_pnr
            `)
            .in('ancien_code_cip', chunk);
          
          if (error) {
            console.error('Erreur recherche ancien_code_cip:', error);
            continue;
          }
          
          data?.forEach(p => {
            if (p.ancien_code_cip) {
              globalProductsMap.set(p.ancien_code_cip, p as GlobalCatalogProduct);
            }
          });
        }
      }
      
      console.log(`📦 Catalogue global: ${globalProductsMap.size} produits trouvés sur ${allCodes.length} codes`);
      
      // Étape 4: Construire les ExcelReceptionLine enrichies avec PRIX POINTE-NOIRE
      const enrichedLines: ExcelReceptionLine[] = [];
      const parseErrors: { rowNumber: number; column: string; message: string; severity: 'error' | 'warning' }[] = [];
      
      for (const rawLine of catalogParseResult.lines) {
        const globalProduct = globalProductsMap.get(rawLine.codeCip);
        
        if (!globalProduct) {
          parseErrors.push({
            rowNumber: rawLine.rowNumber,
            column: 'B (Code CIP)',
            message: `Produit non trouvé dans le catalogue global: ${rawLine.codeCip}`,
            severity: 'error'
          });
          // Créer une ligne avec erreur pour affichage
          enrichedLines.push({
            reference: rawLine.codeCip,
            produit: rawLine.libelle || `Code CIP: ${rawLine.codeCip}`,
            quantiteCommandee: rawLine.quantite,
            quantiteRecue: rawLine.quantite,
            quantiteAcceptee: rawLine.quantite,
            prixAchatReel: 0,
            numeroLot: '',
            dateExpiration: rawLine.datePeremption,
            statut: 'non_conforme',
            rowNumber: rawLine.rowNumber,
            hasParsingError: true,
            parsingErrorMessage: 'Produit non trouvé dans le catalogue global'
          });
          continue;
        }
        
        // UTILISATION DES PRIX POINTE-NOIRE (pas prix_achat_reference)
        const prixAchat = globalProduct.prix_achat_reference_pnr || 0;
        
        if (prixAchat === 0) {
          parseErrors.push({
            rowNumber: rawLine.rowNumber,
            column: 'Prix',
            message: `Prix Pointe-Noire non renseigné pour: ${globalProduct.libelle_produit}`,
            severity: 'warning'
          });
        }
        
        enrichedLines.push({
          reference: globalProduct.code_cip,
          ancienCodeCip: globalProduct.ancien_code_cip || undefined,
          produit: globalProduct.libelle_produit,
          quantiteCommandee: rawLine.quantite,
          quantiteRecue: rawLine.quantite,
          quantiteAcceptee: rawLine.quantite,
          prixAchatReel: prixAchat,
          numeroLot: '',
          dateExpiration: rawLine.datePeremption,
          statut: 'conforme',
          rowNumber: rawLine.rowNumber
        });
      }
      
      // Étape 5: Construire le ParseResult pour le flux existant
      const result: ParseResult = {
        success: parseErrors.filter(e => e.severity === 'error').length < enrichedLines.length,
        lines: enrichedLines,
        errors: parseErrors,
        warnings: []
      };
      
      setParseResult(result);
      
      const validCount = enrichedLines.filter(l => !l.hasParsingError).length;
      const errorCount = enrichedLines.filter(l => l.hasParsingError).length;
      
      if (validCount > 0) {
        toast.success(`${validCount} produit(s) enrichi(s) depuis le catalogue global (Prix Pointe-Noire)`);
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} produit(s) non trouvé(s) dans le catalogue global`);
      }
      
      // Étape 6: Validation automatique si fournisseur sélectionné
      if (selectedSupplierId && enrichedLines.length > 0) {
        await validateData(enrichedLines);
      } else if (!selectedSupplierId && enrichedLines.length > 0) {
        toast.info('Sélectionnez un fournisseur pour valider les données');
      }
      
    } catch (error) {
      console.error('Erreur import catalogue:', error);
      toast.error('Erreur lors de l\'import depuis le catalogue global');
    } finally {
      setCatalogImporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier qu'un fournisseur est sélectionné
    if (!selectedSupplierId) {
      toast.error('Veuillez d\'abord sélectionner un fournisseur');
      e.target.value = ''; // Reset input
      return;
    }

    // Vérifier qu'un mapping existe pour ce fournisseur
    if (!hasMappingConfig) {
      toast.error(
        'Aucune configuration de mapping trouvée pour ce fournisseur. ' +
        'Veuillez configurer le mapping dans Stock > Configuration > Import Excel.'
      );
      e.target.value = ''; // Reset input
      return;
    }

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      toast.error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10 MB)');
      return;
    }

    setFile(selectedFile);
    await parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    setParsing(true);
    setParseResult(null);
    setValidationResult(null);
    // Réinitialiser les flags d'édition manuelle lors d'un nouveau fichier
    setUserEditedTva(false);
    setUserEditedCentime(false);
    setUserEditedAsdi(false);

    try {
      // Passer le mapping au service de parsing
      const result = await ExcelParserService.parseExcelFile(file, currentMapping || undefined);
      setParseResult(result);

      if (result.bonLivraison) {
        setBonLivraison(result.bonLivraison);
      }

      if (result.success && result.lines.length > 0) {
        toast.success(`${result.lines.length} lignes importées avec succès`);
        
        if (selectedSupplierId) {
          await validateData(result.lines);
        }
      } else if (result.errors.length > 0) {
        toast.error(`Erreurs lors du parsing : ${result.errors.length} erreur(s)`);
      }
    } catch (error) {
      console.error('Erreur lors du parsing:', error);
      toast.error('Erreur lors de la lecture du fichier');
    } finally {
      setParsing(false);
    }
  };

  const validateData = async (lines: ExcelReceptionLine[]) => {
    if (!selectedSupplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (!tenantId) {
      toast.error('Pharmacie active non définie. Reconnectez-vous.');
      return;
    }

    setValidating(true);
    try {
      // Passer le tenantId de la pharmacie active au service de validation
      const result = await ExcelParserService.validateReceptionData(lines, selectedSupplierId, tenantId);
      setValidationResult(result);

      // Initialiser les catégories de tarification pour chaque ligne validée
      if (result.productCategories && result.productCategories.size > 0) {
        const newEditedLines = new Map(editedLines);
        lines.forEach(line => {
          const catId = result.productCategories.get(String(line.reference).trim());
          if (catId !== undefined) {
            const existing = newEditedLines.get(line.rowNumber) || {};
            newEditedLines.set(line.rowNumber, { ...existing, categorieTarificationId: catId || '' });
          }
        });
        setEditedLines(newEditedLines);
      }

      if (result.isValid) {
        toast.success(`Validation réussie : ${result.validLines.length} lignes validées`);
      } else {
        toast.warning(
          `Validation terminée avec ${result.errors.length} erreur(s) et ${result.warnings.length} avertissement(s)`
        );
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation des données');
    } finally {
      setValidating(false);
    }
  };

  // Vérification TVA/Centime à zéro avant validation finale
  const checkZeroWarningAndProceed = () => {
    if (montantTva === 0 || montantCentimeAdditionnel === 0) {
      setShowZeroWarningDialog(true);
      return;
    }
    handleSubmit();
  };

  // Validation complète avec le service de validation avant réception
  const handleValidateClick = async () => {
    if (!selectedSupplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (!validationResult || validationResult.validLines.length === 0) {
      toast.error('Aucune ligne valide à importer');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Vérification des données...');

    try {
      // Préparer les données pour validation via le service
      const lignesForValidation = validationResult.validLines.map(line => {
        const edited = editedLines.get(line.rowNumber);
        const statutValue = String(edited?.statut ?? line.statut ?? 'conforme');
        const statutConverted = statutValue === 'non_conforme' ? 'non-conforme' : 
                                statutValue === 'refuse' ? 'non-conforme' : 
                                statutValue === 'partiellement-conforme' ? 'partiellement-conforme' :
                                'conforme';
        
        return {
          produit_id: line.produitId!,
          quantite_commandee: line.quantiteCommandee,
          quantite_recue: line.quantiteRecue,
          quantite_acceptee: edited?.quantiteAcceptee ?? line.quantiteAcceptee,
          numero_lot: edited?.numeroLot ?? line.numeroLot,
          date_expiration: edited?.dateExpiration ?? line.dateExpiration,
          statut: statutConverted as 'conforme' | 'non-conforme' | 'partiellement-conforme',
          commentaire: edited?.commentaire ?? line.commentaire
        };
      });

      const receptionDataForValidation = {
        fournisseur_id: selectedSupplierId,
        commande_id: selectedOrderId || undefined,
        lignes: lignesForValidation
      };

      // Validation via le service - passer l'option allowMissingLotNumbers si auto-génération activée
      const validation = await ReceptionValidationService.validateReception(
        receptionDataForValidation,
        { allowMissingLotNumbers: stockSettings?.auto_generate_lots === true }
      );

      // Afficher les erreurs bloquantes
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        setIsProcessing(false);
        setProcessingStep('');
        return;
      }

      // Afficher les avertissements s'il y en a
      if (validation.warnings.length > 0) {
        setPendingWarnings(validation.warnings);
        setShowWarningDialog(true);
        setIsProcessing(false);
        setProcessingStep('');
        return;
      }

      // Si pas d'avertissements, vérifier TVA/Centime
      setIsProcessing(false);
      setProcessingStep('');
      checkZeroWarningAndProceed();

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation des données');
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Confirmation après avertissements de validation qualité
  const handleConfirmWithWarnings = () => {
    setShowWarningDialog(false);
    setPendingWarnings([]);
    // Après confirmation des avertissements, vérifier TVA/Centime
    checkZeroWarningAndProceed();
  };

  // Confirmation après avertissement TVA/Centime à zéro
  const handleConfirmZeroWarning = () => {
    setShowZeroWarningDialog(false);
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (!validationResult || validationResult.validLines.length === 0) {
      toast.error('Aucune ligne valide à importer');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Préparation des données...');

    try {
      let orderId = selectedOrderId;
      let isAutoCreated = false;

      // Si aucune commande n'est sélectionnée, en créer une automatiquement
      if (!orderId) {
        setProcessingStep('Création automatique de la commande...');
        const orderResult = await AutoOrderCreationService.createOrderFromExcelData(
          selectedSupplierId,
          validationResult.validLines,
          validationResult.productMatches
        );
        orderId = orderResult.orderId;
        isAutoCreated = true;
        toast.success(`Commande ${orderResult.orderNumber} créée automatiquement`);
      }

      setProcessingStep(`Enregistrement des ${validationResult.validLines.length} lignes de réception...`);

      // Préparer les lignes de réception (avec les valeurs éditées et les prix pré-calculés)
      const lignes = validationResult.validLines.map(line => {
        const edited = editedLines.get(line.rowNumber);
        const finalLine = { ...line, ...edited };
        const pricing = calculateLinePricing(line);  // Calcul des prix de vente
        
        // Récupérer le statut modifié ou garder le statut par défaut
        const statutValue = String(edited?.statut ?? line.statut ?? 'conforme');
        // Convertir le statut au format attendu par useReceptions
        const statutConverted = statutValue === 'non_conforme' ? 'non-conforme' : 
                               statutValue === 'refuse' ? 'non-conforme' : 
                               statutValue === 'partiellement-conforme' ? 'partiellement-conforme' :
                               'conforme';
        
        return {
          produit_id: finalLine.produitId!,
          quantite_commandee: finalLine.quantiteCommandee,
          quantite_recue: finalLine.quantiteRecue,
          quantite_acceptee: finalLine.quantiteAcceptee,
          prix_achat_reel: isNoDecimalCurrency() ? Math.round(finalLine.prixAchatReel) : finalLine.prixAchatReel,
          numero_lot: finalLine.numeroLot,
          date_expiration: finalLine.dateExpiration,
          statut: statutConverted as 'conforme' | 'non-conforme' | 'partiellement-conforme',
          code_barre_lot: finalLine.codeBarreLot || null,
          emplacement: finalLine.emplacement || null,
          commentaire: finalLine.commentaire || null,
          // Prix pré-calculés pour sauvegarde directe dans lots
          categorie_tarification_id: edited?.categorieTarificationId ?? line.categorieTarificationId ?? null,
          prix_vente_ht: pricing.prixVenteHT,
          taux_tva: pricing.tauxTva,
          montant_tva: pricing.montantTva,
          taux_centime_additionnel: pricing.tauxCentimeAdditionnel,
          montant_centime_additionnel: pricing.montantCentimeAdditionnel,
          prix_vente_ttc: pricing.prixVenteTTC,
          prix_vente_suggere: pricing.prixVenteSuggere
        };
      });

      setProcessingStep('Création de la réception et mise à jour du stock...');

      const receptionData = {
        fournisseur_id: selectedSupplierId,
        commande_id: orderId || undefined,
        date_reception: new Date().toISOString(),
        reference_facture: bonLivraison,
        transporteur: transporteur || null,
        isValidated: true,
        // Montants financiers
        montant_ht: isNoDecimalCurrency() ? Math.round(calculateTotals.sousTotal) : calculateTotals.sousTotal,
        montant_tva: isNoDecimalCurrency() ? Math.round(montantTva) : montantTva,
        montant_centime_additionnel: isNoDecimalCurrency() ? Math.round(montantCentimeAdditionnel) : montantCentimeAdditionnel,
        montant_asdi: isNoDecimalCurrency() ? Math.round(montantAsdi) : montantAsdi,
        montant_ttc: isNoDecimalCurrency() ? Math.round(calculateTotals.totalGeneral) : calculateTotals.totalGeneral,
        notes: observations || null,
        // Contrôle qualité
        emballage_conforme: emballageConforme,
        temperature_respectee: temperatureRespectee,
        etiquetage_correct: etiquetageCorrect,
        lignes
      };

      await onCreateReception(receptionData as any);

      // Mettre à jour le statut de la commande
      if (orderId) {
        setProcessingStep('Finalisation de la commande...');
        await AutoOrderCreationService.updateOrderStatus(orderId, 'Réceptionné');
        toast.success(
          isAutoCreated 
            ? 'Commande créée et réceptionnée avec succès'
            : 'Commande mise à jour avec le statut Réceptionné'
        );
      }

      toast.success('Réception créée et validée avec succès');

      // Réinitialiser le formulaire
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la création de la réception:', error);
      toast.error('Erreur lors de la création de la réception');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const resetForm = () => {
    setFile(null);
    setParseResult(null);
    setValidationResult(null);
    setBonLivraison('');
    setSelectedOrderId('');
    setSelectedForCatalog(new Set());
    setEditedLines(new Map());
    setMontantTva(0);
    setMontantCentimeAdditionnel(0);
    setMontantAsdi(0);
    setTransporteur('');
    setObservations('');
    setEmballageConforme(false);
    setTemperatureRespectee(false);
    setEtiquetageCorrect(false);
    // Réinitialiser les flags d'édition manuelle
    setUserEditedTva(false);
    setUserEditedCentime(false);
    setUserEditedAsdi(false);
  };

  const handleAddProductsToCatalog = async () => {
    if (selectedForCatalog.size === 0) return;
    
    setAddingToCatalog(true);
    setProcessingStep('Initialisation...');
    
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user?.id)
        .single();

      if (!personnel) {
        toast.error('Personnel non trouvé');
        return;
      }

      const linesToAdd = parseResult?.lines.filter(l => 
        selectedForCatalog.has(l.rowNumber)
      ) || [];

      // Étape 1: Extraire tous les codes CIP
      const allCodes = linesToAdd.map(l => String(l.reference).trim()).filter(c => c.length > 0);
      
      // Étape 2: Vérification groupée des produits existants (~2 requêtes au lieu de N)
      setProcessingStep(`Vérification des produits existants (${allCodes.length} codes)...`);
      const existingCodes = await checkExistingProductsBatch(allCodes);
      
      // Étape 3: Filtrer les codes non existants pour recherche catalogue global
      const codesToSearch = allCodes.filter(c => !existingCodes.has(c));
      
      // Étape 4: Recherche groupée dans le catalogue global (~4 requêtes au lieu de N)
      setProcessingStep(`Recherche catalogue global (${codesToSearch.length} codes)...`);
      const globalProductsMap = await searchGlobalCatalogBatch(codesToSearch);
      
      let created = 0;
      let skipped = 0;
      let notFoundInGlobal = 0;
      const errors: string[] = [];

      // Étape 5: Traitement séquentiel des insertions uniquement
      setProcessingStep(`Ajout des produits au catalogue...`);
      
      for (let i = 0; i < linesToAdd.length; i++) {
        const line = linesToAdd[i];
        const normalizedCip = String(line.reference).trim();
        const normalizedName = String(line.produit).trim();

        setProcessingStep(`Traitement ${i + 1}/${linesToAdd.length}: ${normalizedName.substring(0, 30)}...`);

        // Vérification en mémoire (pas de requête !)
        if (existingCodes.has(normalizedCip)) {
          skipped++;
          continue;
        }

        // Lookup en mémoire (pas de requête !)
        const globalProduct = globalProductsMap.get(normalizedCip);

        if (globalProduct) {
          // Mapper vers les références locales (crée les référentiels manquants)
          const mappedData: MappedProductData = await mapToLocalReferences(globalProduct);

          // Vérification en temps réel avant insertion (cas de race condition)
          const { data: existingCheck } = await supabase
            .from('produits')
            .select('id')
            .eq('tenant_id', personnel.tenant_id)
            .or(`code_cip.eq.${mappedData.code_cip},ancien_code_cip.eq.${mappedData.code_cip}`)
            .eq('is_active', true)
            .maybeSingle();

          if (existingCheck) {
            skipped++;
            continue;
          }

          // INSERT direct (pas d'upsert car l'index unique est conditionnel)
          const { data: newProduct, error } = await supabase
            .from('produits')
            .insert({
              tenant_id: personnel.tenant_id,
              code_cip: mappedData.code_cip,
              ancien_code_cip: line.ancienCodeCip || mappedData.ancien_code_cip || null,
              libelle_produit: mappedData.libelle_produit,
              famille_id: mappedData.famille_id || null,
              rayon_id: mappedData.rayon_id || null,
              forme_id: mappedData.forme_id || null,
              classe_therapeutique_id: mappedData.classe_therapeutique_id || null,
              laboratoires_id: mappedData.laboratoires_id || null,
              categorie_tarification_id: mappedData.categorie_tarification_id || null,
              prix_achat: line.prixAchatReel || mappedData.prix_achat || null,
              prix_vente_ttc: mappedData.prix_vente_ttc || null,
              is_active: true
            })
            .select('id')
            .single();

          if (error) {
            errors.push(`Erreur pour "${normalizedName}": ${error.message}`);
          } else {
            // Insérer les relations DCI multiples
            if (mappedData.dci_ids.length > 0 && newProduct?.id) {
              const dciRelations = mappedData.dci_ids.map(dci_id => ({
                produit_id: newProduct.id,
                dci_id,
                tenant_id: personnel.tenant_id,
              }));
              await supabase.from('produits_dci').insert(dciRelations);
            }
            created++;
          }
        } else {
          // Produit non trouvé dans le catalogue global - création minimale
          // Vérification en temps réel avant insertion
          const { data: existingCheck } = await supabase
            .from('produits')
            .select('id')
            .eq('tenant_id', personnel.tenant_id)
            .or(`code_cip.eq.${normalizedCip},ancien_code_cip.eq.${normalizedCip}`)
            .eq('is_active', true)
            .maybeSingle();

          if (existingCheck) {
            skipped++;
            continue;
          }

          notFoundInGlobal++;
          const { error } = await supabase
            .from('produits')
            .insert({
              tenant_id: personnel.tenant_id,
              libelle_produit: normalizedName,
              code_cip: normalizedCip,
              ancien_code_cip: line.ancienCodeCip || null,
              prix_achat: line.prixAchatReel,
              is_active: true
            });

          if (error) {
            errors.push(`Erreur pour "${normalizedName}": ${error.message}`);
          } else {
            created++;
          }
        }
      }

      setProcessingStep('');

      // Afficher les résultats
      if (created > 0) {
        toast.success(`${created} produit(s) ajouté(s) au catalogue`);
      }
      if (skipped > 0) {
        toast.warning(`${skipped} produit(s) ignoré(s) (déjà existants)`);
      }
      if (notFoundInGlobal > 0) {
        toast.info(`${notFoundInGlobal} produit(s) créé(s) sans données du catalogue global`);
      }
      if (errors.length > 0 && created === 0 && skipped === 0) {
        toast.error(`Erreurs: ${errors.slice(0, 3).join(', ')}`);
      }

      setSelectedForCatalog(new Set());

      // Re-valider pour mettre à jour l'affichage
      if (parseResult?.lines) {
        await validateData(parseResult.lines);
      }

    } catch (error) {
      console.error('Erreur lors de l\'ajout des produits:', error);
      toast.error('Erreur lors de l\'ajout des produits au catalogue');
    } finally {
      setAddingToCatalog(false);
      setProcessingStep('');
    }
  };

  const getLineValue = (line: ExcelReceptionLine, field: keyof ExcelReceptionLine) => {
    const edited = editedLines.get(line.rowNumber);
    return edited?.[field] !== undefined ? edited[field] : line[field];
  };

  // Fonction pour recalculer le statut après modification de date
  const recalculateLineStatusFromDate = (rowNumber: number, newDate: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sixMonths = new Date();
    sixMonths.setHours(0, 0, 0, 0);
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    
    let newStatus: 'valid' | 'expired' | 'warning' = 'valid';
    let statusMessage = '';
    
    if (newDate) {
      const expDate = new Date(newDate + 'T00:00:00');
      expDate.setHours(0, 0, 0, 0);
      if (expDate < now) {
        newStatus = 'expired';
        statusMessage = 'Date expirée';
      } else if (expDate < sixMonths) {
        newStatus = 'warning';
        statusMessage = 'Expire dans moins de 6 mois';
      }
    }
    
    return { newStatus, statusMessage };
  };

  const updateLineValue = (rowNumber: number, field: keyof ExcelReceptionLine, value: any) => {
    setEditedLines(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(rowNumber) || {};
      newMap.set(rowNumber, { ...existing, [field]: value });
      return newMap;
    });
  };

  // Fonction pour gérer la modification de date avec mise à jour du statut
  const handleDateChange = (line: ExcelReceptionLine, newDate: string) => {
    updateLineValue(line.rowNumber, 'dateExpiration', newDate);
  };

  const getStatusBadge = (line: ExcelReceptionLine) => {
    // Récupérer la date éditée si elle existe
    const editedDate = String(getLineValue(line, 'dateExpiration') || '');
    
    // Recalculer le statut de la date dynamiquement
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sixMonths = new Date();
    sixMonths.setHours(0, 0, 0, 0);
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    
    let dateStatus: 'valid' | 'expired' | 'warning' = 'valid';
    if (editedDate) {
      const expDate = new Date(editedDate + 'T00:00:00');
      expDate.setHours(0, 0, 0, 0);
      if (expDate < now) {
        dateStatus = 'expired';
      } else if (expDate < sixMonths) {
        dateStatus = 'warning';
      }
    }
    
    // Vérifier les erreurs originales du validationResult
    const lineError = validationResult?.errors.find(e => e.rowNumber === line.rowNumber);
    const hasWarning = validationResult?.warnings.some(w => w.rowNumber === line.rowNumber);

    // Si l'erreur originale était une date expirée, mais la date a été corrigée, ignorer l'erreur
    if (lineError && lineError.type === 'invalid_date' && dateStatus !== 'expired') {
      // La date a été corrigée - afficher le nouveau statut
      if (dateStatus === 'warning') {
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expire bientôt
          </Badge>
        );
      }
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Valide
        </Badge>
      );
    }

    if (lineError) {
      let errorLabel = 'Erreur';
      switch (lineError.type) {
        case 'product_not_found':
          errorLabel = 'Produit non trouvé';
          break;
        case 'invalid_date':
          errorLabel = 'Date expirée';
          break;
        case 'invalid_quantity':
          errorLabel = 'Qté invalide';
          break;
        case 'invalid_price':
          errorLabel = 'Prix invalide';
          break;
        case 'missing_field':
          errorLabel = 'Champ manquant';
          break;
      }
      return (
        <Badge variant="destructive" title={lineError.message}>
          <XCircle className="h-3 w-3 mr-1" />
          {errorLabel}
        </Badge>
      );
    }
    
    // Vérifier si la date éditée déclenche un avertissement
    if (dateStatus === 'warning') {
      return (
        <Badge variant="secondary">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expire bientôt
        </Badge>
      );
    }
    
    if (hasWarning) {
      return (
        <Badge variant="secondary">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Attention
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Valide
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Import Excel - Réception de Marchandises
          </CardTitle>
          <CardDescription>
            Importez un fichier Excel/CSV depuis votre fournisseur pour créer automatiquement une réception
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1️⃣ Informations de base</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur *</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => {
                      const supplierHasMapping = mappings.some(m => m.fournisseur_id === supplier.id);
                      return (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex items-center gap-2">
                            <span>{supplier.nom}</span>
                            {supplierHasMapping && (
                              <Badge variant="secondary" className="text-[10px] h-4">
                                <Settings className="h-2.5 w-2.5 mr-0.5" />
                                Mapping
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedSupplierId && !hasMappingConfig && (
                  <p className="text-xs text-destructive mt-1">
                    ⚠️ Aucun mapping configuré. Allez dans Configuration &gt; Import Excel.
                  </p>
                )}
                {selectedSupplierId && hasMappingConfig && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Mapping Excel configuré pour ce fournisseur
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Commande (facultatif)</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger id="order">
                    <SelectValue placeholder="Aucune commande (création automatique)" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        Commande du {new Date(order.date_commande).toLocaleDateString()} - {order.statut}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonLivraison">Bon de livraison</Label>
                <Input
                  id="bonLivraison"
                  value={bonLivraison}
                  onChange={(e) => setBonLivraison(e.target.value)}
                  placeholder="Auto-rempli depuis Excel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transporteur">Transporteur</Label>
                <Input
                  id="transporteur"
                  value={transporteur}
                  onChange={(e) => setTransporteur(e.target.value)}
                  placeholder="Nom du transporteur"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Notes / Observations</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Remarques sur la réception..."
                rows={2}
              />
            </div>

            {/* Boutons d'import */}
            <div className="pt-2 flex flex-wrap gap-3">
              {/* Bouton Robot Site Fournisseur */}
              <Button
                variant="outline"
                onClick={handleLaunchSupplierRobot}
                disabled={launchingRobot || !selectedSupplierId}
                className="w-full md:w-auto"
              >
                {launchingRobot ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Lancement en cours...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Importer depuis le Site du Fournisseur
                  </>
                )}
              </Button>

              {/* Bouton Import depuis Catalogue Global (Prix Pointe-Noire) */}
              <Button
                variant="outline"
                onClick={() => catalogFileInputRef.current?.click()}
                disabled={catalogImporting}
                className="w-full md:w-auto"
              >
                {catalogImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import Catalogue...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2" />
                    Importer depuis le Catalogue
                  </>
                )}
              </Button>

              {/* Input file caché pour le catalogue */}
              <input
                ref={catalogFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleCatalogFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Section 2: Upload fichier */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2️⃣ Fichier Excel</h3>
            
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground mb-2">
                  Glissez votre fichier Excel ici ou cliquez pour parcourir
                </div>
                <div className="text-xs text-muted-foreground">
                  Formats acceptés : .xlsx, .csv | Taille max : 10 MB
                </div>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <div className="mt-4 text-sm">
                  <Badge variant="outline">📄 {file.name}</Badge>
                  {parsing && <span className="ml-2 text-muted-foreground">Parsing en cours...</span>}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Résultats du parsing */}
          {parseResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">3️⃣ Résultats</h3>
                {parseResult.lines.length > 0 && selectedSupplierId && (
                  <Button
                    onClick={() => validateData(parseResult.lines)}
                    disabled={validating}
                    variant="outline"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validation...
                      </>
                    ) : (
                      '⚙️ Valider les données'
                    )}
                  </Button>
                )}
              </div>

              {/* Alertes d'erreurs/warnings */}
              {parseResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erreurs de parsing ({parseResult.errors.length})</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm mt-2">
                      {parseResult.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>Ligne {err.rowNumber} - {err.column}: {err.message}</li>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <li>... et {parseResult.errors.length - 5} autre(s) erreur(s)</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult && (
                <>
                  {validationResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>Erreurs de validation ({validationResult.errors.length})</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const exportData = validationResult.errors.map(err => ({
                              'Ligne': err.rowNumber,
                              'Référence CIP': err.reference,
                              'Produit': err.produit,
                              'Erreur': err.message,
                              'Type': err.type === 'product_not_found' ? 'Produit non trouvé' :
                                      err.type === 'invalid_quantity' ? 'Quantité invalide' :
                                      err.type === 'invalid_price' ? 'Prix invalide' :
                                      err.type === 'invalid_date' ? 'Date invalide' : err.type
                            }));

                            const ws = XLSX.utils.json_to_sheet(exportData);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, 'Erreurs');
                            
                            const fileName = `erreurs_validation_${new Date().toISOString().split('T')[0]}.xlsx`;
                            XLSX.writeFile(wb, fileName);
                            
                            toast.success(`${validationResult.errors.length} erreur(s) exportée(s)`);
                          }}
                          className="ml-2 h-7 bg-background hover:bg-muted"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Exporter
                        </Button>
                      </AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-sm mt-2">
                          {validationResult.errors.slice(0, 5).map((err, idx) => (
                            <li key={idx}>
                              Ligne {err.rowNumber} - {err.reference}: {err.message}
                            </li>
                          ))}
                          {validationResult.errors.length > 5 && (
                            <li>... et {validationResult.errors.length - 5} autre(s) erreur(s)</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Avertissements ({validationResult.warnings.length})</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-sm mt-2">
                          {validationResult.warnings.slice(0, 3).map((warn, idx) => (
                            <li key={idx}>
                              Ligne {warn.rowNumber} - {warn.reference}: {warn.message}
                            </li>
                          ))}
                          {validationResult.warnings.length > 3 && (
                            <li>... et {validationResult.warnings.length - 3} autre(s) avertissement(s)</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationResult.validLines.length > 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>
                        ✅ {validationResult.validLines.length} ligne(s) validée(s) sur {parseResult?.lines.length || 0} total
                      </AlertTitle>
                      <AlertDescription>
                        Les données sont prêtes à être importées
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Bloc d'ajout de produits au catalogue */}
                  {validationResult?.errors.some(e => e.type === 'product_not_found') && (
                    <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <PlusCircle className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {selectedForCatalog.size} / {productNotFoundLines.length} produit(s) sélectionné(s) pour ajout
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Catégorie : MEDICAMENTS
                          </p>
                        </div>
                        <Button
                          onClick={handleSelectAll}
                          variant="outline"
                          size="sm"
                        >
                          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </Button>
                        <Button
                          onClick={handleAddProductsToCatalog}
                          disabled={selectedForCatalog.size === 0 || addingToCatalog}
                          size="sm"
                        >
                          {addingToCatalog ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Ajout en cours...
                            </>
                          ) : (
                            <>
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Ajouter au catalogue
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tableau de prévisualisation */}
              {parseResult.lines.length > 0 && (
                <div className="border rounded-lg max-h-96 overflow-x-scroll overflow-y-scroll">
                    <Table className="min-w-[1600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            {productNotFoundLines.length > 0 && (
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={handleSelectAll}
                                aria-label="Sélectionner tous les produits non trouvés"
                              />
                            )}
                          </TableHead>
                          <TableHead className="w-[80px]">Statut</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead>Cat. Tarification</TableHead>
                          <TableHead className="text-right">Commandé</TableHead>
                          <TableHead className="text-right">Reçu</TableHead>
                          <TableHead className="text-right">Accepté</TableHead>
                          <TableHead className="text-right">Prix ({getCurrencySymbol()})</TableHead>
                          <TableHead>Lot</TableHead>
                          <TableHead>Expiration</TableHead>
                          <TableHead>Code barre</TableHead>
                          <TableHead>Emplacement</TableHead>
                          <TableHead>Statut Ligne</TableHead>
                          <TableHead>Commentaire</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseResult.lines.map((line, idx) => {
                          const hasProductNotFoundError = validationResult?.errors.some(
                            e => e.rowNumber === line.rowNumber && e.type === 'product_not_found'
                          );
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                {hasProductNotFoundError ? (
                                  <Checkbox
                                    checked={selectedForCatalog.has(line.rowNumber)}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(selectedForCatalog);
                                      if (checked) {
                                        newSet.add(line.rowNumber);
                                      } else {
                                        newSet.delete(line.rowNumber);
                                      }
                                      setSelectedForCatalog(newSet);
                                    }}
                                  />
                                ) : null}
                              </TableCell>
                              <TableCell>{validationResult ? getStatusBadge(line) : '-'}</TableCell>
                              <TableCell className="max-w-[200px]">
                                <div className="flex flex-col">
                                  <span className="truncate font-medium">{line.produit}</span>
                                  <span className="text-xs text-muted-foreground font-mono">{line.reference}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={String(getLineValue(line, 'categorieTarificationId') || '')}
                                  onValueChange={async (value) => {
                                    updateLineValue(line.rowNumber, 'categorieTarificationId', value);
                                    // Mettre à jour le produit si identifié
                                    if (line.produitId) {
                                      const { error } = await supabase
                                        .from('produits')
                                        .update({ categorie_tarification_id: value })
                                        .eq('id', line.produitId);
                                      if (!error) {
                                        toast.success('Catégorie tarification mise à jour');
                                      }
                                    }
                                  }}
                                >
                                <SelectTrigger className={`w-36 h-8 ${getCategoryColorClass(getLineValue(line, 'categorieTarificationId') as string)}`}>
                                    <SelectValue placeholder={getLineValue(line, 'categorieTarificationId') ? undefined : 'NULL'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {priceCategories?.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.libelle_categorie}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  className="w-20 h-8 text-right"
                                  value={Number(getLineValue(line, 'quantiteCommandee'))}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'quantiteCommandee', parseInt(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  className="w-20 h-8 text-right"
                                  value={Number(getLineValue(line, 'quantiteRecue'))}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'quantiteRecue', parseInt(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  className="w-20 h-8 text-right"
                                  value={Number(getLineValue(line, 'quantiteAcceptee'))}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'quantiteAcceptee', parseInt(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  step={getInputStep()}
                                  className="w-24 h-8 text-right"
                                  value={Number(getLineValue(line, 'prixAchatReel'))}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'prixAchatReel', parseFloat(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  className="w-24 h-8 uppercase"
                                  value={String(getLineValue(line, 'numeroLot'))}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'numeroLot', e.target.value.toUpperCase())}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="date"
                                  className="w-36 h-8"
                                  value={String(getLineValue(line, 'dateExpiration'))}
                                  onChange={(e) => handleDateChange(line, e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  className="w-36 h-8 font-mono text-xs"
                                  value={String(getLineValue(line, 'codeBarreLot') || '')}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'codeBarreLot', e.target.value)}
                                  placeholder="Auto"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  className="w-24 h-8"
                                  value={String(getLineValue(line, 'emplacement') || '')}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'emplacement', e.target.value)}
                                  placeholder="Ex: A1"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={String(getLineValue(line, 'statut') || 'conforme')}
                                  onValueChange={(value) => updateLineValue(line.rowNumber, 'statut', value as 'conforme' | 'non_conforme' | 'refuse')}
                                >
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="conforme">Conforme</SelectItem>
                                    <SelectItem value="non_conforme">Non conforme</SelectItem>
                                    <SelectItem value="partiellement-conforme">Partiel</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  className="w-32 h-8"
                                  value={String(getLineValue(line, 'commentaire') || '')}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'commentaire', e.target.value)}
                                  placeholder="Remarque..."
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Calculs Financiers */}
          {validationResult && validationResult.validLines.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">4️⃣ Calculs Financiers</h3>
              <p className="text-sm text-muted-foreground">
                Les montants TVA, Centime Additionnel et ASDI sont calculés automatiquement selon les catégories de tarification des produits. Vous pouvez les modifier si nécessaire.
              </p>
              
              <div className="flex justify-end">
                <div className="w-96 space-y-4">
                  {/* Sous-total HT - Calculé automatiquement */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Sous-total HT :</span>
                    <span className="font-bold text-lg">{formatAmount(calculateTotals.sousTotal)}</span>
                  </div>
                  
                  {/* TVA - Saisie manuelle */}
                  <div className="flex justify-between items-center gap-4">
                    <Label htmlFor="tva-excel" className="whitespace-nowrap">TVA ({getCurrencySymbol()}) :</Label>
                    <Input
                      id="tva-excel"
                      type="number"
                      step={getInputStep()}
                      min="0"
                      value={montantTva}
                      onChange={(e) => {
                        setMontantTva(parseFloat(e.target.value) || 0);
                        setUserEditedTva(true);
                      }}
                      className="w-40 text-right"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Centime Additionnel - Saisie manuelle */}
                  <div className="flex justify-between items-center gap-4">
                    <Label htmlFor="centime-excel" className="whitespace-nowrap">Centime Add. ({getCurrencySymbol()}) :</Label>
                    <Input
                      id="centime-excel"
                      type="number"
                      step={getInputStep()}
                      min="0"
                      value={montantCentimeAdditionnel}
                      onChange={(e) => {
                        setMontantCentimeAdditionnel(parseFloat(e.target.value) || 0);
                        setUserEditedCentime(true);
                      }}
                      className="w-40 text-right"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* ASDI - Saisie manuelle */}
                  <div className="flex justify-between items-center gap-4">
                    <Label htmlFor="asdi-excel" className="whitespace-nowrap">ASDI ({getCurrencySymbol()}) :</Label>
                    <Input
                      id="asdi-excel"
                      type="number"
                      step={getInputStep()}
                      min="0"
                      value={montantAsdi}
                      onChange={(e) => {
                        setMontantAsdi(parseFloat(e.target.value) || 0);
                        setUserEditedAsdi(true);
                      }}
                      className="w-40 text-right"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Total TTC */}
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total TTC :</span>
                    <span className="text-primary">{formatAmount(calculateTotals.totalGeneral)}</span>
                  </div>
                </div>
              </div>
              
              {(montantTva === 0 || montantCentimeAdditionnel === 0) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {montantTva === 0 && montantCentimeAdditionnel === 0 
                      ? 'La TVA et le Centime Additionnel sont à zéro. Vérifiez avant de valider.'
                      : montantTva === 0 
                        ? 'La TVA est à zéro. Vérifiez avant de valider.'
                        : 'Le Centime Additionnel est à zéro. Vérifiez avant de valider.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Section 5: Actions */}
          {validationResult && validationResult.validLines.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">5️⃣ Actions</h3>
              
              {/* Bloc Contrôle Qualité aligné */}
              <div className="flex items-center gap-6 p-3 bg-muted/30 rounded-lg border">
                <span className="text-sm font-medium">Contrôle Qualité :</span>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="emballage-excel" 
                    checked={emballageConforme}
                    onCheckedChange={(checked) => setEmballageConforme(checked === true)}
                  />
                  <Label htmlFor="emballage-excel" className="text-sm cursor-pointer">Emballage conforme</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="temperature-excel" 
                    checked={temperatureRespectee}
                    onCheckedChange={(checked) => setTemperatureRespectee(checked === true)}
                  />
                  <Label htmlFor="temperature-excel" className="text-sm cursor-pointer">Température respectée</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="etiquetage-excel" 
                    checked={etiquetageCorrect}
                    onCheckedChange={(checked) => setEtiquetageCorrect(checked === true)}
                  />
                  <Label htmlFor="etiquetage-excel" className="text-sm cursor-pointer">Étiquetage correct</Label>
                </div>
              </div>
              
              {/* Indicateur de progression */}
              {isProcessing && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-700 dark:text-blue-300">Traitement en cours</AlertTitle>
                  <AlertDescription className="text-blue-600 dark:text-blue-400">
                    {processingStep}
                    <div className="mt-2 h-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: processingStep.includes('Préparation') ? '10%' :
                                 processingStep.includes('commande') ? '30%' :
                                 processingStep.includes('lignes') ? '60%' :
                                 processingStep.includes('stock') ? '85%' :
                                 processingStep.includes('Finalisation') ? '95%' :
                                 '100%'
                        }}
                      />
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Boutons d'action */}
              <div className="flex gap-2">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleValidateClick}
                  disabled={isProcessing || loading || validationResult.validLines.length === 0}
                  className="ml-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {processingStep || 'Traitement en cours...'}
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Valider la réception ({validationResult.validLines.length} lignes)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog pour avertissements de validation qualité */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Avertissements détectés
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-foreground">
                  Les points suivants nécessitent votre attention avant de valider la réception :
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pendingWarnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">{warning}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Voulez-vous continuer malgré ces avertissements ?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowWarningDialog(false);
              setPendingWarnings([]);
            }}>
              Annuler et corriger
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWithWarnings}>
              Continuer la validation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog pour TVA/Centime à zéro */}
      <AlertDialog open={showZeroWarningDialog} onOpenChange={setShowZeroWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Attention - TVA / Centime Additionnel à zéro
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {montantTva === 0 && montantCentimeAdditionnel === 0 ? (
                  <p>La <strong>TVA</strong> et le <strong>Centime Additionnel</strong> sont tous les deux à zéro. Êtes-vous sûr de vouloir continuer ?</p>
                ) : montantTva === 0 ? (
                  <p>La <strong>TVA</strong> est à zéro. Êtes-vous sûr de vouloir continuer sans TVA ?</p>
                ) : (
                  <p>Le <strong>Centime Additionnel</strong> est à zéro. Êtes-vous sûr de vouloir continuer sans centime additionnel ?</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Vous pouvez annuler pour corriger les montants, ou continuer si c'est intentionnel.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler et corriger</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmZeroWarning}>
              Continuer la validation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReceptionExcelImport;

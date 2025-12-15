import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { FileUp, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ExcelParserService } from '@/services/ExcelParserService';
import { AutoOrderCreationService } from '@/services/AutoOrderCreationService';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { usePriceCategories } from '@/hooks/usePriceCategories';
import type { ExcelReceptionLine, ParseResult, ValidationResult } from '@/types/excelImport';
import type { Reception } from '@/hooks/useReceptions';

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
  const calculateTotals = useMemo(() => {
    const { sousTotal } = calculateAutoSuggestions();
    
    // Total TTC = Sous-total HT + TVA + Centime + ASDI (valeurs modifiables)
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

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
      const result = await ExcelParserService.parseExcelFile(file);
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

    setValidating(true);
    try {
      const result = await ExcelParserService.validateReceptionData(lines, selectedSupplierId);
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

  // Vérification TVA/Centime à zéro avant validation
  const handleValidateClick = () => {
    if (!selectedSupplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (!validationResult || validationResult.validLines.length === 0) {
      toast.error('Aucune ligne valide à importer');
      return;
    }

    // Vérifier si TVA ou Centime = 0
    if (montantTva === 0 || montantCentimeAdditionnel === 0) {
      setShowZeroWarningDialog(true);
      return;
    }

    // Si tout est OK, procéder directement
    handleSubmit();
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

    try {
      let orderId = selectedOrderId;
      let isAutoCreated = false;

      // Si aucune commande n'est sélectionnée, en créer une automatiquement
      if (!orderId) {
        toast.info('Création automatique de la commande...');
        const orderResult = await AutoOrderCreationService.createOrderFromExcelData(
          selectedSupplierId,
          validationResult.validLines,
          validationResult.productMatches
        );
        orderId = orderResult.orderId;
        isAutoCreated = true;
        toast.success(`Commande ${orderResult.orderNumber} créée automatiquement`);
      }

      // Préparer les lignes de réception (avec les valeurs éditées)
      const lignes = validationResult.validLines.map(line => {
        const edited = editedLines.get(line.rowNumber);
        const finalLine = { ...line, ...edited };
        
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
          emplacement: finalLine.emplacement || null,
          commentaire: finalLine.commentaire || null
        };
      });

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

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const line of linesToAdd) {
        const normalizedCip = String(line.reference).trim();
        const normalizedName = String(line.produit).trim();

        const { data: existing } = await supabase
          .from('produits')
          .select('id')
          .eq('tenant_id', personnel.tenant_id)
          .eq('code_cip', normalizedCip)
          .maybeSingle();

        if (existing) {
          skipped++;
          errors.push(`"${normalizedName}" (CIP: ${normalizedCip}) existe déjà`);
          continue;
        }

        const { error } = await supabase
          .from('produits')
          .insert({
            tenant_id: personnel.tenant_id,
            libelle_produit: normalizedName,
            code_cip: normalizedCip,
            prix_achat: line.prixAchatReel,
            categorie_tarification_id: '52e236fb-9bf7-4709-bcb0-d8abb4b44db6',
            is_active: true
          });

        if (error) {
          errors.push(`Erreur pour "${normalizedName}": ${error.message}`);
        } else {
          created++;
        }
      }

      if (created > 0) {
        toast.success(`${created} produit(s) ajouté(s) au catalogue`);
      }
      if (skipped > 0) {
        toast.warning(`${skipped} produit(s) ignoré(s) (déjà existants)`);
      }
      if (errors.length > 0 && created === 0 && skipped === 0) {
        toast.error(`Erreurs: ${errors.slice(0, 3).join(', ')}`);
      }

      setSelectedForCatalog(new Set());

      if (parseResult?.lines) {
        await validateData(parseResult.lines);
      }

    } catch (error) {
      console.error('Erreur lors de l\'ajout des produits:', error);
      toast.error('Erreur lors de l\'ajout des produits au catalogue');
    } finally {
      setAddingToCatalog(false);
    }
  };

  const getLineValue = (line: ExcelReceptionLine, field: keyof ExcelReceptionLine) => {
    const edited = editedLines.get(line.rowNumber);
    return edited?.[field] !== undefined ? edited[field] : line[field];
  };

  // Fonction pour recalculer le statut après modification de date
  const recalculateLineStatusFromDate = (rowNumber: number, newDate: string) => {
    const now = new Date();
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    
    let newStatus: 'valid' | 'expired' | 'warning' = 'valid';
    let statusMessage = '';
    
    if (newDate) {
      const expDate = new Date(newDate);
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
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    
    let dateStatus: 'valid' | 'expired' | 'warning' = 'valid';
    if (editedDate) {
      const expDate = new Date(editedDate);
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
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      <AlertTitle>Erreurs de validation ({validationResult.errors.length})</AlertTitle>
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
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <Table>
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
                                  className="w-24 h-8"
                                  value={String(getLineValue(line, 'numeroLot'))}
                                  onChange={(e) => updateLineValue(line.rowNumber, 'numeroLot', e.target.value)}
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
              
              {/* Boutons d'action */}
              <div className="flex gap-2">
                <Button
                  onClick={resetForm}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleValidateClick}
                  disabled={loading || validationResult.validLines.length === 0}
                  className="ml-auto"
                >
                  {loading ? (
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

      {/* AlertDialog pour TVA/Centime à zéro */}
      <AlertDialog open={showZeroWarningDialog} onOpenChange={setShowZeroWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Attention - TVA / Centime Additionnel à zéro
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
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

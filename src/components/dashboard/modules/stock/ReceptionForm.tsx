import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Package, 
  QrCode, 
  AlertTriangle, 
  CheckCircle, 
  Save, 
  Truck,
  Calendar,
  FileText,
  Camera
} from 'lucide-react';
import { useOrderLines } from '@/hooks/useOrderLines';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useStockSettings } from '@/hooks/useStockSettings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { usePriceCategories } from '@/hooks/usePriceCategories';
import { ReceptionValidationService } from '@/services/receptionValidationService';
import { OrderStatusValidationService } from '@/services/orderStatusValidationService';
import { StockUpdateService } from '@/services/stockUpdateService';
import { supabase } from '@/integrations/supabase/client';
import BarcodeScanner from './BarcodeScanner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReceptionLine {
  id: string;
  produit: string;
  reference: string;
  quantiteCommandee: number;
  quantiteRecue: number;
  quantiteAcceptee: number;
  numeroLot: string;
  dateExpiration: string;
  statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
  commentaire: string;
  prixAchatReel?: number;
  emplacement?: string;
  categorieTarificationId?: string;
  produitId?: string;
}

interface ReceptionFormProps {
  orders: any[];
  suppliers: any[];
  onCreateReception: (receptionData: any) => Promise<any>;
  onUpdateOrderStatus?: (orderId: string, status: string) => Promise<any>;
  onRefreshOrders?: () => Promise<void>;
  loading: boolean;
}

const ReceptionForm: React.FC<ReceptionFormProps> = ({ 
  orders: propOrders = [], 
  suppliers: propSuppliers = [], 
  onCreateReception, 
  onUpdateOrderStatus,
  onRefreshOrders,
  loading 
}) => {
  const { t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState('');
  const [receptionLines, setReceptionLines] = useState<ReceptionLine[]>([]);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [bonLivraison, setBonLivraison] = useState('');
  const [transporteur, setTransporteur] = useState('');
  const [observations, setObservations] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStockProcessed, setIsStockProcessed] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingValidation, setPendingValidation] = useState<{ isValidated: boolean; warnings: string[] } | null>(null);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  // Montants TVA, Centime et ASDI en FCFA (saisie manuelle)
  const [montantTva, setMontantTva] = useState<number>(0);
  const [montantCentimeAdditionnel, setMontantCentimeAdditionnel] = useState<number>(0);
  const [montantAsdi, setMontantAsdi] = useState<number>(0);
  
  // Flags pour savoir si l'utilisateur a modifié manuellement les champs
  const [userEditedTva, setUserEditedTva] = useState<boolean>(false);
  const [userEditedCentime, setUserEditedCentime] = useState<boolean>(false);
  const [userEditedAsdi, setUserEditedAsdi] = useState<boolean>(false);
  const [currentOrderStatus, setCurrentOrderStatus] = useState<string>('En cours');
  // Contrôle qualité
  const [emballageConforme, setEmballageConforme] = useState<boolean>(false);
  const [temperatureRespectee, setTemperatureRespectee] = useState<boolean>(false);
  const [etiquetageCorrect, setEtiquetageCorrect] = useState<boolean>(false);
  // AlertDialog pour avertissement TVA/Centime/ASDI à zéro
  const [showZeroWarningDialog, setShowZeroWarningDialog] = useState(false);
  const [pendingZeroValidation, setPendingZeroValidation] = useState<{ isValidated: boolean } | null>(null);
  const { toast } = useToast();
  
  const { orderLines, loading: orderLinesLoading } = useOrderLines(selectedOrder);
  const { settings } = useSystemSettings();
  const { settings: stockSettings } = useStockSettings();
  const { products } = useProducts();
  const { user } = useAuth();
  const { formatAmount, getInputStep, isNoDecimalCurrency, getCurrencySymbol } = useCurrencyFormatting();
  const { categories: priceCategories } = usePriceCategories();

  // Fonction pour déterminer la classe CSS de la catégorie de tarification
  const getCategoryColorClass = (categoryId: string | undefined): string => {
    if (!categoryId || categoryId === 'none' || categoryId === '') {
      return 'border-destructive bg-destructive/10'; // Rouge - catégorie manquante
    }
    
    const category = priceCategories?.find(cat => cat.id === categoryId);
    if (category && category.taux_tva > 0) {
      return 'border-blue-500 bg-blue-50'; // Bleu - avec TVA
    }
    
    return ''; // Normal - sans TVA
  };

  // Use real orders with appropriate statuses for reception - only "Livré" can be received
  const pendingOrders = propOrders.filter(order => 
    ['Livré'].includes(order.statut)
  ).map(order => ({
    ...order,
    numero: `CMD-${new Date(order.date_commande || order.created_at).getFullYear()}-${String(order.id).slice(-3).padStart(3, '0')}`,
    fournisseur: order.fournisseur?.nom || 'Fournisseur inconnu',
    datePrevue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));

  // Fonction pour générer un numéro de lot automatique
  const generateLotNumber = useCallback((productRef: string, index: number) => {
    const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
    const sequence = (index + 1).toString().padStart(3, '0');
    return `LOT-${productRef.slice(0, 8).toUpperCase()}-${timestamp}-${sequence}`;
  }, []);

  // Load order details from real data - only when data is ready
  const loadOrderDetails = useCallback((orderId: string) => {
    if (orderLinesLoading || !orderId) return;

    const lines: ReceptionLine[] = orderLines.map((line, index) => {
      // Générer automatiquement le numéro de lot si le paramètre est activé
      let numeroLot = '';
      if (stockSettings.auto_generate_lots) {
        const productRef = line.produit?.code_cip || 'PROD';
        numeroLot = generateLotNumber(productRef, index);
        console.log('🔢 Lot auto-généré au chargement:', numeroLot);
      }

      return {
        id: line.id,
        produit: line.produit?.libelle_produit || 'Produit inconnu',
        reference: line.produit?.code_cip || 'N/A',
        quantiteCommandee: line.quantite_commandee,
        quantiteRecue: line.quantite_commandee, // Default to commanded quantity
        quantiteAcceptee: line.quantite_commandee,
        numeroLot: numeroLot,
        dateExpiration: '',
        statut: 'conforme',
        commentaire: '',
        prixAchatReel: line.prix_achat_unitaire_attendu || 0,
        emplacement: '',
        categorieTarificationId: line.produit?.categorie_tarification_id || '',
        produitId: line.produit_id,
      };
    });
    setReceptionLines(lines);
    
    // Réinitialiser les montants manuels et les flags d'édition
    setMontantTva(0);
    setMontantCentimeAdditionnel(0);
    setMontantAsdi(0);
    setUserEditedTva(false);
    setUserEditedCentime(false);
    setUserEditedAsdi(false);
  }, [orderLines, orderLinesLoading, stockSettings.auto_generate_lots, generateLotNumber]);

  // Effect to load details when selectedOrder changes and data is ready
  useEffect(() => {
    if (selectedOrder) {
      // Reset reception lines first
      setReceptionLines([]);
      // Load details once data is fetched
      const timer = setTimeout(() => {
        loadOrderDetails(selectedOrder);
      }, 100); // Small delay to ensure hook has updated
      return () => clearTimeout(timer);
    } else {
      setReceptionLines([]);
    }
  }, [selectedOrder, loadOrderDetails]);

  const updateReceptionLine = (id: string, field: keyof ReceptionLine, value: any) => {
    setReceptionLines(lines => lines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value };
        
        // Déterminer automatiquement le statut
        if (updatedLine.quantiteRecue === updatedLine.quantiteCommandee && updatedLine.quantiteAcceptee === updatedLine.quantiteRecue) {
          updatedLine.statut = 'conforme';
        } else if (updatedLine.quantiteAcceptee > 0) {
          updatedLine.statut = 'partiellement-conforme';
        } else {
          updatedLine.statut = 'non-conforme';
        }
        
        // Auto-generate lot number ONLY if setting is enabled and quantity accepted > 0
        if (field === 'quantiteAcceptee' && updatedLine.quantiteAcceptee > 0 && !updatedLine.numeroLot) {
          // Générer uniquement si le paramètre auto_generate_lots est activé
          if (stockSettings.auto_generate_lots) {
            const productRef = updatedLine.reference || 'UNK';
            const lineIndex = receptionLines.findIndex(l => l.id === id);
            updatedLine.numeroLot = generateLotNumber(productRef, lineIndex);
            console.log('🔢 Lot auto-généré à la modification:', updatedLine.numeroLot);
          }
        }
        
        return updatedLine;
      }
      return line;
    }));
  };

  // Calcul automatique des suggestions TVA/Centime/ASDI basé sur les catégories produit
  const calculateAutoSuggestions = useCallback(() => {
    let autoTva = 0;
    let autoCentime = 0;
    let sousTotal = 0;

    receptionLines.forEach(line => {
      const categoryId = line.categorieTarificationId;
      const category = priceCategories?.find(cat => cat.id === categoryId);
      const tauxTva = category?.taux_tva || 0;
      const tauxCentime = category?.taux_centime_additionnel || 0;
      
      const lineTotalHT = (line.quantiteAcceptee * (line.prixAchatReel || 0));
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
  }, [receptionLines, priceCategories, isNoDecimalCurrency]);

  // Synchroniser les calculs automatiques vers les champs modifiables
  // SEULEMENT si l'utilisateur n'a pas modifié manuellement
  useEffect(() => {
    if (receptionLines.length > 0) {
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
    }
  }, [receptionLines, priceCategories, calculateAutoSuggestions, userEditedTva, userEditedCentime, userEditedAsdi]);

  // Calculate financial totals - Sous-total HT automatique, TVA, Centime et ASDI modifiables
  const calculateTotals = () => {
    const { sousTotal } = calculateAutoSuggestions();
    
    // Total TTC = Sous-total HT + TVA (modifiable) + Centime (modifiable) + ASDI (modifiable)
    const totalGeneral = sousTotal + montantTva + montantCentimeAdditionnel + montantAsdi;
    
    return { sousTotal, tva: montantTva, centimeAdditionnel: montantCentimeAdditionnel, asdi: montantAsdi, totalGeneral };
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'conforme': return 'bg-green-100 text-green-800';
      case 'partiellement-conforme': return 'bg-orange-100 text-orange-800';
      case 'non-conforme': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'conforme': return <CheckCircle className="h-4 w-4" />;
      case 'partiellement-conforme': return <AlertTriangle className="h-4 w-4" />;
      case 'non-conforme': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const validateExpirationDate = (dateExpiration: string): boolean => {
    if (!dateExpiration) return true; // Optional field
    
    const today = new Date();
    const expDate = new Date(dateExpiration);
    const minDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // Minimum 30 days from now
    
    return expDate >= minDate;
  };

  const checkLowStockAlerts = async (processedLines: ReceptionLine[]) => {
    try {
      const lowStockAlerts: string[] = [];
      
      for (const line of processedLines) {
        if (line.quantiteAcceptee > 0) {
          const produitId = orderLines.find(ol => ol.id === line.id)?.produit_id;
          if (produitId) {
            const product = products.find(p => p.id === produitId);
            if (product && product.stock_limite && product.stock_limite > 0) {
              // Calculate new stock level (this is an approximation - actual stock would come from the database)
              const currentStock = product.stock_alerte || 0;
              const newStockLevel = currentStock + line.quantiteAcceptee;
              
              if (newStockLevel <= product.stock_limite) {
                lowStockAlerts.push(`${line.produit} (Stock: ${newStockLevel}, Seuil: ${product.stock_limite})`);
              }
            }
          }
        }
      }
      
      if (lowStockAlerts.length > 0) {
        toast({
          title: t('receptionFormLowStockAlert'),
          description: t('receptionFormLowStockProducts') + ': ' + lowStockAlerts.join(', '),
          variant: "destructive",
          duration: 10000, // Show for 10 seconds
        });
      }
    } catch (error) {
      console.error('❌ Error checking low stock alerts:', error);
    }
  };

  const logReceptionActivity = (receptionData: any, isValidated: boolean) => {
    try {
      const userName = user?.email || 'Utilisateur inconnu';
      const totalProducts = receptionData.lignes.reduce((sum: number, line: any) => sum + line.quantite_acceptee, 0);
      const totalValue = receptionData.lignes.reduce((sum: number, line: any) => sum + (line.quantite_acceptee * (line.prix_achat_reel || 0)), 0);
      
      console.log(`📦 Reception ${isValidated ? 'validated' : 'saved'} by ${userName}`);
      console.log(`📊 Total products: ${totalProducts}, Total value: ${totalValue.toFixed(2)}`);
      console.log(`📝 Reference: ${receptionData.reference_facture || 'N/A'}`);
      
      // Here you could add a call to an activity logging service if available
      // For example: await ActivityService.log('reception_created', { receptionId: receptionData.id, userId: user?.id });
      
    } catch (error) {
      console.error('❌ Error logging reception activity:', error);
    }
  };

  const handleBarcodeSubmit = () => {
    if (!scannedBarcode.trim()) {
      toast({
        title: t('receptionFormError'),
        description: t('receptionFormEnterBarcode'),
        variant: "destructive",
      });
      return;
    }

    // Chercher le produit dans les lignes de commande
    const matchingOrderLine = orderLines.find(ol => 
      ol.produit && ol.produit.code_cip && ol.produit.code_cip === scannedBarcode.trim()
    );

    if (!matchingOrderLine) {
      toast({
        title: t('receptionFormProductNotFound'),
        description: t('receptionFormNoProductWithCode', { code: scannedBarcode }),
        variant: "destructive",
      });
      setScannedBarcode('');
      return;
    }

    // Mettre à jour la ligne correspondante
    const existingLine = receptionLines.find(rl => rl.id === matchingOrderLine.id);
    if (existingLine) {
      updateReceptionLine(existingLine.id, 'quantiteRecue', existingLine.quantiteRecue + 1);
      updateReceptionLine(existingLine.id, 'quantiteAcceptee', existingLine.quantiteAcceptee + 1);
      
      toast({
        title: t('receptionFormProductProcessed'),
        description: `${matchingOrderLine.produit?.libelle_produit || t('orderListProduct')} - ${t('receptionFormQuantityIncremented')}`,
      });
    }

    setScannedBarcode('');
  };

  const handleCameraOpen = async () => {
    try {
      if ('BarcodeDetector' in window) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setCameraStream(stream);
        setShowCameraDialog(true);
        
        // Initialiser le détecteur de codes-barres
        // @ts-ignore - BarcodeDetector n'est pas encore dans les types TypeScript
        const barcodeDetector = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'qr_code']
        });
        
        // TODO: Implémenter la détection en temps réel
        toast({
          title: t('receptionFormCameraActivated'),
          description: t('receptionFormScannerActivated'),
        });
      } else {
        toast({
          title: t('receptionFormScannerNotSupported'),
          description: t('receptionFormUseManual'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('receptionFormCameraError'),
        description: t('receptionFormCameraAccessError'),
        variant: "destructive",
      });
    }
  };

  const handleCameraClose = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraDialog(false);
  };

  const resetForm = () => {
    setSelectedOrder('');
    setReceptionLines([]);
    setBonLivraison('');
    setTransporteur('');
    setObservations('');
    setPendingValidation(null);
    setIsStockProcessed(false);
    setMontantTva(0);
    setMontantCentimeAdditionnel(0);
    setMontantAsdi(0);
    setEmballageConforme(false);
    setTemperatureRespectee(false);
    setEtiquetageCorrect(false);
    setPendingZeroValidation(null);
  };

  // Fonction helper pour la mise à jour du statut
  const updateOrderStatusInDatabase = async (orderId: string, newStatus: string) => {
    try {
      // @ts-ignore - Ignorer les erreurs de typage complexe de Supabase
      const { error } = await supabase
        .from('commandes_fournisseurs')
        .update({ 
          statut: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      return { error };
    } catch (err) {
      console.error('Database update error:', err);
      return { error: err };
    }
  };

  const updateOrderStatus = async (selectedOrderData: any, isValidated: boolean, createdReception: any, orderId: string) => {
    if (!isValidated || !createdReception) return;
    
    try {
      console.log('🔄 Updating order status to Réceptionné...');
      
      const statusValidation = OrderStatusValidationService.canTransitionTo(
        selectedOrderData.statut,
        'Réceptionné'
      );
      
      if (statusValidation.canTransition) {
        try {
          const { error: updateError } = await updateOrderStatusInDatabase(orderId, 'Réceptionné');
          
          if (updateError) {
            console.error('❌ Error updating order status:', updateError);
        toast({
          title: t('receptionFormWarningStatus'),
          description: t('receptionFormStatusError'),
          variant: "destructive",
        });
      } else {
        console.log('✅ Order status updated to Réceptionné successfully');
        
            if (onRefreshOrders) {
              await onRefreshOrders();
            }
          }
      } catch (supabaseError) {
        console.error('❌ Supabase error during order status update:', supabaseError);
        toast({
          title: t('receptionFormWarningStatus'),
          description: t('receptionFormStatusError'),
          variant: "destructive",
        });
      }
      } else {
        console.warn('⚠️ Order status transition from', selectedOrderData.statut, 'to Réceptionné is not allowed');
        toast({
          title: t('receptionFormWarningStatus'),
          description: t('receptionFormStatusTransitionNotAllowed', { from: selectedOrderData.statut, to: 'Réceptionné' }),
          variant: "destructive",
        });
      }
    } catch (statusError) {
      console.error('❌ Error during order status update:', statusError);
      toast({
        title: t('receptionFormWarningStatus'),
        description: t('receptionFormStatusError'),
        variant: "destructive",
      });
    }
  };

  const processStockReception = async (createdReception: any, selectedOrderData: any) => {
    try {
      console.log('🔄 Processing reception for lot creation and stock movements...');
      
      const stockReceptionData = {
        id: createdReception.id,
        commande_id: createdReception.commande_id || selectedOrderData.id,
        fournisseur_id: selectedOrderData.fournisseur_id,
        date_reception: createdReception.date_reception || new Date().toISOString(),
        lignes: receptionLines
          .filter(line => line.quantiteAcceptee > 0)
          .map(line => ({
            produit_id: orderLines.find(ol => ol.id === line.id)?.produit_id,
            quantite_acceptee: line.quantiteAcceptee,
            numero_lot: line.numeroLot,
            date_expiration: line.dateExpiration || null,
            prix_achat_reel: line.prixAchatReel || 0,
            reference: line.reference,
            libelle_produit: line.produit
          }))
      };

      await StockUpdateService.processReception(stockReceptionData);
      
      console.log('✅ Lots and stock movements processed successfully');
      
      toast({
        title: t('receptionFormStockUpdated'),
        description: t('receptionFormStockSuccess'),
      });
      
      await checkLowStockAlerts(receptionLines);
      
    } catch (stockError) {
      console.error('❌ Error during stock processing:', stockError);
      toast({
        title: t('receptionFormStockWarning'),
        description: t('receptionFormStockError'),
        variant: "destructive",
      });
    }
  };

  const handleSaveReception = async (isValidated: boolean) => {
    if (isProcessing || isStockProcessed) {
      console.warn('⚠️ Reception already processing or processed');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      if (!selectedOrder) {
        toast({
          title: t('receptionFormError'),
          description: t('receptionFormSelectOrderError'),
          variant: "destructive",
        });
        return;
      }

      const selectedOrderData = pendingOrders.find(o => o.id === selectedOrder);
      if (!selectedOrderData) {
        toast({
          title: t('receptionFormError'),
          description: t('receptionFormOrderNotFound'),
          variant: "destructive",
        });
        return;
      }

      // Check if order is already received
      if (selectedOrderData.statut === 'Réceptionné') {
        toast({
          title: t('receptionFormAlreadyReceived'),
          description: t('receptionFormAlreadyReceivedDesc'),
          variant: "destructive",
        });
        return;
      }

      // Validate reception data
      const receptionData = {
        commande_id: selectedOrder,
        fournisseur_id: selectedOrderData.fournisseur_id,
        date_reception: new Date().toISOString(),
        reference_facture: bonLivraison,
        notes: observations,
        isValidated: isValidated, // Ajout du paramètre isValidated
        lignes: receptionLines.map(line => ({
          produit_id: orderLines.find(ol => ol.id === line.id)?.produit_id,
          quantite_commandee: line.quantiteCommandee,
          quantite_recue: line.quantiteRecue,
          quantite_acceptee: line.quantiteAcceptee,
          numero_lot: line.numeroLot,
          date_expiration: line.dateExpiration || null,
          statut: line.statut,
          commentaire: line.commentaire,
          prix_achat_reel: line.prixAchatReel || 0,
          emplacement: line.emplacement || null
        }))
      };

      // Reception validation
      const validation = await ReceptionValidationService.validateReception(receptionData);
      
      if (!validation.isValid) {
        toast({
          title: t('receptionFormValidationErrors'),
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }


      // Handle warnings if present and not already confirmed
      if (validation.warnings.length > 0 && !pendingValidation) {
        setPendingValidation({ isValidated, warnings: validation.warnings });
        setShowWarningDialog(true);
        return;
      }

      // Vérifier si TVA ou Centime = 0 et afficher avertissement
      if ((montantTva === 0 || montantCentimeAdditionnel === 0) && !pendingZeroValidation) {
        setPendingZeroValidation({ isValidated });
        setShowZeroWarningDialog(true);
        return;
      }

      // Calculer les totaux financiers
      const { sousTotal, totalGeneral } = calculateTotals();

      // Create the reception with validation status and financial data
      const receptionPayload = {
        ...receptionData,
        isValidated: isValidated,
        montant_ht: sousTotal,
        montant_tva: montantTva,
        montant_centime_additionnel: montantCentimeAdditionnel,
        montant_ttc: totalGeneral
      };
      
      const createdReception = await onCreateReception(receptionPayload);
      
      if (!createdReception) {
        toast({
          title: t('receptionFormError'),
          description: t('receptionFormReceptionError'),
          variant: "destructive",
        });
        return;
      }

      // Marquer comme traité immédiatement après création
      setIsStockProcessed(true);
      console.log('✅ Reception created:', createdReception.id);
      console.log('📊 Stock already processed by useReceptions.createReception hook');

      // Log reception activity
      logReceptionActivity(receptionData, isValidated);
      
      // Update order status
      console.log('✅ Order status will be updated to:', isValidated ? 'Réceptionné' : currentOrderStatus);
      await updateOrderStatus(selectedOrderData, isValidated, createdReception, selectedOrder);

      // Reset form
      resetForm();
      
      toast({
        title: t('receptionFormSuccess'),
        description: isValidated ? t('receptionFormValidated') : t('receptionFormSavedSuccess'),
      });
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: t('receptionFormError'),
        description: t('receptionFormSaveError'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler pour confirmer après avertissement TVA/Centime à zéro
  const handleConfirmZeroWarning = async () => {
    if (!pendingZeroValidation) return;
    setShowZeroWarningDialog(false);
    
    // Relancer la sauvegarde avec le flag de confirmation
    const isValidated = pendingZeroValidation.isValidated;
    setPendingZeroValidation(null);
    
    // Re-exécuter la logique de sauvegarde
    try {
      const selectedOrderData = pendingOrders.find(o => o.id === selectedOrder);
      if (!selectedOrderData) return;

      const { sousTotal, totalGeneral } = calculateTotals();

      const receptionData = {
        commande_id: selectedOrder,
        fournisseur_id: selectedOrderData.fournisseur_id,
        date_reception: new Date().toISOString(),
        reference_facture: bonLivraison,
        notes: observations,
        isValidated: isValidated,
        montant_ht: sousTotal,
        montant_tva: montantTva,
        montant_centime_additionnel: montantCentimeAdditionnel,
        montant_ttc: totalGeneral,
        lignes: receptionLines.map(line => ({
          produit_id: orderLines.find(ol => ol.id === line.id)?.produit_id,
          quantite_commandee: line.quantiteCommandee,
          quantite_recue: line.quantiteRecue,
          quantite_acceptee: line.quantiteAcceptee,
          numero_lot: line.numeroLot,
          date_expiration: line.dateExpiration || null,
          statut: line.statut,
          commentaire: line.commentaire,
          prix_achat_reel: line.prixAchatReel || 0,
          emplacement: line.emplacement || null
        }))
      };

      const createdReception = await onCreateReception(receptionData);
      
      if (createdReception) {
        setIsStockProcessed(true);
        logReceptionActivity(receptionData, isValidated);
        await updateOrderStatus(selectedOrderData, isValidated, createdReception, selectedOrder);
        resetForm();
        
        toast({
          title: t('receptionFormSuccess'),
          description: isValidated ? t('receptionFormValidated') : t('receptionFormSavedSuccess'),
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: t('receptionFormError'),
        description: t('receptionFormSaveError'),
        variant: "destructive",
      });
    }
  };

  const handleConfirmWithWarnings = async () => {
    if (!pendingValidation) return;
    
    if (isStockProcessed) {
      console.warn('⚠️ Reception already processed');
      return;
    }
    
    setShowWarningDialog(false);
    const isValidated = true;
    
    try {
      const selectedOrderData = pendingOrders.find(o => o.id === selectedOrder);
      if (!selectedOrderData) {
        toast({
          title: t('receptionFormError'),
          description: t('receptionFormOrderNotFound'),
          variant: "destructive",
        });
        return;
      }
      
      const { sousTotal, totalGeneral } = calculateTotals();
      
      const receptionData = {
        commande_id: selectedOrder,
        fournisseur_id: selectedOrderData.fournisseur_id,
        date_reception: new Date().toISOString(),
        reference_facture: bonLivraison,
        notes: observations,
        montant_ht: sousTotal,
        montant_tva: montantTva,
        montant_centime_additionnel: montantCentimeAdditionnel,
        montant_ttc: totalGeneral,
        lignes: receptionLines.map(line => ({
          produit_id: orderLines.find(ol => ol.id === line.id)?.produit_id,
          quantite_commandee: line.quantiteCommandee,
          quantite_recue: line.quantiteRecue,
          quantite_acceptee: line.quantiteAcceptee,
          numero_lot: line.numeroLot,
          date_expiration: line.dateExpiration || null,
          statut: line.statut,
          commentaire: line.commentaire,
          prix_achat_reel: line.prixAchatReel || 0,
          emplacement: line.emplacement || null
        })),
        isValidated: true
      };

      const createdReception = await onCreateReception(receptionData);
      
      if (!createdReception) {
        toast({
          title: t('receptionFormError'),
          description: t('receptionFormReceptionError'),
          variant: "destructive",
        });
        return;
      }
      
      // Marquer comme traité immédiatement après création
      setIsStockProcessed(true);
      console.log('✅ Reception with warnings created:', createdReception.id);
      console.log('📊 Stock already processed by useReceptions.createReception hook');
      
      // Log reception activity
      logReceptionActivity(receptionData, isValidated);
      
      // Update order status
      console.log('✅ Order status will be updated to: Réceptionné');
      await updateOrderStatus(selectedOrderData, isValidated, createdReception, selectedOrder);

      // Reset form
      resetForm();
      
      toast({
        title: t('receptionFormSuccess'),
        description: t('receptionFormValidated'),
      });
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: t('receptionFormError'),
        description: t('receptionFormSaveError'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Sélection de commande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('receptionFormTitle')}
          </CardTitle>
          <CardDescription>{t('receptionFormDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="commande">{t('receptionFormOrderToReceive')} *</Label>
                <Select value={selectedOrder} onValueChange={(value) => {
                  setSelectedOrder(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('receptionFormSelectOrder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.numero} - {order.fournisseur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dateReception">{t('receptionFormReceptionDate')}</Label>
                <Input
                  id="dateReception"
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="bonLivraison">{t('receptionFormDeliveryNote')}</Label>
                 <Input
                   id="bonLivraison"
                   value={bonLivraison}
                   onChange={(e) => setBonLivraison(e.target.value)}
                   placeholder={t('receptionFormDeliveryNotePlaceholder')}
                 />
              </div>
              
              <div>
                <Label htmlFor="transporteur">{t('receptionFormCarrier')}</Label>
                 <Input
                   id="transporteur"
                   value={transporteur}
                   onChange={(e) => setTransporteur(e.target.value)}
                   placeholder={t('receptionFormCarrierPlaceholder')}
                 />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="observations">{t('receptionFormNotes')}</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder={t('receptionFormNotesPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner de code-barres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('receptionFormBarcodeScanner')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('receptionFormBarcodePlaceholder')}
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
              />
            </div>
            <Button onClick={handleBarcodeSubmit}>
              <QrCode className="mr-2 h-4 w-4" />
              {t('receptionFormProcess')}
            </Button>
            <Button variant="outline" onClick={handleCameraOpen}>
              <Camera className="mr-2 h-4 w-4" />
              {t('receptionFormCamera')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Dialog */}
      <BarcodeScanner
        isOpen={showCameraDialog}
        onClose={handleCameraClose}
        onScanResult={(barcode) => {
          setScannedBarcode(barcode);
          handleBarcodeSubmit();
        }}
        title="Scanner de Réception"
      />

      {/* Détail de la réception */}
      {receptionLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('receptionFormReceptionDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-96 overflow-x-scroll overflow-y-scroll">
              <Table className="min-w-[1400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('receptionFormProduct')}</TableHead>
                    <TableHead>{t('receptionFormPricingCategory')}</TableHead>
                    <TableHead>{t('receptionFormOrdered')}</TableHead>
                    <TableHead>{t('receptionFormReceived')}</TableHead>
                    <TableHead>{t('receptionFormAccepted')}</TableHead>
                    <TableHead>{t('receptionFormRealPrice')}</TableHead>
                    <TableHead>{t('receptionFormLotNumber')}</TableHead>
                    <TableHead>{t('receptionFormExpiration')}</TableHead>
                    <TableHead>{t('receptionFormLocation')}</TableHead>
                    <TableHead>{t('receptionFormStatus')}</TableHead>
                    <TableHead>{t('receptionFormComment')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receptionLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{line.produit}</span>
                          <span className="text-xs text-muted-foreground font-mono">{line.reference}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={line.categorieTarificationId || 'none'}
                          onValueChange={(value) => {
                            const catId = value === 'none' ? '' : value;
                            updateReceptionLine(line.id, 'categorieTarificationId', catId);
                            // Mise à jour du produit dans la base de données si produitId disponible
                            if (line.produitId && catId) {
                              supabase
                                .from('produits')
                                .update({ categorie_tarification_id: catId })
                                .eq('id', line.produitId)
                                .then(({ error }) => {
                                  if (!error) {
                                    toast({ title: t('receptionFormCategoryUpdated'), description: t('receptionFormProductUpdated') });
                                  }
                                });
                            }
                          }}
                        >
                        <SelectTrigger className={`w-36 ${getCategoryColorClass(line.categorieTarificationId)}`}>
                          <SelectValue placeholder={t('receptionFormCategory')} />
                        </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('receptionFormNone')}</SelectItem>
                            {priceCategories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.libelle_categorie}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{line.quantiteCommandee}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.quantiteRecue}
                          onChange={(e) => updateReceptionLine(line.id, 'quantiteRecue', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.quantiteAcceptee}
                          onChange={(e) => updateReceptionLine(line.id, 'quantiteAcceptee', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          max={line.quantiteRecue}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step={getInputStep()}
                          value={line.prixAchatReel || 0}
                          onChange={(e) => updateReceptionLine(line.id, 'prixAchatReel', parseFloat(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          placeholder="Prix réel"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.numeroLot}
                          onChange={(e) => updateReceptionLine(line.id, 'numeroLot', e.target.value.toUpperCase())}
                          className="w-28 uppercase"
                          placeholder="LOT-XXX"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={line.dateExpiration}
                          onChange={(e) => updateReceptionLine(line.id, 'dateExpiration', e.target.value)}
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.emplacement || ''}
                          onChange={(e) => updateReceptionLine(line.id, 'emplacement', e.target.value)}
                          className="w-24"
                          placeholder="Ex: A1"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(line.statut)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(line.statut)}
                          {line.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.commentaire}
                          onChange={(e) => updateReceptionLine(line.id, 'commentaire', e.target.value)}
                          className="w-32"
                          placeholder="Commentaire..."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculs Financiers */}
      {receptionLines.length > 0 && (() => {
        const { sousTotal, tva, centimeAdditionnel, asdi, totalGeneral } = calculateTotals();
        const currencySymbol = getCurrencySymbol();
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t('receptionFormFinancialCalculations')}</CardTitle>
            <CardDescription>
              {t('receptionFormFinancialDescription')}
            </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end">
                <div className="w-96 space-y-4">
                  {/* Sous-total HT - Calculé automatiquement */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{t('receptionFormSubtotalHT')} :</span>
                    <span className="font-bold text-lg">{formatAmount(sousTotal)}</span>
                  </div>
                  
                  {/* TVA - Saisie manuelle en montant */}
                  <div className="flex justify-between items-center gap-4">
                    <Label htmlFor="montant-tva" className="whitespace-nowrap">{t('receptionFormVAT')} ({currencySymbol}) :</Label>
                    <Input
                      id="montant-tva"
                      type="number"
                      value={montantTva}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setMontantTva(isNoDecimalCurrency() ? Math.round(value) : value);
                        setUserEditedTva(true);
                      }}
                      className="w-40 text-right"
                      min="0"
                      step={getInputStep()}
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Centime Additionnel - Saisie manuelle en montant */}
                  <div className="flex justify-between items-center gap-4">
                    <Label htmlFor="montant-centime" className="whitespace-nowrap">{t('receptionFormAdditionalCentime')} ({currencySymbol}) :</Label>
                    <Input
                      id="montant-centime"
                      type="number"
                      value={montantCentimeAdditionnel}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setMontantCentimeAdditionnel(isNoDecimalCurrency() ? Math.round(value) : value);
                        setUserEditedCentime(true);
                      }}
                      className="w-40 text-right"
                      min="0"
                      step={getInputStep()}
                      placeholder="0"
                    />
                  </div>
                  
                  {/* ASDI - Saisie manuelle en montant */}
                  <div className="flex justify-between items-center gap-4">
                    <Label htmlFor="montant-asdi" className="whitespace-nowrap">{t('receptionFormASDI')} ({currencySymbol}) :</Label>
                    <Input
                      id="montant-asdi"
                      type="number"
                      value={montantAsdi}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setMontantAsdi(isNoDecimalCurrency() ? Math.round(value) : value);
                        setUserEditedAsdi(true);
                      }}
                      className="w-40 text-right"
                      min="0"
                      step={getInputStep()}
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Total TTC */}
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>{t('receptionFormTotalTTC')} :</span>
                    <span className="text-primary">{formatAmount(totalGeneral)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Contrôle qualité */}
      {receptionLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('receptionFormQualityControl')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="emballage" 
                    checked={emballageConforme}
                    onCheckedChange={(checked) => setEmballageConforme(checked === true)}
                  />
                  <Label htmlFor="emballage">{t('receptionFormPackagingCompliant')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="temperature" 
                    checked={temperatureRespectee}
                    onCheckedChange={(checked) => setTemperatureRespectee(checked === true)}
                  />
                  <Label htmlFor="temperature">{t('receptionFormTemperatureRespected')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="etiquetage" 
                    checked={etiquetageCorrect}
                    onCheckedChange={(checked) => setEtiquetageCorrect(checked === true)}
                  />
                  <Label htmlFor="etiquetage">{t('receptionFormLabelingCorrect')}</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="observations">{t('receptionFormGeneralObservations')}</Label>
                 <Textarea
                   id="observations"
                   value={observations}
                   onChange={(e) => setObservations(e.target.value)}
                   placeholder={t('receptionFormObservationsPlaceholder')}
                   rows={3}
                 />
              </div>
              
               <div className="flex gap-4 justify-end">
                 <Button 
                   variant="outline"
                   onClick={() => handleSaveReception(false)}
                   disabled={loading || isProcessing || !selectedOrder || receptionLines.length === 0}
                 >
                   <Save className="mr-2 h-4 w-4" />
                   {isProcessing ? t('receptionFormProcessing') : t('receptionFormSave')}
                 </Button>
                 <Button
                   onClick={() => handleSaveReception(true)}
                   disabled={loading || isProcessing || !selectedOrder || receptionLines.length === 0}
                 >
                   <CheckCircle className="mr-2 h-4 w-4" />
                   {isProcessing ? t('receptionFormValidating') : t('receptionFormValidateReception')}
                 </Button>
               </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'avertissements */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('receptionFormWarningsDetected')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValidation?.warnings.map((warning, index) => (
                <div key={index} className="text-amber-600 mb-2">• {warning}</div>
              ))}
              <br />
              {t('receptionFormContinueWithWarnings')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowWarningDialog(false);
              setPendingValidation(null);
            }}>
              {t('receptionFormCancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWithWarnings}>
              {t('receptionFormContinue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog pour avertissement TVA/Centime à zéro */}
      <AlertDialog open={showZeroWarningDialog} onOpenChange={setShowZeroWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('receptionFormVATCentimeZeroWarningTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {montantTva === 0 && montantCentimeAdditionnel === 0 ? (
                <>{t('receptionFormVATAndCentimeZero')}</>
              ) : montantTva === 0 ? (
                <>{t('receptionFormVATZero')}</>
              ) : (
                <>{t('receptionFormCentimeZero')}</>
              )}
              <br /><br />
              {t('receptionFormConfirmZeroValidation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowZeroWarningDialog(false);
              setPendingZeroValidation(null);
            }}>
              {t('receptionFormCancelAndCorrect')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmZeroWarning}>
              {t('receptionFormContinueValidation')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog caméra */}
      <Dialog open={showCameraDialog} onOpenChange={handleCameraClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('receptionFormBarcodeScannerTitle')}</DialogTitle>
            <DialogDescription>
              {t('receptionFormBarcodeScannerDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {cameraStream ? (
              <video 
                autoPlay 
                playsInline 
                className="w-full max-w-sm rounded-lg border"
                ref={(video) => {
                  if (video && cameraStream) {
                    video.srcObject = cameraStream;
                  }
                }}
              />
            ) : (
              <div className="w-full max-w-sm h-64 rounded-lg border flex items-center justify-center text-muted-foreground">
                {t('receptionFormCameraInitializing')}
              </div>
            )}
            <Button onClick={handleCameraClose} variant="outline">
              {t('receptionFormClose')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceptionForm;

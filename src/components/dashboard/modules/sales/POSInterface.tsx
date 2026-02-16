import React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, User, CreditCard, AlertCircle, Search, Gift, PackageX, FileText, TrendingUp, Banknote, Loader2, Receipt, ClipboardList, ShieldCheck } from 'lucide-react';
import PriceEditDialog from './pos/PriceEditDialog';
import { CashExpenseModal } from './cash/CashExpenseModal';
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions';
import ProductSearch from './pos/ProductSearch';
import ShoppingCartComponent from './pos/ShoppingCartComponent';
import CustomerSelection from './pos/CustomerSelection';
import PaymentModal from './pos/PaymentModal';
import SalesOnlyInterface from './pos/SalesOnlyInterface';
import CashRegisterInterface from './pos/CashRegisterInterface';
import { ReturnExchangeModal } from '../pos/ReturnExchangeModal';
import { LoyaltyPanel } from '../pos/LoyaltyPanel';
import { PrescriptionModal } from '../pos/PrescriptionModal';
import { SplitPaymentDialog } from '../pos/SplitPaymentDialog';
import { POSAnalyticsDashboard } from '../pos/POSAnalyticsDashboard';
import ProductDemandModal from '../pos/ProductDemandModal';
import POSBarcodeActions from './pos/POSBarcodeActions';
import { usePOSData } from '@/hooks/usePOSData';
import { useCashSession } from '@/hooks/useCashSession';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { usePOSAnalytics } from '@/hooks/usePOSAnalytics';
import { useRegionalSettings } from '@/hooks/useRegionalSettings';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import { usePOSCalculations } from '@/hooks/usePOSCalculations';
import { useClientDebt, useCanAddDebt } from '@/hooks/useClientDebt';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { TransactionData, CartItemWithLot, CustomerInfo, CustomerType } from '@/types/pos';
import { setupBarcodeScanner } from '@/utils/barcodeScanner';
import { printReceipt } from '@/utils/receiptPrinter';
import { openPdfWithOptions } from '@/utils/printOptions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

const POSInterface = () => {
  const { tenantId, currentUser } = useTenant();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { autoPrint } = useRegionalSettings();
  const { settings: globalSettings, getPharmacyInfo } = useGlobalSystemSettings();
  const { formatAmount } = useCurrencyFormatting();
  const { settings: salesSettings, loading: settingsLoading } = useSalesSettings();
  
  // Paramètre de séparation Vente/Caisse
  const separateSaleAndCash = salesSettings.general.separateSaleAndCash;
  
  // Vérification permission encaissement et vente
  const { canAccess } = useDynamicPermissions();
  const canCashier = canAccess('sales.cashier');
  const canCreateSale = canAccess('sales.create');

  // Bloquer l'accès si pas de permission de créer des ventes
  if (!canCreateSale) {
    return (
      <Card className="m-4">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold">Accès refusé</h3>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour utiliser le Point de Vente.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Hook principal POS (version optimisée sans fetch massif)
  const { 
    searchByBarcode,
    saveTransaction,
    checkStock
  } = usePOSData();
  
  // Session caisse
  const { 
    activeSession, 
    hasActiveSession, 
    isLoading: sessionLoading 
  } = useCashSession();

  // Hooks avancés
  const { calculatePoints, addPoints } = useLoyaltyProgram();
  const { recordTransaction } = usePOSAnalytics();

  // États locaux - Définir l'onglet par défaut selon le mode
  const [activeTab, setActiveTab] = useState(() => 
    separateSaleAndCash ? 'vente-seule' : 'vente'
  );
  
  // Synchroniser l'onglet actif quand le mode change
  useEffect(() => {
    if (separateSaleAndCash && activeTab === 'vente') {
      setActiveTab('vente-seule');
    } else if (!separateSaleAndCash && (activeTab === 'vente-seule' || activeTab === 'encaissement')) {
      setActiveTab('vente');
    }
  }, [separateSaleAndCash]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>({ type: 'Ordinaire', discount_rate: 0 });
  const [showPayment, setShowPayment] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loyaltyRewardApplied, setLoyaltyRewardApplied] = useState<{ id: string; discount: number } | null>(null);
  const [priceEditProductId, setPriceEditProductId] = useState<number | null>(null);
  // Vérifier session caisse au montage (seulement en mode non-séparé)
  useEffect(() => {
    if (!sessionLoading && !hasActiveSession && !separateSaleAndCash) {
      toast({
        title: t('cashSessionClosed'),
        description: t('pleaseOpenSession'),
        variant: "destructive"
      });
    }
  }, [sessionLoading, hasActiveSession, separateSaleAndCash, toast, t]);

  // Ajouter un produit au panier avec vérification stock
  const addToCart = useCallback(async (product: any, quantity: number = 1) => {
    // Vérifier stock disponible
    const hasStock = await checkStock(product.id, quantity);
    if (!hasStock) {
      toast({
        title: t('stockInsufficient'),
        description: `${t('stockAvailable')}: ${product.stock}`,
        variant: "destructive"
      });
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        
        if (newQty > product.stock) {
          toast({
            title: t('maxQuantityReached'),
            description: `${t('stockAvailable')}: ${product.stock}`,
            variant: "destructive"
          });
          return prev;
        }
        
        return prev.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                total: newQty * item.unitPrice
              }
            : item
        );
      }
      
      return [...prev, {
        product,
        quantity,
        unitPrice: product.price,
        total: product.price * quantity
      }];
    });
    
    toast({
      title: t('posProductAdded'),
      description: `${product.name} x${quantity}`,
    });
  }, [checkStock, toast, t]);

  // Scanner de codes-barres clavier (recherche serveur-side)
  useEffect(() => {
    const cleanup = setupBarcodeScanner(async (barcode) => {
      // Rechercher le produit via RPC serveur
      const product = await searchByBarcode(barcode);
      if (product) {
        addToCart(product);
        toast({
          title: t('productScanned'),
          description: product.name
        });
      } else {
        toast({
          title: t('productNotFound'),
          description: barcode,
          variant: "destructive"
        });
      }
    }, {
      minLength: 8,
      maxLength: 20,
      timeout: 100
    });

    return cleanup;
  }, [searchByBarcode, addToCart, toast, t]);

  const updateCartItem = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    
    // Vérifier le stock disponible
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    
    const maxStock = item.product.stock;
    if (quantity > maxStock) {
      toast({
        title: t('stockInsufficient'),
        description: `${t('stockAvailable')}: ${maxStock}`,
        variant: "destructive"
      });
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              total: quantity * item.unitPrice
            }
          : item
      )
    );
  }, [cart, toast, t]);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const calculateSubtotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.total, 0);
  }, [cart]);

  // Calculer le total HT
  const calculateTotalHT = useCallback(() => {
    return cart.reduce((total, item) => {
      const priceHT = item.product.prix_vente_ht || item.product.price_ht || 0;
      return total + (priceHT * item.quantity);
    }, 0);
  }, [cart]);

  // Calculer le montant total TVA
  const calculateTotalTVA = useCallback(() => {
    return cart.reduce((total, item) => {
      const tvaMontant = item.product.tva_montant || 0;
      return total + (tvaMontant * item.quantity);
    }, 0);
  }, [cart]);

  // Calculer le montant total Centime Additionnel
  const calculateTotalCentime = useCallback(() => {
    return cart.reduce((total, item) => {
      const centimeMontant = item.product.centime_additionnel_montant || 0;
      return total + (centimeMontant * item.quantity);
    }, 0);
  }, [cart]);

  // Utiliser le hook de calcul centralisé
  const calculations = usePOSCalculations(cart, customer);

  // Vérifier la dette du client
  const { totalDette } = useClientDebt(customer.id, customer.limite_credit ?? 0);
  const { canAddDebt } = useCanAddDebt(customer.id, customer.limite_credit ?? 0, 0);

  const calculateDiscount = useCallback(() => {
    // Utiliser le montant de remise calculé par le hook
    return calculations.montantRemise;
  }, [calculations.montantRemise]);

  const calculateTotal = useCallback(() => {
    // Utiliser le total à payer calculé par le hook
    return calculations.totalAPayer;
  }, [calculations.totalAPayer]);

  const handleProcessPayment = useCallback(() => {
    if (cart.length === 0) return;
    
    setCurrentTransaction({
      items: cart,
      customer,
      subtotal: calculateSubtotal(),
      discount: calculateDiscount(),
      total: calculateTotal(),
      timestamp: new Date()
    });
    
    setShowPayment(true);
  }, [cart, customer, calculateSubtotal, calculateDiscount, calculateTotal]);

  const handleProcessSplitPayment = useCallback(() => {
    if (cart.length === 0) return;
    
    setCurrentTransaction({
      items: cart,
      customer,
      subtotal: calculateSubtotal(),
      discount: calculateDiscount(),
      total: calculateTotal(),
      timestamp: new Date()
    });
    
    setShowSplitPayment(true);
  }, [cart, customer, calculateSubtotal, calculateDiscount, calculateTotal]);

  // Finaliser le paiement avec sauvegarde
  const handlePaymentComplete = useCallback(async (paymentData: any) => {
    if (!hasActiveSession || !activeSession) {
      toast({
        title: "Erreur",
        description: "Aucune session de caisse active",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const transactionData: TransactionData = {
        cart: cart.map(item => ({
          ...item,
          lot: item.product.lots?.[0]
        } as CartItemWithLot)),
        customer: {
          id: customer.id,
          type: customer.type,
          name: customer.name,
          phone: customer.phone,
          assureur_id: customer.assureur_id,
          assureur_libelle: customer.assureur_libelle,
          taux_remise_automatique: customer.taux_remise_automatique,
          taux_agent: customer.taux_agent,
          taux_ayant_droit: customer.taux_ayant_droit,
          limite_credit: customer.limite_credit,
          peut_prendre_bon: customer.peut_prendre_bon,
          taux_ticket_moderateur: customer.taux_ticket_moderateur,
          caution: customer.caution,
          utiliser_caution: customer.utiliser_caution,
          societe_id: customer.societe_id,
          personnel_id: customer.personnel_id,
          insurance: customer.insurance,
          discount_rate: customer.discount_rate ?? customer.taux_remise_automatique ?? 0
        },
        payment: {
          method: paymentData.method === 'cash' ? 'Espèces' : 
                  paymentData.method === 'card' ? 'Carte' :
                  paymentData.method === 'mobile' ? 'Mobile Money' :
                  paymentData.method === 'caution' ? 'Espèces' : // Caution = considéré comme espèces déjà payées
                  paymentData.method === 'insurance' ? 'Assurance' : 'Assurance',
          amount_received: paymentData.amountReceived,
          change: paymentData.change,
          reference: paymentData.method === 'caution' ? 'PAIEMENT_PAR_CAUTION' : paymentData.reference
        },
        session_caisse_id: activeSession.id,
        caisse_id: activeSession.caisse_id,
        agent_id: currentUser?.id || ''
      };

      const result = await saveTransaction(transactionData);

      if (result.success) {
        // Si paiement par caution, débiter la caution du client
        if (paymentData.method === 'caution' && customer.id) {
          try {
            const montantCaution = paymentData.calculations?.montantCautionUtilisee || calculateTotal();
            const nouvelleCaution = Math.max(0, (customer.caution ?? 0) - montantCaution);
            
            await supabase
              .from('clients')
              .update({ caution: nouvelleCaution })
              .eq('id', customer.id);
            
            toast({
              title: "Caution débitée",
              description: `${formatAmount(montantCaution)} débité de la caution du client`,
            });
          } catch (cautionError) {
            console.error('Erreur débit caution:', cautionError);
            toast({
              title: "Attention",
              description: "Vente enregistrée mais erreur lors du débit de la caution",
              variant: "destructive"
            });
          }
        }

        // Enregistrer points fidélité si client a un ID
        if (customer.id && customer.type !== 'Ordinaire') {
          const pointsGagnes = calculatePoints(calculateTotal());
          try {
            await addPoints({
              clientId: customer.id,
              points: pointsGagnes,
              reason: `Achat - Facture ${result.numero_facture}`,
              agentId: currentUser?.id,
              referenceId: result.vente_id
            });
          } catch (error) {
            console.error('Erreur ajout points:', error);
          }
        }

        // Enregistrer analytiques POS
        if (activeSession) {
          try {
            await recordTransaction({
              caisse_id: activeSession.caisse_id,
              agent_id: currentUser?.id || '',
              montant: calculateTotal(),
              mode_paiement: paymentData.method === 'cash' ? 'especes' : 
                            paymentData.method === 'card' ? 'carte' :
                            paymentData.method === 'mobile' ? 'mobile' : 
                            paymentData.method === 'caution' ? 'especes' : 'assurance',
              nombre_articles: cart.reduce((sum, item) => sum + item.quantity, 0),
              client_fidelite: !!customer.id,
              points_distribues: customer.id ? calculatePoints(calculateTotal()) : 0
            });
          } catch (error) {
            console.error('Erreur analytiques:', error);
          }
        }

        toast({
          title: "Vente enregistrée",
          description: `Facture N° ${result.numero_facture}`,
        });

        // Impression automatique du reçu (utiliser le choix du PaymentModal)
        if (paymentData.autoPrint) {
          try {
            // Récupérer les détails de la vente pour l'impression
            const { data: venteDetails, error: venteError } = await supabase
              .from('ventes')
              .select(`
                *,
                lignes_ventes!lignes_ventes_vente_id_fkey(
                  *,
                  produit:produits!lignes_ventes_produit_id_fkey(libelle_produit),
                  lot:lots!lignes_ventes_lot_id_fkey(numero_lot, date_peremption)
                )
              `)
              .eq('id', result.vente_id)
              .single();

            if (!venteError && venteDetails) {
              // Récupérer infos pharmacie depuis les paramètres système
              const pharmacyInfo = getPharmacyInfo();

              // Préparer les données du reçu avec informations de lot
              const receiptData = {
                vente: {
                  numero_vente: venteDetails.numero_vente,
                  date_vente: venteDetails.date_vente,
                  montant_total_ht: calculateTotalHT(),
                  montant_tva: calculateTotalTVA(),
                  montant_centime_additionnel: calculateTotalCentime(),
                  montant_total_ttc: venteDetails.montant_total_ttc,
                  montant_net: venteDetails.montant_net,
                  remise_globale: venteDetails.remise_globale,
                  montant_paye: venteDetails.montant_paye,
                  montant_rendu: venteDetails.montant_rendu,
                  mode_paiement: venteDetails.mode_paiement,
                },
                // Mapper les lignes avec informations de lot pour traçabilité
                lignes: (venteDetails.lignes_ventes || []).map((ligne: any) => ({
                  ...ligne,
                  numero_lot: ligne.numero_lot || ligne.lot?.numero_lot,
                  date_peremption: ligne.date_peremption || ligne.lot?.date_peremption
                })),
                pharmacyInfo: {
                  name: pharmacyInfo.name,
                  adresse: pharmacyInfo.address,
                  telephone: pharmacyInfo.telephone_appel || pharmacyInfo.telephone_whatsapp,
                },
                agentName: currentUser?.prenoms && currentUser?.noms 
                  ? `${currentUser.prenoms} ${currentUser.noms}` 
                  : 'Agent'
              };

              // Imprimer le reçu avec les options de configuration
              const printOptions = {
                autoprint: salesSettings.printing.autoprint,
                receiptFooter: salesSettings.printing.receiptFooter,
                printLogo: salesSettings.printing.printLogo,
                includeBarcode: salesSettings.printing.includeBarcode,
                paperSize: salesSettings.printing.paperSize,
              };
              const pdfUrl = await printReceipt(receiptData, printOptions);
              openPdfWithOptions(pdfUrl, printOptions);

              toast({
                title: "Reçu généré",
                description: "Le reçu a été envoyé à l'imprimante",
              });
            }
          } catch (printError) {
            console.error('Erreur impression reçu:', printError);
            toast({
              title: "Avertissement",
              description: "Vente enregistrée mais impossible d'imprimer le reçu",
              variant: "default"
            });
          }
        }

        clearCart();
        setCustomer({ type: 'Ordinaire', discount_rate: 0 });
        setLoyaltyRewardApplied(null);
        setShowPayment(false);
        setShowSplitPayment(false);
        setCurrentTransaction(null);
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Erreur transaction:', error);
      toast({
        title: "Erreur de transaction",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    cart, 
    customer, 
    activeSession, 
    hasActiveSession, 
    currentUser, 
    saveTransaction, 
    toast
  ]);

  // Alerte si pas de session (seulement en mode non-séparé, car SalesOnlyInterface gère sa propre logique)
  if (!sessionLoading && !hasActiveSession && !separateSaleAndCash) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center gap-2 justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('cashSessionClosed')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('pleaseOpenSession')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('contactManager')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chargement initial
  if (sessionLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">{t('loadingPos')}</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
      <TabsList className={`grid w-full mb-4 ${separateSaleAndCash ? 'grid-cols-6' : 'grid-cols-5'}`}>
        {!separateSaleAndCash ? (
          <TabsTrigger value="vente">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t('saleTab')}
          </TabsTrigger>
        ) : (
          <>
            <TabsTrigger value="vente-seule">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t('saleOnlyTab')}
            </TabsTrigger>
            {canCashier && (
              <TabsTrigger value="encaissement">
                <Banknote className="h-4 w-4 mr-2" />
                {t('cashierTab')}
              </TabsTrigger>
            )}
          </>
        )}
        <TabsTrigger value="retours">
          <PackageX className="h-4 w-4 mr-2" />
          {t('returnsTab')}
        </TabsTrigger>
        <TabsTrigger value="fidelite">
          <Gift className="h-4 w-4 mr-2" />
          {t('loyaltyTab')}
        </TabsTrigger>
        <TabsTrigger value="ordonnances">
          <FileText className="h-4 w-4 mr-2" />
          {t('prescriptionsTab')}
        </TabsTrigger>
        <TabsTrigger value="analytiques">
          <TrendingUp className="h-4 w-4 mr-2" />
          {t('analyticsTab')}
        </TabsTrigger>
      </TabsList>

      {/* Mode Séparé - Vente seule */}
      {separateSaleAndCash && (
        <TabsContent value="vente-seule" className="h-full">
          <SalesOnlyInterface />
        </TabsContent>
      )}

      {/* Mode Séparé - Encaissement */}
      {separateSaleAndCash && (
        <TabsContent value="encaissement" className="h-full">
          <CashRegisterInterface />
        </TabsContent>
      )}

      {/* Mode Unifié - Vente classique */}
      {!separateSaleAndCash && (
      <TabsContent value="vente" className="h-full">
        <div className="h-full flex flex-col lg:flex-row gap-6">
          {/* Section Gauche - Recherche Produits */}
          <div className="flex-1 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Recherche de Produits
                  </CardTitle>
                  <POSBarcodeActions 
                    onBarcodeScanned={async (barcode) => {
                      const product = await searchByBarcode(barcode);
                      if (product) {
                        addToCart(product);
                        toast({
                          title: "Produit scanné",
                          description: product.name
                        });
                      } else {
                        toast({
                          title: "Produit non trouvé",
                          description: barcode,
                          variant: "destructive"
                        });
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ProductSearch 
                  onAddToCart={addToCart}
                />
              </CardContent>
            </Card>
          </div>

      {/* Section Droite - Panier & Client */}
      <div className="w-full lg:w-96 space-y-6">
        {/* Sélection Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client
              {activeSession && (
                <Badge variant="outline" className="ml-auto text-xs">
                  Session: {activeSession.numero_session}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSelection 
              customer={customer}
              onCustomerChange={setCustomer}
            />
          </CardContent>
        </Card>

        {/* Panier */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Panier
              </div>
              <Badge variant="secondary">
                {cart.reduce((total, item) => total + item.quantity, 0)} articles
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ShoppingCartComponent
              cart={cart}
              onUpdateQuantity={updateCartItem}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              allowPriceEdit={salesSettings.general.allowPriceEditAtSale}
              onEditPrice={(productId) => setPriceEditProductId(productId)}
            />
            
            <Separator />
            
            {/* Totaux avec calculs avancés */}
            <div className="space-y-2">
              {/* Total HT */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total HT:</span>
                <span>{formatAmount(calculations.totalHT)}</span>
              </div>
              
              {/* TVA - afficher seulement si > 0 */}
              {calculations.montantTVA > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>TVA:</span>
                  <span>{formatAmount(calculations.montantTVA)}</span>
                </div>
              )}
              
              {/* Centime Additionnel - afficher seulement si > 0 */}
              {calculations.montantCentime > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Centime Add.:</span>
                  <span>{formatAmount(calculations.montantCentime)}</span>
                </div>
              )}
              
              <Separator className="my-1" />
              
              {/* Sous-total TTC */}
              <div className="flex justify-between text-sm font-medium">
                <span>Sous-total TTC:</span>
                <span>{formatAmount(calculations.sousTotalTTC)}</span>
              </div>
              
              {/* Couverture Assurance */}
              {calculations.estAssure && calculations.partAssurance > 0 && (
                <>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Couverture Assurance ({calculations.tauxCouverture}%):
                    </span>
                    <span>-{formatAmount(calculations.partAssurance)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Part Client:</span>
                    <span>{formatAmount(calculations.partClient)}</span>
                  </div>
                </>
              )}
              
              {/* Ticket Modérateur (si non assuré) */}
              {!calculations.estAssure && calculations.montantTicketModerateur > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Ticket modérateur ({calculations.tauxTicketModerateur}%):</span>
                  <span>-{formatAmount(calculations.montantTicketModerateur)}</span>
                </div>
              )}
              
              {/* Remise automatique */}
              {calculations.montantRemise > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise ({calculations.tauxRemise}%):</span>
                  <span>-{formatAmount(calculations.montantRemise)}</span>
                </div>
              )}
              
              <Separator className="my-1" />
              
              {/* Total à payer */}
              <div className="flex justify-between font-bold text-lg">
                <span>Total à payer:</span>
                <span className="text-primary">{formatAmount(calculations.totalAPayer)}</span>
              </div>
            </div>
            
            {/* Boutons Paiement */}
            <div className="space-y-2">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleProcessPayment}
                disabled={cart.length === 0 || isSaving || !hasActiveSession}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {isSaving ? 'Enregistrement...' : 'Paiement Simple'}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="w-full"
                onClick={handleProcessSplitPayment}
                disabled={cart.length === 0 || isSaving || !hasActiveSession}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Paiement Fractionné
              </Button>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowPrescriptionModal(true)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Ordonnance
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowExpenseModal(true)}
                    disabled={!hasActiveSession}
                  >
                    <Receipt className="h-4 w-4 mr-1" />
                    Dépense
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowReturnModal(true)}
                  >
                    <PackageX className="h-4 w-4 mr-1" />
                    Retour
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDemandModal(true)}
                  >
                    <ClipboardList className="h-4 w-4 mr-1" />
                    Produit Demandé
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showPayment && currentTransaction && (
        <PaymentModal
          transaction={currentTransaction}
          onPaymentComplete={handlePaymentComplete}
          onClose={() => setShowPayment(false)}
          isSaving={isSaving}
        />
      )}

      {showSplitPayment && currentTransaction && (
        <SplitPaymentDialog
          open={showSplitPayment}
          onOpenChange={setShowSplitPayment}
          totalAmount={currentTransaction.total}
          cartItems={cart}
          customer={customer}
          onPaymentComplete={(payments) => {
            handlePaymentComplete({ 
              method: 'split',
              payments,
              amountReceived: currentTransaction.total,
              change: 0
            });
          }}
        />
      )}
        </div>
      </TabsContent>
      )}

      <TabsContent value="retours">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Retours et Échanges</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowReturnModal(true)}>
              <PackageX className="h-4 w-4 mr-2" />
              Nouveau Retour
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="fidelite">
        <LoyaltyPanel 
          clientId={customer.id || null}
          onClientSelect={(clientId) => {
            // Optionnel : synchroniser avec l'onglet vente
            console.log('Client sélectionné:', clientId);
          }}
          onApplyReward={(rewardId, discount) => {
            setLoyaltyRewardApplied({ id: rewardId, discount });
            toast({
              title: 'Récompense appliquée',
              description: `Réduction de ${formatAmount(discount)} appliquée`
            });
          }}
        />
      </TabsContent>

      <TabsContent value="ordonnances">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Ordonnances</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowPrescriptionModal(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Enregistrer une Ordonnance
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytiques">
        <POSAnalyticsDashboard />
      </TabsContent>

      {/* Modals globaux */}
      <ReturnExchangeModal
        open={showReturnModal}
        onOpenChange={setShowReturnModal}
      />

      <PrescriptionModal
        open={showPrescriptionModal}
        onOpenChange={setShowPrescriptionModal}
        onPrescriptionSaved={(id) => {
          toast({
            title: 'Ordonnance enregistrée',
            description: `ID: ${id}`
          });
        }}
      />

      {hasActiveSession && activeSession && (
        <CashExpenseModal
          open={showExpenseModal}
          onOpenChange={setShowExpenseModal}
          sessionId={activeSession.id}
          currentBalance={activeSession.fond_caisse_ouverture + (activeSession.montant_total_ventes || 0)}
          onExpenseRecorded={() => {
            toast({
              title: 'Dépense enregistrée',
              description: 'Le mouvement de caisse et l\'écriture comptable ont été créés'
            });
          }}
        />
      )}

      <ProductDemandModal
        open={showDemandModal}
        onOpenChange={setShowDemandModal}
      />

      <PriceEditDialog
        open={priceEditProductId !== null}
        onOpenChange={(open) => { if (!open) setPriceEditProductId(null); }}
        cartItem={cart.find(item => item.product.id === priceEditProductId) || null}
        onPriceUpdated={(productId, newUnitPrice, newHT) => {
          setCart(prev => prev.map(item =>
            item.product.id === productId
              ? { ...item, unitPrice: newUnitPrice, total: newUnitPrice * item.quantity, product: { ...item.product, prix_vente_ht: newHT, price_ht: newHT, prix_vente_ttc: newUnitPrice, price: newUnitPrice } }
              : item
          ));
        }}
      />
    </Tabs>
  );
};

export default POSInterface;

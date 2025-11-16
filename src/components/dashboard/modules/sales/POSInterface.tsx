import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, User, CreditCard, AlertCircle, Search, Gift, PackageX, FileText, TrendingUp } from 'lucide-react';
import ProductSearch from './pos/ProductSearch';
import ShoppingCartComponent from './pos/ShoppingCartComponent';
import CustomerSelection from './pos/CustomerSelection';
import PaymentModal from './pos/PaymentModal';
import { ReturnExchangeModal } from '../pos/ReturnExchangeModal';
import { LoyaltyPanel } from '../pos/LoyaltyPanel';
import { PrescriptionModal } from '../pos/PrescriptionModal';
import { SplitPaymentDialog } from '../pos/SplitPaymentDialog';
import { POSAnalyticsDashboard } from '../pos/POSAnalyticsDashboard';
import POSBarcodeActions from './pos/POSBarcodeActions';
import { usePOSData } from '@/hooks/usePOSData';
import { useCashSession } from '@/hooks/useCashSession';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { usePOSAnalytics } from '@/hooks/usePOSAnalytics';
import { useRegionalSettings } from '@/hooks/useRegionalSettings';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionData, CartItemWithLot } from '@/types/pos';
import { setupBarcodeScanner } from '@/utils/barcodeScanner';
import { printReceipt } from '@/utils/receiptPrinter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface Customer {
  id?: string;
  type: 'ordinaire' | 'assure' | 'particulier';
  name?: string;
  phone?: string;
  insuranceNumber?: string;
  insuranceCompany?: string;
  discountRate?: number;
}

const POSInterface = () => {
  const { tenantId, currentUser } = useTenant();
  const { toast } = useToast();
  const { currency, autoPrint } = useRegionalSettings();
  const { settings, getPharmacyInfo } = useGlobalSystemSettings();
  
  // Hook principal POS
  const { 
    products, 
    isLoading: productsLoading, 
    saveTransaction,
    checkStock,
    refreshProducts
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

  // États locaux
  const [activeTab, setActiveTab] = useState('vente');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ type: 'ordinaire' });
  const [showPayment, setShowPayment] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loyaltyRewardApplied, setLoyaltyRewardApplied] = useState<{ id: string; discount: number } | null>(null);

  // Vérifier session caisse au montage
  useEffect(() => {
    if (!sessionLoading && !hasActiveSession) {
      toast({
        title: "Session Caisse Fermée",
        description: "Veuillez ouvrir une session de caisse pour effectuer des ventes.",
        variant: "destructive"
      });
    }
  }, [sessionLoading, hasActiveSession, toast]);

  // Ajouter un produit au panier avec vérification stock
  const addToCart = useCallback(async (product: any, quantity: number = 1) => {
    // Vérifier stock disponible
    const hasStock = await checkStock(product.id, quantity);
    if (!hasStock) {
      toast({
        title: "Stock insuffisant",
        description: `Seulement ${product.stock} unités disponibles`,
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
            title: "Quantité maximale atteinte",
            description: `Stock disponible: ${product.stock}`,
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
      title: "Produit ajouté",
      description: `${product.name} x${quantity}`,
    });
  }, [checkStock, toast]);

  // Scanner de codes-barres clavier
  useEffect(() => {
    const cleanup = setupBarcodeScanner((barcode) => {
      // Rechercher le produit par code CIP
      const product = products.find(
        p => p.code_cip === barcode || p.id === barcode
      );
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
    }, {
      minLength: 8,
      maxLength: 20,
      timeout: 100
    });

    return cleanup;
  }, [products, addToCart, toast]);

  const updateCartItem = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
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
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const calculateSubtotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.total, 0);
  }, [cart]);

  const calculateDiscount = useCallback(() => {
    const subtotal = calculateSubtotal();
    let discount = customer.discountRate ? (subtotal * customer.discountRate) / 100 : 0;
    
    // Ajouter réduction fidélité si appliquée
    if (loyaltyRewardApplied) {
      discount += loyaltyRewardApplied.discount;
    }
    
    return discount;
  }, [calculateSubtotal, customer.discountRate, loyaltyRewardApplied]);

  const calculateTotal = useCallback(() => {
    return calculateSubtotal() - calculateDiscount();
  }, [calculateSubtotal, calculateDiscount]);

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
          insurance: customer.type === 'assure' ? {
            company: customer.insuranceCompany!,
            number: customer.insuranceNumber!,
            coverage_rate: 70
          } : undefined,
          discount_rate: customer.discountRate || 0
        },
        payment: {
          method: paymentData.method === 'cash' ? 'Espèces' : 
                  paymentData.method === 'card' ? 'Carte' :
                  paymentData.method === 'mobile' ? 'Mobile Money' : 'Assurance',
          amount_received: paymentData.amountReceived,
          change: paymentData.change,
          reference: paymentData.reference
        },
        session_caisse_id: activeSession.id,
        caisse_id: activeSession.caisse_id,
        agent_id: currentUser?.id || ''
      };

      const result = await saveTransaction(transactionData);

      if (result.success) {
        // Enregistrer points fidélité si client a un ID
        if (customer.id && customer.type !== 'ordinaire') {
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
                            paymentData.method === 'mobile' ? 'mobile' : 'assurance',
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

        // Impression automatique du reçu
        if (autoPrint) {
          try {
            // Récupérer les détails de la vente pour l'impression
            const { data: venteDetails, error: venteError } = await supabase
              .from('ventes')
              .select(`
                *,
                lignes_ventes!lignes_ventes_vente_id_fkey(
                  *,
                  produit:produits!lignes_ventes_produit_id_fkey(libelle_produit)
                )
              `)
              .eq('id', result.vente_id)
              .single();

            if (!venteError && venteDetails) {
              // Récupérer infos pharmacie depuis les paramètres système
              const pharmacyInfo = getPharmacyInfo();

              // Préparer les données du reçu
              const receiptData = {
                vente: {
                  numero_vente: venteDetails.numero_vente,
                  date_vente: venteDetails.date_vente,
                  montant_total_ttc: venteDetails.montant_total_ttc,
                  montant_net: venteDetails.montant_net,
                  remise_globale: venteDetails.remise_globale,
                  montant_paye: venteDetails.montant_paye,
                  montant_rendu: venteDetails.montant_rendu,
                  mode_paiement: venteDetails.mode_paiement,
                },
                lignes: venteDetails.lignes_ventes || [],
                pharmacyInfo: {
                  name: pharmacyInfo.name,
                  adresse: pharmacyInfo.address,
                  telephone: pharmacyInfo.telephone_appel || pharmacyInfo.telephone_whatsapp,
                },
                agentName: currentUser?.prenoms && currentUser?.noms 
                  ? `${currentUser.prenoms} ${currentUser.noms}` 
                  : 'Agent'
              };

              // Imprimer le reçu
              const pdfUrl = await printReceipt(receiptData);
              
              // Ouvrir le reçu dans une nouvelle fenêtre pour impression
              const printWindow = window.open(pdfUrl, '_blank');
              if (printWindow) {
                printWindow.onload = () => {
                  printWindow.print();
                };
              }

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

        await refreshProducts();
        clearCart();
        setCustomer({ type: 'ordinaire' });
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
    refreshProducts,
    toast
  ]);

  // Alerte si pas de session
  if (!sessionLoading && !hasActiveSession) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center gap-2 justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Session Caisse Fermée
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Vous devez ouvrir une session de caisse pour effectuer des ventes.
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez contacter votre responsable pour ouvrir une session.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chargement initial
  if (productsLoading || sessionLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Chargement du point de vente...</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="vente">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Vente
        </TabsTrigger>
        <TabsTrigger value="retours">
          <PackageX className="h-4 w-4 mr-2" />
          Retours
        </TabsTrigger>
        <TabsTrigger value="fidelite">
          <Gift className="h-4 w-4 mr-2" />
          Fidélité
        </TabsTrigger>
        <TabsTrigger value="ordonnances">
          <FileText className="h-4 w-4 mr-2" />
          Ordonnances
        </TabsTrigger>
        <TabsTrigger value="analytiques">
          <TrendingUp className="h-4 w-4 mr-2" />
          Analytiques
        </TabsTrigger>
      </TabsList>

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
                    products={products}
                    onProductScanned={addToCart}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ProductSearch 
                  products={products}
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
            />
            
            <Separator />
            
            {/* Totaux */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total:</span>
                <span>{calculateSubtotal().toLocaleString()} {currency}</span>
              </div>
              
              {calculateDiscount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise ({customer.discountRate}%):</span>
                  <span>-{calculateDiscount().toLocaleString()} {currency}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">{calculateTotal().toLocaleString()} {currency}</span>
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
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowReturnModal(true)}
                >
                  <PackageX className="h-4 w-4 mr-1" />
                  Retour
                </Button>
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
              description: `Réduction de ${discount} FCFA appliquée`
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
    </Tabs>
  );
};

export default POSInterface;

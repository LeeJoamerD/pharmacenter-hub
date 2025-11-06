import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User, CreditCard, AlertCircle, Search } from 'lucide-react';
import ProductSearch from './pos/ProductSearch';
import ShoppingCartComponent from './pos/ShoppingCartComponent';
import CustomerSelection from './pos/CustomerSelection';
import PaymentModal from './pos/PaymentModal';
import { usePOSData } from '@/hooks/usePOSData';
import { useCashSession } from '@/hooks/useCashSession';
import { useRegionalSettings } from '@/hooks/useRegionalSettings';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionData, CartItemWithLot } from '@/types/pos';

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
  const { currency } = useRegionalSettings();
  
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

  // États locaux
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ type: 'ordinaire' });
  const [showPayment, setShowPayment] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    return customer.discountRate ? (subtotal * customer.discountRate) / 100 : 0;
  }, [calculateSubtotal, customer.discountRate]);

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
        agent_id: currentUser?.id || ''
      };

      const result = await saveTransaction(transactionData);

      if (result.success) {
        toast({
          title: "Vente enregistrée",
          description: `Facture N° ${result.numero_facture}`,
        });

        await refreshProducts();
        clearCart();
        setCustomer({ type: 'ordinaire' });
        setShowPayment(false);
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
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Section Gauche - Recherche Produits */}
      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recherche de Produits
            </CardTitle>
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
            
            {/* Bouton Paiement */}
            <Button 
              size="lg" 
              className="w-full"
              onClick={handleProcessPayment}
              disabled={cart.length === 0 || isSaving || !hasActiveSession}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              {isSaving ? 'Enregistrement...' : 'Procéder au Paiement'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Paiement */}
      {showPayment && currentTransaction && (
        <PaymentModal
          transaction={currentTransaction}
          onPaymentComplete={handlePaymentComplete}
          onClose={() => setShowPayment(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default POSInterface;

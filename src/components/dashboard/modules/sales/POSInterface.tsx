import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Search, 
  User, 
  Receipt, 
  CreditCard, 
  Smartphone,
  DollarSign,
  Package,
  Plus,
  Minus,
  Trash2,
  Calculator
} from 'lucide-react';
import ProductSearch from './pos/ProductSearch';
import ShoppingCartComponent from './pos/ShoppingCartComponent';
import PaymentModal from './pos/PaymentModal';
import CustomerSelection from './pos/CustomerSelection';

export interface POSProduct {
  id: number;
  name: string;
  dci: string;
  price: number;
  stock: number;
  barcode?: string;
  category: string;
  requiresPrescription: boolean;
}

export interface CartItem {
  product: POSProduct;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface Customer {
  type: 'ordinaire' | 'assure' | 'particulier';
  name?: string;
  insuranceNumber?: string;
  insuranceCompany?: string;
  discountRate?: number;
}

const POSInterface = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ type: 'ordinaire' });
  const [showPayment, setShowPayment] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);

  // Mock products data
  const mockProducts: POSProduct[] = [
    {
      id: 1,
      name: 'Paracétamol 500mg',
      dci: 'Paracétamol',
      price: 500,
      stock: 150,
      barcode: '123456789',
      category: 'Antalgique',
      requiresPrescription: false
    },
    {
      id: 2,
      name: 'Amoxicilline 250mg',
      dci: 'Amoxicilline',
      price: 2500,
      stock: 80,
      category: 'Antibiotique',
      requiresPrescription: true
    },
    {
      id: 3,
      name: 'Ibuprofène 400mg',
      dci: 'Ibuprofène',
      price: 750,
      stock: 200,
      category: 'Anti-inflammatoire',
      requiresPrescription: false
    }
  ];

  const addToCart = useCallback((product: POSProduct, quantity: number = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.unitPrice
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
  }, []);

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

  const handlePaymentComplete = useCallback((paymentData: any) => {
    // Process payment and clear cart
    console.log('Transaction completed:', { ...currentTransaction, payment: paymentData });
    
    // Clear cart and reset
    clearCart();
    setCustomer({ type: 'ordinaire' });
    setShowPayment(false);
    setCurrentTransaction(null);
    
    // In a real app, this would save to database and print receipt
  }, [currentTransaction, clearCart]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left Panel - Product Search & Selection */}
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
              products={mockProducts} 
              onAddToCart={addToCart}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Cart & Customer */}
      <div className="w-full lg:w-96 space-y-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSelection 
              customer={customer}
              onCustomerChange={setCustomer}
            />
          </CardContent>
        </Card>

        {/* Shopping Cart */}
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
            
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total:</span>
                <span>{calculateSubtotal().toLocaleString()} FCFA</span>
              </div>
              
              {calculateDiscount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise ({customer.discountRate}%):</span>
                  <span>-{calculateDiscount().toLocaleString()} FCFA</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{calculateTotal().toLocaleString()} FCFA</span>
              </div>
            </div>
            
            {/* Payment Button */}
            <Button 
              onClick={handleProcessPayment}
              disabled={cart.length === 0}
              className="w-full"
              size="lg"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Procéder au Paiement
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPayment && currentTransaction && (
        <PaymentModal
          transaction={currentTransaction}
          onPaymentComplete={handlePaymentComplete}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default POSInterface;
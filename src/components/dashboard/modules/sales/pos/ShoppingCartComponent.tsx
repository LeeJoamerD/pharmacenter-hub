import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem } from '../POSInterface';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface ShoppingCartComponentProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
}

const ShoppingCartComponent = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart 
}: ShoppingCartComponentProps) => {
  const { formatAmount } = useCurrencyFormatting();

  if (cart.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Panier vide</p>
        <p className="text-sm">Ajoutez des produits pour commencer</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clear Cart Button */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Articles dans le panier</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearCart}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Vider
        </Button>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.product.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-sm truncate">
                  {item.product.name}
                </h5>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(item.unitPrice)} / unité
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.product.id)}
                className="text-destructive hover:text-destructive p-1 h-auto"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const quantity = parseInt(e.target.value) || 1;
                    onUpdateQuantity(item.product.id, quantity);
                  }}
                  className="w-16 h-8 text-center"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-right">
                <div className="font-medium text-sm">
                  {formatAmount(item.total)}
                </div>
                {item.discount && (
                  <div className="text-xs text-green-600">
                    Remise: -{formatAmount(item.discount)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Stock Warning */}
            {item.quantity >= item.product.stock && (
              <Badge variant="destructive" className="text-xs">
                Stock insuffisant
              </Badge>
            )}
            
            <Separator />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShoppingCartComponent;
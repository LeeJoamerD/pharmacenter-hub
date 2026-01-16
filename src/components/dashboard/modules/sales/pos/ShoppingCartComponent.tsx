import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingCart, Package, Calendar, AlertTriangle } from 'lucide-react';
import { CartItem } from '../POSInterface';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ShoppingCartComponentProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
}

// Vérifie si un lot expire dans les 30 prochains jours
const isExpiringSoon = (datePeremption: Date | string | undefined): boolean => {
  if (!datePeremption) return false;
  const expirationDate = new Date(datePeremption);
  const warningDate = addDays(new Date(), 30);
  return isBefore(expirationDate, warningDate);
};

// Vérifie si un lot est déjà expiré
const isExpired = (datePeremption: Date | string | undefined): boolean => {
  if (!datePeremption) return false;
  return isBefore(new Date(datePeremption), new Date());
};

const ShoppingCartComponent = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart 
}: ShoppingCartComponentProps) => {
  const { formatAmount } = useCurrencyFormatting();
  const { t } = useLanguage();

  if (cart.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t('emptyCartMessage')}</p>
        <p className="text-sm">{t('addProductsToStart')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clear Cart Button */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{t('cartItemsTitle')}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearCart}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {t('emptyBtn')}
        </Button>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {cart.map((item) => {
          // Récupérer le lot FIFO (premier lot disponible)
          const lot = item.product.lots?.[0];
          const lotExpiringSoon = lot ? isExpiringSoon(lot.date_peremption) : false;
          const lotExpired = lot ? isExpired(lot.date_peremption) : false;

          return (
            <div key={item.product.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-sm truncate">
                    {item.product.name}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    {formatAmount(item.unitPrice)} {t('perUnit')}
                  </p>
                  
                  {/* Affichage du Lot et Date de Péremption */}
                  {lot && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {lot.numero_lot}
                      </Badge>
                      <Badge 
                        variant={lotExpired ? "destructive" : lotExpiringSoon ? "secondary" : "outline"}
                        className={cn(
                          "text-xs",
                          lotExpiringSoon && !lotExpired && "border-orange-500 text-orange-600 bg-orange-50"
                        )}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(lot.date_peremption), 'dd/MM/yyyy', { locale: fr })}
                      </Badge>
                      {lotExpiringSoon && !lotExpired && (
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                  )}
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
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={(e) => {
                      const inputQty = parseInt(e.target.value) || 1;
                      const quantity = Math.min(inputQty, item.product.stock);
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
                      {t('discount')}: -{formatAmount(item.discount)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stock Warning */}
              {item.quantity >= item.product.stock && (
                <Badge variant="destructive" className="text-xs">
                  {t('insufficientStock')}
                </Badge>
              )}
              
              <Separator />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShoppingCartComponent;
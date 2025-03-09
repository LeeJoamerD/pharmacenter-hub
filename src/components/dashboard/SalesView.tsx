
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, CreditCard, Receipt, Tag, Package, Pill, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// Type pour un produit
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

// Type pour un élément dans le panier
interface CartItem {
  product: Product;
  quantity: number;
}

const SalesView = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Produits fictifs pour la démo
  const products: Product[] = [
    { id: 'p1', name: 'Aspirine 500mg', price: 6.99, stock: 42, category: 'Analgésique' },
    { id: 'p2', name: 'Ibuprofène 400mg', price: 5.50, stock: 28, category: 'Anti-inflammatoire' },
    { id: 'p3', name: 'Paracétamol 1g', price: 4.25, stock: 56, category: 'Analgésique' },
    { id: 'p4', name: 'Amoxicilline 500mg', price: 12.80, stock: 15, category: 'Antibiotique' },
    { id: 'p5', name: 'Vitamine C 1000mg', price: 7.95, stock: 33, category: 'Supplément' },
    { id: 'p6', name: 'Doliprane 1000mg', price: 4.50, stock: 48, category: 'Analgésique' }
  ];
  
  // Filtrer les produits selon le terme de recherche
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Ajouter un produit au panier
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Le produit existe déjà, augmenter la quantité
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Nouveau produit à ajouter
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    
    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté au panier`,
    });
  };
  
  // Retirer un produit du panier
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };
  
  // Modifier la quantité d'un produit
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };
  
  // Calculer le total du panier
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };
  
  // Finaliser la vente
  const finalizeSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Erreur",
        description: "Le panier est vide",
        variant: "destructive"
      });
      return;
    }
    
    // Dans une vraie application, on enverrait ces données à une API
    console.log("Vente finalisée :", cart);
    
    toast({
      title: "Vente réussie",
      description: `Total: ${calculateTotal().toFixed(2)}€`,
      variant: "default"
    });
    
    // Vider le panier après la vente
    setCart([]);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panneau de recherche et liste des produits */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('products')}
            </CardTitle>
            <CardDescription>{t('searchProducts')}</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('searchPlaceholder')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('noProductsFound')}</p>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/50 transition-colors">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {product.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold">{product.price.toFixed(2)}€</div>
                        <div className="text-xs text-muted-foreground">
                          {t('inStock')}: {product.stock}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => addToCart(product)}>
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {t('add')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Panier */}
      <div>
        <Card className="sticky top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t('cart')}
            </CardTitle>
            <CardDescription>
              {cart.length === 0 
                ? t('emptyCart') 
                : `${cart.length} ${cart.length > 1 ? t('itemsInCart') : t('itemInCart')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>{t('cartEmpty')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">{item.product.price.toFixed(2)}€</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <span>-</span>
                      </Button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <span>+</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="flex justify-between w-full border-t pt-3">
              <span className="font-semibold">{t('total')}</span>
              <span className="font-bold">{calculateTotal().toFixed(2)}€</span>
            </div>
            <Button className="w-full" disabled={cart.length === 0} onClick={finalizeSale}>
              <CreditCard className="h-4 w-4 mr-2" />
              {t('checkout')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SalesView;

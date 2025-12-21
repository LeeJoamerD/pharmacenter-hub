/**
 * Composant Vente Seule (Mode Séparé)
 * Gère la vente sans l'encaissement
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart, 
  User, 
  Check, 
  AlertCircle, 
  Search, 
  Printer,
  Loader2,
  FileText,
  ClipboardList
} from 'lucide-react';
import { PrescriptionModal } from '../../pos/PrescriptionModal';
import ProductDemandModal from '../../pos/ProductDemandModal';
import ProductSearch from './ProductSearch';
import ShoppingCartComponent from './ShoppingCartComponent';
import CustomerSelection from './CustomerSelection';
import POSBarcodeActions from './POSBarcodeActions';
import { usePOSData } from '@/hooks/usePOSData';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionData, CartItemWithLot } from '@/types/pos';
import { setupBarcodeScanner } from '@/utils/barcodeScanner';
import { printSalesTicket } from '@/utils/salesTicketPrinter';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

interface Customer {
  id?: string;
  type: 'ordinaire' | 'assure' | 'particulier';
  name?: string;
  phone?: string;
  insuranceNumber?: string;
  insuranceCompany?: string;
  discountRate?: number;
}

interface OpenSession {
  id: string;
  numero_session: string;
  date_ouverture: string;
  caisse_id: string;
  caisse?: { nom_caisse: string };
}

const SalesOnlyInterface = () => {
  const { tenantId, currentUser } = useTenant();
  const { toast } = useToast();
  const { getPharmacyInfo } = useGlobalSystemSettings();
  const { formatAmount } = useCurrencyFormatting();
  
  const { searchByBarcode, saveTransaction, checkStock } = usePOSData();

  // États
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ type: 'ordinaire' });
  const [isSaving, setIsSaving] = useState(false);
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  // Charger les sessions ouvertes
  useEffect(() => {
    const loadOpenSessions = async () => {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from('sessions_caisse')
        .select(`
          id,
          numero_session,
          date_ouverture,
          caisse_id,
          caisse:caisses(nom_caisse)
        `)
        .eq('tenant_id', tenantId)
        .eq('statut', 'Ouverte')
        .order('date_ouverture', { ascending: false });

      if (error) {
        console.error('Erreur chargement sessions:', error);
      } else {
        setOpenSessions((data || []) as OpenSession[]);
        // Sélectionner automatiquement la première session
        if (data && data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data[0].id);
        }
      }
      setLoadingSessions(false);
    };

    if (tenantId) {
      loadOpenSessions();
    }
  }, [tenantId]);

  // Scanner de codes-barres
  useEffect(() => {
    const cleanup = setupBarcodeScanner(async (barcode) => {
      const product = await searchByBarcode(barcode);
      if (product) {
        addToCart(product);
        toast({ title: "Produit scanné", description: product.name });
      } else {
        toast({ title: "Produit non trouvé", description: barcode, variant: "destructive" });
      }
    }, { minLength: 8, maxLength: 20, timeout: 100 });
    return cleanup;
  }, [searchByBarcode]);

  const addToCart = useCallback(async (product: any, quantity: number = 1) => {
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
            ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
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
    
    toast({ title: "Produit ajouté", description: `${product.name} x${quantity}` });
  }, [checkStock, toast]);

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
        title: "Stock insuffisant",
        description: `Maximum disponible: ${maxStock} unités`,
        variant: "destructive"
      });
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity, total: quantity * item.unitPrice }
          : item
      )
    );
  }, [cart, toast]);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

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

  // Valider la vente (sans encaissement)
  const handleValidateSale = useCallback(async () => {
    if (cart.length === 0) {
      toast({ title: "Panier vide", variant: "destructive" });
      return;
    }

    if (!selectedSessionId) {
      toast({ title: "Sélectionnez une session de caisse", variant: "destructive" });
      return;
    }

    const selectedSession = openSessions.find(s => s.id === selectedSessionId);
    if (!selectedSession) {
      toast({ title: "Session invalide", variant: "destructive" });
      return;
    }

    // Vérification finale du stock avant validation
    for (const item of cart) {
      const hasStock = await checkStock(item.product.id, item.quantity);
      if (!hasStock) {
        toast({
          title: "Stock insuffisant",
          description: `Stock insuffisant pour "${item.product.name}". Veuillez ajuster la quantité.`,
          variant: "destructive"
        });
        return;
      }
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
          method: 'Espèces', // Sera mis à jour à l'encaissement
          amount_received: 0,
          change: 0
        },
        session_caisse_id: selectedSessionId,
        caisse_id: selectedSession.caisse_id,
        agent_id: currentUser?.id || ''
      };

      // Sauvegarder avec skipPayment = true
      const result = await saveTransaction(transactionData, true);

      if (result.success) {
        toast({
          title: "Vente enregistrée",
          description: `Ticket N° ${result.numero_facture} - En attente d'encaissement`,
        });

        // Impression automatique du ticket
        if (autoPrintTicket) {
          try {
            const pharmacyInfo = getPharmacyInfo();
            const ticketData = {
              vente: {
                numero_vente: result.numero_facture,
                date_vente: new Date().toISOString(),
                montant_total_ttc: calculateSubtotal(),
                montant_net: calculateTotal(),
                remise_globale: calculateDiscount()
              },
              lignes: cart.map(item => ({
                produit: { libelle_produit: item.product.name || item.product.libelle_produit },
                quantite: item.quantity,
                prix_unitaire_ttc: item.unitPrice,
                montant_ligne_ttc: item.total
              })),
              pharmacyInfo: {
                name: pharmacyInfo.name,
                adresse: pharmacyInfo.address,
                telephone: pharmacyInfo.telephone_appel || pharmacyInfo.telephone_whatsapp
              },
              agentName: currentUser?.prenoms && currentUser?.noms 
                ? `${currentUser.prenoms} ${currentUser.noms}` 
                : 'Vendeur',
              sessionNumero: selectedSession.numero_session
            };

            const pdfUrl = await printSalesTicket(ticketData);
            const printWindow = window.open(pdfUrl, '_blank');
            if (printWindow) {
              printWindow.onload = () => printWindow.print();
            }

            toast({ title: "Ticket imprimé", description: "Le ticket a été envoyé à l'imprimante" });
          } catch (printError) {
            console.error('Erreur impression:', printError);
            toast({ title: "Avertissement", description: "Vente enregistrée mais erreur d'impression" });
          }
        }

        // Reset
        clearCart();
        setCustomer({ type: 'ordinaire' });
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Erreur transaction:', error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [cart, customer, selectedSessionId, openSessions, currentUser, saveTransaction, autoPrintTicket]);

  // Pas de session disponible
  if (!loadingSessions && openSessions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center gap-2 justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Aucune Session Ouverte
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Aucune session de caisse n'est ouverte. Veuillez ouvrir une session pour effectuer des ventes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Section Gauche - Recherche Produits */}
      <div className="flex-1 space-y-6">
        {/* Sélection session et options */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm font-medium mb-1 block">Session de caisse</Label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une session" />
                  </SelectTrigger>
                  <SelectContent>
                    {openSessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.numero_session} - {session.caisse?.nom_caisse || 'Caisse'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="autoPrint"
                  checked={autoPrintTicket}
                  onCheckedChange={setAutoPrintTicket}
                />
                <Label htmlFor="autoPrint" className="flex items-center gap-1">
                  <Printer className="h-4 w-4" />
                  Impression auto
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    toast({ title: "Produit scanné", description: product.name });
                  } else {
                    toast({ title: "Produit non trouvé", description: barcode, variant: "destructive" });
                  }
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ProductSearch onAddToCart={addToCart} />
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSelection customer={customer} onCustomerChange={setCustomer} />
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
                <span>{formatAmount(calculateSubtotal())}</span>
              </div>
              
              {calculateDiscount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise ({customer.discountRate}%):</span>
                  <span>-{formatAmount(calculateDiscount())}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total à payer:</span>
                <span className="text-primary">{formatAmount(calculateTotal())}</span>
              </div>
            </div>
            
            {/* Bouton Validation */}
            <Button 
              size="lg" 
              className="w-full"
              onClick={handleValidateSale}
              disabled={cart.length === 0 || isSaving || !selectedSessionId}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Valider la Vente
                </>
              )}
            </Button>
            
            {/* Bouton Ordonnance */}
            <Button 
              size="sm" 
              variant="secondary"
              className="w-full"
              onClick={() => setShowPrescriptionModal(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ordonnance
            </Button>

            {/* Bouton Produit Demandé */}
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={() => setShowDemandModal(true)}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Produit Demandé
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              La vente sera enregistrée en attente d'encaissement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal Ordonnance */}
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

      {/* Modal Produit Demandé */}
      <ProductDemandModal
        open={showDemandModal}
        onOpenChange={setShowDemandModal}
      />
    </div>
  );
};

export default SalesOnlyInterface;

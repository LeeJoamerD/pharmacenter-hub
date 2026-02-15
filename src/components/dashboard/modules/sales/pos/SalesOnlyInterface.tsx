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
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions';
import PriceEditDialog from './PriceEditDialog';
import { PrescriptionModal } from '../../pos/PrescriptionModal';
import ProductDemandModal from '../../pos/ProductDemandModal';
import ProductSearch from './ProductSearch';
import ShoppingCartComponent from './ShoppingCartComponent';
import CustomerSelection from './CustomerSelection';
import POSBarcodeActions from './POSBarcodeActions';
import { usePOSData } from '@/hooks/usePOSData';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { usePOSCalculations } from '@/hooks/usePOSCalculations';
import { useClientDebt, useCanAddDebt } from '@/hooks/useClientDebt';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { TransactionData, CartItemWithLot, CustomerInfo, CustomerType } from '@/types/pos';
import { setupBarcodeScanner } from '@/utils/barcodeScanner';
import { printSalesTicket } from '@/utils/salesTicketPrinter';
import { openPdfWithOptions } from '@/utils/printOptions';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
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
  const { t } = useLanguage();
  const { settings: salesSettings } = useSalesSettings();
  const { canAccess } = useDynamicPermissions();
  
  const { searchByBarcode, saveTransaction, checkStock } = usePOSData();

  // Bloquer l'accès si pas de permission de créer des ventes
  if (!canAccess('sales.create')) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center gap-2 justify-center">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Accès Non Autorisé
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour créer des ventes.
              Contactez votre responsable pour obtenir les accès appropriés.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // États
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>({ type: 'Ordinaire', discount_rate: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [priceEditProductId, setPriceEditProductId] = useState<number | null>(null);
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
        toast({ title: t('productScanned'), description: product.name });
      } else {
        toast({ title: t('productNotFound'), description: barcode, variant: "destructive" });
      }
    }, { minLength: 8, maxLength: 20, timeout: 100 });
    return cleanup;
  }, [searchByBarcode]);

  const addToCart = useCallback(async (product: any, quantity: number = 1) => {
    const hasStock = await checkStock(product.id, quantity);
    if (!hasStock) {
      toast({
        title: t('stockInsufficient'),
        description: `${t('only')} ${product.stock} ${t('unitsAvailable')}`,
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
        title: t('stockInsufficient'),
        description: `${t('maxAvailable')}: ${maxStock} ${t('units')}`,
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

  // Calculer le total HT (somme des prix HT × quantité)
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
    return calculations.montantRemise;
  }, [calculations.montantRemise]);

  const calculateTotal = useCallback(() => {
    return calculations.totalAPayer;
  }, [calculations.totalAPayer]);

  // Valider la vente (sans encaissement)
  const handleValidateSale = useCallback(async () => {
    if (cart.length === 0) {
      toast({ title: t('emptyCartError'), variant: "destructive" });
      return;
    }

    if (!selectedSessionId) {
      toast({ title: t('selectSessionError'), variant: "destructive" });
      return;
    }

    const selectedSession = openSessions.find(s => s.id === selectedSessionId);
    if (!selectedSession) {
      toast({ title: t('invalidSession'), variant: "destructive" });
      return;
    }

    // Vérification finale du stock avant validation
    for (const item of cart) {
      const hasStock = await checkStock(item.product.id, item.quantity);
      if (!hasStock) {
        toast({
          title: t('stockInsufficient'),
          description: `${t('stockInsufficient')} "${item.product.name}". ${t('adjustQuantity')}`,
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
          title: t('saleRegistered'),
          description: `${t('ticketNumber')} ${result.numero_facture} - ${t('pendingCashPayment')}`,
        });

        // Impression automatique du ticket
        if (autoPrintTicket) {
          try {
            const pharmacyInfo = getPharmacyInfo();
            const ticketData = {
              vente: {
                numero_vente: result.numero_facture,
                date_vente: new Date().toISOString(),
                montant_total_ht: calculations.totalHT,
                montant_tva: calculations.montantTVA,
                taux_tva: 18,
                montant_centime_additionnel: calculations.montantCentime,
                taux_centime_additionnel: 5,
                montant_total_ttc: calculations.sousTotalTTC,
                montant_net: calculations.totalAPayer,
                remise_globale: calculations.montantRemise + calculations.montantTicketModerateur,
                // Champs assurance
                taux_couverture_assurance: calculations.tauxCouverture,
                montant_part_assurance: calculations.partAssurance,
                montant_part_patient: calculations.partClient,
                // Ticket modérateur et remise
                taux_ticket_moderateur: calculations.tauxTicketModerateur,
                montant_ticket_moderateur: calculations.montantTicketModerateur,
                taux_remise_automatique: calculations.tauxRemise,
                montant_remise_automatique: calculations.montantRemise
              },
              lignes: cart.map(item => {
                const lot = item.product.lots?.[0];
                return {
                  produit: { libelle_produit: item.product.name || item.product.libelle_produit },
                  quantite: item.quantity,
                  prix_unitaire_ttc: item.unitPrice,
                  montant_ligne_ttc: item.total,
                  // Informations de traçabilité du lot
                  numero_lot: lot?.numero_lot,
                  date_peremption: lot?.date_peremption 
                    ? new Date(lot.date_peremption).toISOString() 
                    : undefined
                };
              }),
              client: customer.name ? {
                nom: customer.name,
                type: customer.type,
                assureur: customer.assureur_libelle
              } : undefined,
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

            const printOptions = {
              autoprint: salesSettings.printing.autoprint,
              receiptFooter: salesSettings.printing.receiptFooter,
              printLogo: salesSettings.printing.printLogo,
              includeBarcode: salesSettings.printing.includeBarcode,
              paperSize: salesSettings.printing.paperSize,
            };
            const pdfUrl = await printSalesTicket(ticketData, printOptions);
            openPdfWithOptions(pdfUrl, printOptions);

            toast({ title: t('ticketPrinted'), description: t('ticketSentPrinter') });
          } catch (printError) {
            console.error('Erreur impression:', printError);
            toast({ title: t('warning'), description: t('saleRegisteredPrintWarning') });
          }
        }

        // Reset
        clearCart();
        setCustomer({ type: 'Ordinaire', discount_rate: 0 });
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
              {t('noOpenSession')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('noOpenSessionDesc')}
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
                <Label className="text-sm font-medium mb-1 block">{t('cashSession')}</Label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectSession')} />
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
                  {t('autoPrint')}
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
                {t('productSearch')}
              </CardTitle>
              <POSBarcodeActions 
                onBarcodeScanned={async (barcode) => {
                  const product = await searchByBarcode(barcode);
                  if (product) {
                    addToCart(product);
                    toast({ title: t('productScanned'), description: product.name });
                  } else {
                    toast({ title: t('productNotFound'), description: barcode, variant: "destructive" });
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
              {t('client')}
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
                {t('cart')}
              </div>
              <Badge variant="secondary">
                {cart.reduce((total, item) => total + item.quantity, 0)} {t('articles')}
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
            
            {/* Totaux avec détail TVA, Centime et calculs avancés */}
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
              
              {/* Remise */}
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

              {/* Info dette / bon pour clients éligibles */}
              {calculations.peutPrendreBon && cart.length > 0 && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md space-y-1">
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 text-xs font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    Vente en bon (dette)
                  </div>
                  {calculations.estAssure && calculations.partAssurance > 0 ? (
                    <>
                      <div className="flex justify-between text-xs text-amber-700 dark:text-amber-300">
                        <span>Part assurance (dette assureur):</span>
                        <span>{formatAmount(calculations.partAssurance)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-amber-700 dark:text-amber-300">
                        <span>Part client (à payer):</span>
                        <span>{formatAmount(calculations.totalAPayer)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-xs text-amber-700 dark:text-amber-300">
                      <span>Total en dette (à charge du client):</span>
                      <span>{formatAmount(calculations.totalAPayer)}</span>
                    </div>
                  )}
                </div>
              )}
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

      <PriceEditDialog
        open={priceEditProductId !== null}
        onOpenChange={(open) => { if (!open) setPriceEditProductId(null); }}
        cartItem={cart.find(item => item.product.id === priceEditProductId) || null}
        onPriceUpdated={(productId, newUnitPrice) => {
          setCart(prev => prev.map(item =>
            item.product.id === productId
              ? { ...item, unitPrice: newUnitPrice, total: newUnitPrice * item.quantity }
              : item
          ));
        }}
      />
    </div>
  );
};

export default SalesOnlyInterface;

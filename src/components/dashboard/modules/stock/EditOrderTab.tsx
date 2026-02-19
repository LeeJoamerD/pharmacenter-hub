import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, 
  Search, 
  Save, 
  Send,
  Trash2,
  Edit,
  AlertTriangle,
  Loader2,
  ClipboardList,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useProductsForOrders } from '@/hooks/useProductsForOrders';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useOrderLines } from '@/hooks/useOrderLines';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { usePriceCategories } from '@/hooks/usePriceCategories';
import { supabase } from '@/integrations/supabase/client';
import { OrderValidationService } from '@/services/orderValidationService';
import { OrderStatusValidationService } from '@/services/orderStatusValidationService';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
import { useStockSettings } from '@/hooks/useStockSettings';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import { useSmartOrderSuggestions, SmartOrderSuggestion } from '@/hooks/useSmartOrderSuggestions';
import SmartOrderPanel from './SmartOrderPanel';
import SaleSelectionDialog from './SaleSelectionDialog';

interface EditOrderTabProps {
  orders: any[];
  suppliers: any[];
  onUpdateOrder: (id: string, orderData: any) => Promise<any>;
  onUpdateOrderStatus: (id: string, status: string) => Promise<any>;
  loading: boolean;
}

interface OrderLineWithCategory {
  id: string;
  produit_id: string;
  quantite_commandee: number;
  prix_achat_unitaire_attendu: number;
  remise: number;
  categorieTarificationId?: string;
  produit?: {
    libelle_produit: string;
    code_cip: string;
    categorie_tarification_id?: string;
  };
  tauxTva: number;
  tauxCentime: number;
}

const EditOrderTab: React.FC<EditOrderTabProps> = ({ 
  orders, 
  suppliers, 
  onUpdateOrder, 
  onUpdateOrderStatus, 
  loading 
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [notes, setNotes] = useState('');
  const [canModify, setCanModify] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [lineRemises, setLineRemises] = useState<Record<string, number>>({});
  const [showSmartPanel, setShowSmartPanel] = useState(false);
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  
  const { toast } = useToast();
  const debouncedSearch = useDebouncedValue(searchProduct, 300);
  const { 
    products: filteredProducts, 
    isLoading: productsLoading, 
    hasMore, 
    loadMore, 
    totalCount 
  } = useProductsForOrders(debouncedSearch, 50);
  const { settings } = useSystemSettings();
  const { orderLines, createOrderLine, updateOrderLine, deleteOrderLine, refetch } = useOrderLines(selectedOrderId);
  
  // Hooks multi-devise et catégories de tarification
  const { formatAmount, isNoDecimalCurrency, getCurrencySymbol } = useCurrencyFormatting();
  const { categories: priceCategories } = usePriceCategories();
  const currencySymbol = getCurrencySymbol();
  const { settings: stockSettings } = useStockSettings();
  const { settings: salesSettings } = useSalesSettings();
  
  // IDs des produits déjà dans la commande
  const existingProductIdsArray = useMemo(() => 
    orderLines.map(line => line.produit_id), 
    [orderLines]
  );

  // Hook pour les suggestions intelligentes
  const { 
    clientDemandSuggestions, 
    stockAlertSuggestions, 
    suggestionCounts,
    isLoading: smartLoading,
  } = useSmartOrderSuggestions(existingProductIdsArray);
  
  // Paramètres d'arrondi depuis le service centralisé
  const roundingPrecision = stockSettings?.rounding_precision || 25;
  const roundingMethod = (salesSettings?.tax?.taxRoundingMethod as 'ceil' | 'floor' | 'round' | 'none') || 'ceil';

  // État local pour les catégories modifiées
  const [lineCategories, setLineCategories] = useState<Record<string, string>>({});

  // Fonction pour ajouter des produits depuis les suggestions
  const addProductsFromSuggestions = useCallback(async (suggestions: SmartOrderSuggestion[]) => {
    if (!selectedOrderId || !canModify) return;
    
    let addedCount = 0;
    for (const suggestion of suggestions) {
      if (existingProductIdsArray.includes(suggestion.produit_id)) continue;
      
      try {
        await createOrderLine({
          commande_id: selectedOrderId,
          produit_id: suggestion.produit_id,
          quantite_commandee: suggestion.quantite_suggeree || 1,
          prix_achat_unitaire_attendu: suggestion.prix_achat || 0
        });
        addedCount++;
      } catch (error) {
        console.error('Erreur ajout produit:', error);
      }
    }
    
    if (addedCount > 0) {
      toast({
        title: "Produits ajoutés",
        description: `${addedCount} produit(s) ajouté(s) à la commande`,
      });
      refetch();
    }
  }, [selectedOrderId, canModify, existingProductIdsArray, createOrderLine, toast, refetch]);

  // Handlers pour l'import
  const handleImportClientDemands = useCallback(() => {
    if (clientDemandSuggestions.length === 0) {
      toast({ title: "Aucune demande", description: "Pas de demande client en attente" });
      return;
    }
    addProductsFromSuggestions(clientDemandSuggestions);
  }, [clientDemandSuggestions, addProductsFromSuggestions, toast]);

  const handleImportCriticalStock = useCallback(() => {
    const critical = stockAlertSuggestions.filter(s => s.source === 'rupture' || s.source === 'critique');
    if (critical.length === 0) {
      toast({ title: "Stock OK", description: "Aucun produit en rupture/critique" });
      return;
    }
    addProductsFromSuggestions(critical);
  }, [stockAlertSuggestions, addProductsFromSuggestions, toast]);

  const handleImportFromSale = useCallback((products: SmartOrderSuggestion[]) => {
    addProductsFromSuggestions(products);
    setShowSaleDialog(false);
  }, [addProductsFromSuggestions]);

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

  // Handler pour mettre à jour la catégorie de tarification
  const handleCategoryChange = async (lineId: string, produitId: string, categoryId: string) => {
    const catId = categoryId === 'none' ? '' : categoryId;
    
    // Mettre à jour localement
    setLineCategories(prev => ({ ...prev, [lineId]: catId }));

    // Mettre à jour le produit dans la base de données
    if (produitId && catId) {
      const { error } = await supabase
        .from('produits')
        .update({ categorie_tarification_id: catId })
        .eq('id', produitId);

      if (!error) {
        toast({ 
          title: "Catégorie mise à jour", 
          description: "La catégorie du produit a été mise à jour" 
        });
      }
    }
  };
  const draftOrders = orders.filter(order => ['Brouillon', 'En cours'].includes(order.statut));

  // Enrichir les lignes avec les taux de catégorie (utilise lineCategories pour les catégories modifiées)
  const enrichedOrderLines: OrderLineWithCategory[] = useMemo(() => {
    return orderLines.map(line => {
      // Utiliser lineCategories si modifié, sinon la catégorie du produit
      const categoryId = lineCategories[line.id] !== undefined 
        ? lineCategories[line.id] 
        : line.produit?.categorie_tarification_id;
      const category = priceCategories?.find(cat => cat.id === categoryId);
      const tauxTva = category?.taux_tva || 0;
      const tauxCentime = category?.taux_centime_additionnel || 0;
      const remise = lineRemises[line.id] || 0;
      
      return {
        ...line,
        categorieTarificationId: categoryId,
        tauxTva,
        tauxCentime,
        remise
      };
    });
  }, [orderLines, priceCategories, lineRemises, lineCategories]);

  // Calcul des totaux avec la même logique que OrderForm
  // Utilise le service centralisé pour l'arrondi de précision
  const calculateTotals = () => {
    let sousTotalHT = 0;
    let totalTva = 0;
    let totalCentime = 0;

    enrichedOrderLines.forEach(line => {
      const lineTotal = (line.quantite_commandee || 0) * (line.prix_achat_unitaire_attendu || 0);
      const remiseAmount = (lineTotal * (line.remise || 0)) / 100;
      const lineTotalAfterRemise = lineTotal - remiseAmount;
      
      sousTotalHT += lineTotalAfterRemise;
      
      // TVA seulement si le produit a un taux TVA > 0
      if (line.tauxTva && line.tauxTva > 0) {
        totalTva += lineTotalAfterRemise * (line.tauxTva / 100);
      }
      
      // Centime seulement si le produit a un taux centime > 0
      // Formule officielle : Centime = TVA × (Taux Centime / 100)
      if (line.tauxCentime && line.tauxCentime > 0) {
        const tvaLine = line.tauxTva ? lineTotalAfterRemise * (line.tauxTva / 100) : 0;
        totalCentime += tvaLine * (line.tauxCentime / 100);
      }
    });

    // Calcul ASDI automatique : ((Sous-total HT + TVA) × 0.42) / 100
    // Pas d'arrondi sur Sous-total HT, TVA, Centime et ASDI - valeurs exactes
    const totalAsdi = ((sousTotalHT + totalTva) * 0.42) / 100;

    // Total TTC = HT + TVA + Centime + ASDI
    // Arrondi appliqué UNIQUEMENT sur le Total TTC final
    const rawTotalTTC = sousTotalHT + totalTva + totalCentime + totalAsdi;
    const totalTTC = unifiedPricingService.roundToNearest(rawTotalTTC, roundingPrecision, roundingMethod);

    return { sousTotalHT, totalTva, totalCentime, totalAsdi, totalTTC };
  };

  const { sousTotalHT, totalTva, totalCentime, totalAsdi, totalTTC } = calculateTotals();

  // Check if order can be modified when order is selected
  useEffect(() => {
    const checkModifyPermission = async () => {
      if (selectedOrderId) {
        try {
          // Get current order status
          const selectedOrder = draftOrders.find(order => order.id === selectedOrderId);
          const currentStatus = selectedOrder?.statut || 'En cours';
          
          // Use new status validation service
          const validation = OrderStatusValidationService.canModifyOrder(currentStatus);
          setCanModify(validation.canModify);
          
          if (!validation.canModify) {
            setValidationError(validation.errors.join(', ') || 'Cette commande ne peut plus être modifiée.');
          } else {
            setValidationError('');
          }
          
          // Show warnings if any
          if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => {
              toast({
                title: "Attention",
                description: warning,
                variant: "default",
              });
            });
          }
        } catch (error) {
          console.error('Erreur lors de la vérification des permissions:', error);
          setCanModify(false);
          setValidationError('Erreur lors de la vérification des permissions de modification.');
        }
      }
    };

    checkModifyPermission();
  }, [selectedOrderId, toast]);

  // Load order details when selected
  useEffect(() => {
    if (selectedOrderId) {
      const selectedOrder = draftOrders.find(order => order.id === selectedOrderId);
      if (selectedOrder) {
        setSelectedSupplier(selectedOrder.fournisseur_id);
        setOrderDate(selectedOrder.date_commande ? selectedOrder.date_commande.split('T')[0] : '');
        setNotes('');
        setLineRemises({}); // Reset remises when changing order
      }
    }
  }, [selectedOrderId, draftOrders]);

  const addOrderLine = async (product: any) => {
    if (!selectedOrderId || !canModify) return;
    
    try {
      await createOrderLine({
        commande_id: selectedOrderId,
        produit_id: product.id,
        quantite_commandee: 1,
        prix_achat_unitaire_attendu: product.prix_achat || 0
      });
      setSearchProduct('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
    }
  };

  const handleUpdateOrderLine = async (id: string, field: string, value: number) => {
    if (!canModify) return;
    
    try {
      await updateOrderLine(id, {
        [field]: value
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleUpdateRemise = (lineId: string, value: number) => {
    setLineRemises(prev => ({
      ...prev,
      [lineId]: Math.min(100, Math.max(0, value))
    }));
  };

  const handleRemoveOrderLine = async (id: string) => {
    if (!canModify) return;
    
    try {
      await deleteOrderLine(id);
      // Clean up remise state for deleted line
      setLineRemises(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getLineTotal = (line: OrderLineWithCategory): number => {
    const lineTotal = (line.quantite_commandee || 0) * (line.prix_achat_unitaire_attendu || 0);
    const remiseAmount = (lineTotal * (line.remise || 0)) / 100;
    return lineTotal - remiseAmount;
  };

  const handleSaveOrder = async (statut: string) => {
    if (!selectedOrderId || !canModify) return;

    try {
      if (!selectedSupplier) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fournisseur",
          variant: "destructive",
        });
        return;
      }

      if (orderLines.length === 0) {
        toast({
          title: "Erreur",
          description: "La commande doit contenir au moins un produit",
          variant: "destructive",
        });
        return;
      }

      // Get current order status
      const selectedOrder = draftOrders.find(order => order.id === selectedOrderId);
      const currentStatus = selectedOrder?.statut || 'En cours';

      // Validate status transition ONLY if status is actually changing
      if (statut !== currentStatus) {
        const statusValidation = OrderStatusValidationService.canTransitionTo(currentStatus, statut);
        if (!statusValidation.canTransition) {
          toast({
            title: "Transition non autorisée",
            description: statusValidation.errors.join(', '),
            variant: "destructive",
          });
          return;
        }

        // Show warnings if any
        if (statusValidation.warnings.length > 0) {
          statusValidation.warnings.forEach(warning => {
            toast({
              title: "Attention",
              description: warning,
              variant: "default",
            });
          });
        }
      }

      // Validate order data
      const orderData = {
        fournisseur_id: selectedSupplier,
        date_commande: orderDate,
        lignes: orderLines
      };

      const dataValidation = OrderStatusValidationService.validateOrderData(orderData, statut);
      if (!dataValidation.canTransition) {
        toast({
          title: "Données invalides",
          description: dataValidation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Update order header information with financial totals
      await onUpdateOrder(selectedOrderId, {
        fournisseur_id: selectedSupplier,
        date_commande: orderDate,
        montant_ht: sousTotalHT,
        montant_tva: totalTva,
        montant_centime_additionnel: totalCentime,
        montant_asdi: totalAsdi,
        montant_ttc: totalTTC,
      });

      // Update status if different from current
      if (statut !== currentStatus) {
        await onUpdateOrderStatus(selectedOrderId, statut);
        
        // Reset selection if order is no longer modifiable
        const newStatusInfo = OrderStatusValidationService.canModifyOrder(statut);
        if (!newStatusInfo.canModify) {
          setSelectedOrderId('');
          setSelectedSupplier('');
          setOrderDate('');
          setNotes('');
          setLineRemises({});
        }
      }
        
      toast({
        title: "Succès",
        description: statut === 'Confirmé' ? "Commande confirmée avec succès" : "Commande sauvegardée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde de la commande",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélection de commande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier une Commande en Cours
          </CardTitle>
          <CardDescription>Sélectionnez une commande à modifier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Commande à modifier</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une commande" />
                </SelectTrigger>
                <SelectContent>
                  {draftOrders.map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.fournisseur?.nom} - {new Date(order.date_commande || '').toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {draftOrders.length === 0 && (
              <div className="col-span-2">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Aucune commande en cours de modification disponible.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Error Alert */}
      {validationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Order editing form - only show if order is selected and can be modified */}
      {selectedOrderId && canModify && (
        <>
          {/* Order Header */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la Commande</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fournisseur">Fournisseur *</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dateCommande">Date de commande</Label>
                    <Input
                      id="dateCommande"
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dateLivraison">Date de livraison souhaitée</Label>
                    <Input
                      id="dateLivraison"
                      type="date"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="priorite">Priorité</Label>
                    <Select defaultValue="normale">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faible">Faible</SelectItem>
                        <SelectItem value="normale">Normale</SelectItem>
                        <SelectItem value="haute">Haute</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ajouter des Produits</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleImportClientDemands} disabled={clientDemandSuggestions.length === 0}>
                    <ClipboardList className="h-4 w-4 mr-1" />Demandes ({clientDemandSuggestions.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSaleDialog(true)}>
                    <ShoppingBag className="h-4 w-4 mr-1" />Depuis Session
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleImportCriticalStock} 
                    disabled={stockAlertSuggestions.filter(s => s.source === 'rupture' || s.source === 'critique').length === 0}>
                    <AlertTriangle className="h-4 w-4 mr-1" />Stock Critique
                  </Button>
                  <Button variant={showSmartPanel ? "secondary" : "outline"} size="sm" onClick={() => setShowSmartPanel(!showSmartPanel)}>
                    <Sparkles className="h-4 w-4 mr-1" />Suggestions
                    {showSmartPanel ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Collapsible open={showSmartPanel} onOpenChange={setShowSmartPanel}>
                <CollapsibleContent>
                  <div className="mb-4">
                    <SmartOrderPanel
                      clientDemandSuggestions={clientDemandSuggestions}
                      stockAlertSuggestions={stockAlertSuggestions}
                      suggestionCounts={suggestionCounts}
                      onAddProducts={addProductsFromSuggestions}
                      isLoading={smartLoading}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              {searchProduct && (
                <div className="border rounded-lg p-4 mb-4 bg-muted/50">
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Recherche en cours...</span>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <>
                      <h4 className="font-medium mb-3">
                        Produits trouvés : {totalCount} résultat{totalCount > 1 ? 's' : ''}
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredProducts.map(product => (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-background rounded border">
                            <div>
                              <span className="font-medium">{product.libelle_produit}</span>
                              <span className="text-muted-foreground ml-2">({product.code_cip || 'N/A'})</span>
                              <Badge variant="outline" className="ml-2">{formatAmount(product.prix_achat || 0)}</Badge>
                            </div>
                            <Button size="sm" onClick={() => addOrderLine(product)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {hasMore && (
                        <Button variant="outline" className="w-full mt-3" onClick={loadMore}>
                          Charger plus de produits
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-2">
                      Aucun produit trouvé pour "{searchProduct}"
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Lines */}
          {enrichedOrderLines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Détail de la Commande</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Cat. Tarification</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix Unitaire</TableHead>
                        <TableHead>Remise (%)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedOrderLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">
                            {line.produit?.libelle_produit || 'Produit inconnu'}
                          </TableCell>
                          <TableCell>{line.produit?.code_cip || 'N/A'}</TableCell>
                          <TableCell>
                            <Select
                              value={line.categorieTarificationId || 'none'}
                              onValueChange={(value) => handleCategoryChange(line.id, line.produit_id, value)}
                              disabled={!canModify}
                            >
                              <SelectTrigger className={`w-36 ${getCategoryColorClass(line.categorieTarificationId)}`}>
                                <SelectValue placeholder="Catégorie" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Aucune</SelectItem>
                                {priceCategories?.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.libelle_categorie}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={line.quantite_commandee}
                              onChange={(e) => handleUpdateOrderLine(line.id, 'quantite_commandee', parseInt(e.target.value) || 0)}
                              className="w-20"
                              min="1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={line.prix_achat_unitaire_attendu || 0}
                              onChange={(e) => handleUpdateOrderLine(line.id, 'prix_achat_unitaire_attendu', parseInt(e.target.value) || 0)}
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={line.remise}
                              onChange={(e) => handleUpdateRemise(line.id, parseFloat(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                              max="100"
                              step="1"
                              disabled={!canModify}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatAmount(getLineTotal(line))}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRemoveOrderLine(line.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals - Design aligné sur OrderForm */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-96 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Sous-total HT :</span>
                        <span className="font-medium">{formatAmount(sousTotalHT)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">TVA ({currencySymbol}) :</span>
                        <span className="font-medium">{formatAmount(totalTva)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Centime Additionnel ({currencySymbol}) :</span>
                        <span className="font-medium">{formatAmount(totalCentime)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">ASDI ({currencySymbol}) :</span>
                        <span className="font-medium">{formatAmount(totalAsdi)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                        <span>Total TTC :</span>
                        <span>{formatAmount(totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes and Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Finalisation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes et commentaires</Label>
                   <Textarea
                     id="notes"
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Instructions particulières, conditions de livraison, etc."
                     rows={3}
                   />
                </div>
                
                 <div className="flex gap-4 justify-end">
                   <Button 
                     variant="outline"
                     onClick={() => handleSaveOrder('En cours')}
                     disabled={loading || !selectedSupplier || orderLines.length === 0 || !canModify}
                   >
                     <Save className="mr-2 h-4 w-4" />
                     Sauvegarder
                   </Button>
                   <Button
                     onClick={() => handleSaveOrder('Confirmé')}
                     disabled={loading || !selectedSupplier || orderLines.length === 0 || !canModify}
                   >
                     <Send className="mr-2 h-4 w-4" />
                     Confirmer Commande
                   </Button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog de sélection de vente */}
      <SaleSelectionDialog
        open={showSaleDialog}
        onOpenChange={setShowSaleDialog}
        onImportProducts={handleImportFromSale}
        existingProductIds={existingProductIdsArray}
      />
    </div>
  );
};

export default EditOrderTab;

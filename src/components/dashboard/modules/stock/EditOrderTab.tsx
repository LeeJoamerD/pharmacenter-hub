import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Save, 
  Send,
  Trash2,
  Edit,
  AlertTriangle
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useOrderLines } from '@/hooks/useOrderLines';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { OrderValidationService } from '@/services/orderValidationService';
import { OrderStatusValidationService } from '@/services/orderStatusValidationService';

interface EditOrderTabProps {
  orders: any[];
  suppliers: any[];
  onUpdateOrder: (id: string, orderData: any) => Promise<any>;
  onUpdateOrderStatus: (id: string, status: string) => Promise<any>;
  loading: boolean;
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
  const [editableTva, setEditableTva] = useState<number>(18);
  const [editableCentimeAdditionnel, setEditableCentimeAdditionnel] = useState<number>(5);
  
  const { toast } = useToast();
  const { products } = useProducts();
  const { settings } = useSystemSettings();
  const { orderLines, createOrderLine, updateOrderLine, deleteOrderLine, refetch } = useOrderLines(selectedOrderId);

  // Filter orders to only show "En cours" status
  const draftOrders = orders.filter(order => order.statut === 'En cours');

  // Filter products for search
  const filteredProducts = products.filter(product =>
    product.libelle_produit.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (product.code_cip && product.code_cip.toLowerCase().includes(searchProduct.toLowerCase()))
  );

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

  // Load order details when selected and initialize system settings
  useEffect(() => {
    if (selectedOrderId) {
      const selectedOrder = draftOrders.find(order => order.id === selectedOrderId);
      if (selectedOrder) {
        setSelectedSupplier(selectedOrder.fournisseur_id);
        setOrderDate(selectedOrder.date_commande ? selectedOrder.date_commande.split('T')[0] : '');
        // Notes are UI-only like in OrderForm, not persisted
        setNotes('');
      }
    }
    
    // Initialize editable rates from system settings
    if (settings) {
      setEditableTva(settings.taux_tva || 18);
      setEditableCentimeAdditionnel(settings.taux_centime_additionnel || 5);
    }
  }, [selectedOrderId, draftOrders, settings]);

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

  const handleRemoveOrderLine = async (id: string) => {
    if (!canModify) return;
    
    try {
      await deleteOrderLine(id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const calculateTotals = () => {
    const sousTotal = orderLines.reduce((sum, line) => {
      const unitPrice = line.prix_achat_unitaire_attendu || 0;
      return sum + (line.quantite_commandee * unitPrice);
    }, 0);
    const centimeAdditionnel = sousTotal * (editableCentimeAdditionnel / 100);
    const tva = (sousTotal + centimeAdditionnel) * (editableTva / 100);
    const totalGeneral = sousTotal + centimeAdditionnel + tva;
    return { sousTotal, centimeAdditionnel, tva, totalGeneral };
  };

  const { sousTotal, centimeAdditionnel, tva, totalGeneral } = calculateTotals();

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

      // Validate status transition
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

      // Update order header information
      await onUpdateOrder(selectedOrderId, {
        fournisseur_id: selectedSupplier,
        date_commande: orderDate
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
              <CardTitle>Ajouter des Produits</CardTitle>
            </CardHeader>
            <CardContent>
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

              {searchProduct && filteredProducts.length > 0 && (
                <div className="border rounded-lg p-4 mb-4 bg-muted/50">
                  <h4 className="font-medium mb-3">Produits trouvés :</h4>
                  <div className="space-y-2">
                     {filteredProducts.map(product => (
                       <div key={product.id} className="flex items-center justify-between p-2 bg-background rounded border">
                         <div>
                           <span className="font-medium">{product.libelle_produit}</span>
                           <span className="text-muted-foreground ml-2">({product.code_cip || 'N/A'})</span>
                           <Badge variant="outline" className="ml-2">{(product.prix_achat || 0).toLocaleString()} F CFA</Badge>
                         </div>
                         <Button size="sm" onClick={() => addOrderLine(product)}>
                           <Plus className="h-4 w-4" />
                         </Button>
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Lines */}
          {orderLines.length > 0 && (
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
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix Unitaire</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">
                            {line.produit?.libelle_produit || 'Produit inconnu'}
                          </TableCell>
                          <TableCell>{line.produit?.code_cip || 'N/A'}</TableCell>
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
                          <TableCell className="font-medium">
                            {((line.quantite_commandee || 0) * (line.prix_achat_unitaire_attendu || 0)).toLocaleString()} F CFA
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

                {/* Totals */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-3">
                      <div className="flex justify-between">
                        <span>Sous-total HT :</span>
                        <span className="font-medium">{sousTotal.toLocaleString()} F CFA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Centime Additionnel :</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editableCentimeAdditionnel}
                            onChange={(e) => setEditableCentimeAdditionnel(parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 text-right"
                            min="0"
                            max="100"
                            step="0.01"
                            disabled={!canModify}
                          />
                          <span>% = {centimeAdditionnel.toLocaleString()} F CFA</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>TVA :</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editableTva}
                            onChange={(e) => setEditableTva(parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 text-right"
                            min="0"
                            max="100"
                            step="0.01"
                            disabled={!canModify}
                          />
                          <span>% = {tva.toLocaleString()} F CFA</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC :</span>
                        <span>{totalGeneral.toLocaleString()} F CFA</span>
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
    </div>
  );
};

export default EditOrderTab;
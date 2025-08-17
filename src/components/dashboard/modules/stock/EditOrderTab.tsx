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
import { useToast } from '@/hooks/use-toast';
import { OrderValidationService } from '@/services/orderValidationService';

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
  
  const { toast } = useToast();
  const { products } = useProducts();
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
          const result = await OrderValidationService.canModifyOrder(selectedOrderId);
          const canModifyOrder = typeof result === 'boolean' ? result : result.canModify;
          setCanModify(canModifyOrder);
          if (!canModifyOrder) {
            setValidationError('Cette commande ne peut plus être modifiée en raison de son statut actuel.');
          } else {
            setValidationError('');
          }
        } catch (error) {
          console.error('Erreur lors de la vérification des permissions:', error);
          setCanModify(false);
          setValidationError('Erreur lors de la vérification des permissions de modification.');
        }
      }
    };

    checkModifyPermission();
  }, [selectedOrderId]);

  // Load order details when selected
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
    const tva = sousTotal * 0.18; // 18% TVA
    const totalGeneral = sousTotal + tva;
    return { sousTotal, tva, totalGeneral };
  };

  const { sousTotal, tva, totalGeneral } = calculateTotals();

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

      // Update order header information
      await onUpdateOrder(selectedOrderId, {
        fournisseur_id: selectedSupplier,
        date_commande: orderDate
      });

      // Update status if sending order
      if (statut === 'Confirmé') {
        await onUpdateOrderStatus(selectedOrderId, 'Confirmé');
        
        // Reset selection since order is no longer "En cours"
        setSelectedOrderId('');
        setSelectedSupplier('');
        setOrderDate('');
        setNotes('');
        
        toast({
          title: "Succès",
          description: "Commande envoyée avec succès",
        });
      } else {
        toast({
          title: "Succès",
          description: "Commande sauvegardée avec succès",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
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
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Sous-total HT :</span>
                        <span className="font-medium">{sousTotal.toLocaleString()} F CFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (18%) :</span>
                        <span className="font-medium">{tva.toLocaleString()} F CFA</span>
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
                     disabled={loading || !selectedSupplier || orderLines.length === 0}
                   >
                     <Save className="mr-2 h-4 w-4" />
                     Sauvegarder Brouillon
                   </Button>
                   <Button
                     onClick={() => handleSaveOrder('Confirmé')}
                     disabled={loading || !selectedSupplier || orderLines.length === 0}
                   >
                     <Send className="mr-2 h-4 w-4" />
                     Envoyer Commande
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
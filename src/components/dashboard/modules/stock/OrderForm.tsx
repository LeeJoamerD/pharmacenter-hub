import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  Search, 
  Calculator, 
  Save, 
  Send,
  FileText,
  Trash2,
  ShoppingCart
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useProductsForOrders } from '@/hooks/useProductsForOrders';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { calculateFinancials } from '@/lib/utils';
import { OrderStatusValidationService } from '@/services/orderStatusValidationService';

interface OrderLine {
  id: string;
  produit_id: string; // ID du produit pour la sauvegarde
  produit: string;
  reference: string;
  quantite: number;
  prixUnitaire: number;
  remise: number;
  total: number;
}

interface OrderFormProps {
  suppliers: any[];
  onCreateOrder: (orderData: any) => Promise<any>;
  loading: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ suppliers: propSuppliers = [], onCreateOrder, loading }) => {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [notes, setNotes] = useState('');
  const [editableTva, setEditableTva] = useState<number>(18);
  const [editableCentimeAdditionnel, setEditableCentimeAdditionnel] = useState<number>(5);
  const { toast } = useToast();

  // Use real suppliers and products
  const suppliers = propSuppliers;
  const { products } = useProducts();
  const { settings } = useSystemSettings();

  // Recherche débouncée pour optimiser les performances
  const debouncedSearchTerm = useDebouncedValue(searchProduct, 300);
  
  // Hook pour la recherche paginée de produits
  const {
    products: searchResults,
    isLoading: isSearching,
    hasMore,
    loadMore,
    resetSearch,
    totalCount
  } = useProductsForOrders(debouncedSearchTerm, 50);

  // Initialize system settings rates
  useEffect(() => {
    if (settings) {
      setEditableTva(settings.taux_tva || 18);
      setEditableCentimeAdditionnel(settings.taux_centime_additionnel || 5);
    }
  }, [settings]);

  // Réinitialiser la recherche quand le terme de recherche change
  useEffect(() => {
    if (debouncedSearchTerm !== searchProduct) {
      resetSearch();
    }
  }, [debouncedSearchTerm, resetSearch, searchProduct]);

  const addOrderLine = (product: any) => {
    const newLine: OrderLine = {
      id: Date.now().toString(),
      produit_id: product.id, // Stocker l'ID du produit
      produit: product.libelle_produit,
      reference: product.code_cip || 'N/A',
      quantite: 1,
      prixUnitaire: product.prix_achat || 0,
      remise: 0,
      total: product.prix_achat || 0
    };
    setOrderLines([...orderLines, newLine]);
    setSearchProduct('');
  };

  const updateOrderLine = (id: string, field: keyof OrderLine, value: number) => {
    setOrderLines(lines => lines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire' || field === 'remise') {
          const sousTotal = updatedLine.quantite * updatedLine.prixUnitaire;
          const remiseAmount = (sousTotal * updatedLine.remise) / 100;
          updatedLine.total = sousTotal - remiseAmount;
        }
        return updatedLine;
      }
      return line;
    }));
  };

  const removeOrderLine = (id: string) => {
    setOrderLines(lines => lines.filter(line => line.id !== id));
  };

  const sousTotalHT = orderLines.reduce((sum, line) => sum + line.total, 0);
  const { tva, centimeAdditionnel, totalTTC: totalGeneral } = calculateFinancials(sousTotalHT, editableTva, editableCentimeAdditionnel);
  const sousTotal = sousTotalHT;

  const handleSaveOrder = async (statut: string) => {
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
          description: "Veuillez ajouter au moins un produit",
          variant: "destructive",
        });
        return;
      }

      // Validate status transition from 'Nouveau' (creation)
      const validation = OrderStatusValidationService.canTransitionTo('Nouveau', statut);
      if (!validation.canTransition) {
        toast({
          title: "Transition non autorisée",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
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

      // Determine final status based on action
      let finalStatus = statut;
      if (statut === 'Brouillon') {
        finalStatus = 'Brouillon';
      } else if (statut === 'En cours') {
        finalStatus = 'En cours';
      } else if (statut === 'Confirmé') {
        finalStatus = 'Confirmé';
      }

      const orderData = {
        fournisseur_id: selectedSupplier,
        statut: finalStatus,
        date_commande: (document.getElementById('dateCommande') as HTMLInputElement)?.value || new Date().toISOString().split('T')[0],
        notes: notes,
        lignes: orderLines.map(line => ({
          produit_id: line.produit_id, // Utiliser l'ID stocké directement
          quantite_commandee: line.quantite,
          prix_achat_unitaire_attendu: line.prixUnitaire
        }))
      };

      await onCreateOrder(orderData);
      
      // Reset form
      setSelectedSupplier('');
      setOrderLines([]);
      setNotes('');
      setSearchProduct('');
      
      const statusMessage = {
        'Brouillon': 'sauvegardée comme brouillon',
        'En cours': 'sauvegardée en cours',
        'Confirmé': 'confirmée et envoyée'
      }[finalStatus] || 'sauvegardée';
      
      toast({
        title: "Succès",
        description: `Commande ${statusMessage} avec succès`,
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
      {/* En-tête de commande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nouvelle Commande
          </CardTitle>
          <CardDescription>Créer un bon de commande fournisseur</CardDescription>
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
                  defaultValue={new Date().toISOString().split('T')[0]}
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

      {/* Ajout de produits */}
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

          {searchProduct && (
            <div className="border rounded-lg p-4 mb-4 bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">
                  Produits trouvés {totalCount > 0 && `(${totalCount} au total)`}
                </h4>
                {isSearching && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Recherche...
                  </div>
                )}
              </div>
              
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map(product => (
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
                  
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={loadMore}
                        disabled={isSearching}
                        size="sm"
                      >
                        {isSearching ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Chargement...
                          </>
                        ) : (
                          <>Voir plus de produits</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : !isSearching && debouncedSearchTerm && (
                <div className="text-center py-4 text-muted-foreground">
                  Aucun produit trouvé pour "{debouncedSearchTerm}"
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lignes de commande */}
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
                    <TableHead>Remise (%)</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.produit}</TableCell>
                      <TableCell>{line.reference}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.quantite}
                          onChange={(e) => updateOrderLine(line.id, 'quantite', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.prixUnitaire}
                          onChange={(e) => updateOrderLine(line.id, 'prixUnitaire', parseInt(e.target.value) || 0)}
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.remise}
                          onChange={(e) => updateOrderLine(line.id, 'remise', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          max="100"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {line.total.toLocaleString()} F CFA
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeOrderLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totaux */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between">
                    <span>Sous-total HT :</span>
                    <span className="font-medium">{sousTotal.toLocaleString()} F CFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>TVA ({editableTva}%):</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editableTva}
                        onChange={(e) => setEditableTva(parseFloat(e.target.value) || 0)}
                        className="w-16 h-8 text-right"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span>= {tva.toLocaleString()} F CFA</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Centime Additionnel ({editableCentimeAdditionnel}%):</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editableCentimeAdditionnel}
                        onChange={(e) => setEditableCentimeAdditionnel(parseFloat(e.target.value) || 0)}
                        className="w-16 h-8 text-right"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span>= {centimeAdditionnel.toLocaleString()} F CFA</span>
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

      {/* Notes et actions */}
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
                 onClick={() => handleSaveOrder('Brouillon')}
                 disabled={loading || !selectedSupplier || orderLines.length === 0}
               >
                 <Save className="mr-2 h-4 w-4" />
                 Sauvegarder Brouillon
               </Button>
               <Button 
                 variant="secondary"
                 onClick={() => handleSaveOrder('En cours')}
                 disabled={loading || !selectedSupplier || orderLines.length === 0}
               >
                 <FileText className="mr-2 h-4 w-4" />
                 Mettre En Cours
               </Button>
               <Button
                 onClick={() => handleSaveOrder('Confirmé')}
                 disabled={loading || !selectedSupplier || orderLines.length === 0}
               >
                 <Send className="mr-2 h-4 w-4" />
                 Confirmer Commande
               </Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderForm;

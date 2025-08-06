import React, { useState } from 'react';
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

interface OrderLine {
  id: string;
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

  // Use real suppliers or fallback to mock data
  const suppliers = propSuppliers.length > 0 ? propSuppliers : [
    { id: '1', nom: 'Laboratoire Alpha', email: 'contact@alpha.com' },
    { id: '2', nom: 'Pharma Beta', email: 'commandes@beta.com' },
    { id: '3', nom: 'Laboratoire Gamma', email: 'orders@gamma.com' },
    { id: '4', nom: 'NutriPharma', email: 'achats@nutripharma.com' }
  ];

  // Données mockées des produits
  const products = [
    { id: '1', nom: 'Paracétamol 500mg', reference: 'PAR500', prix: 25000, stock: 100 },
    { id: '2', nom: 'Ibuprofène 200mg', reference: 'IBU200', prix: 15000, stock: 50 },
    { id: '3', nom: 'Amoxicilline 250mg', reference: 'AMO250', prix: 35000, stock: 75 },
    { id: '4', nom: 'Vitamine C 500mg', reference: 'VIT500', prix: 12000, stock: 200 },
    { id: '5', nom: 'Aspirine 100mg', reference: 'ASP100', prix: 18000, stock: 150 }
  ];

  const filteredProducts = products.filter(product =>
    product.nom.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.reference.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const addOrderLine = (product: any) => {
    const newLine: OrderLine = {
      id: Date.now().toString(),
      produit: product.nom,
      reference: product.reference,
      quantite: 1,
      prixUnitaire: product.prix,
      remise: 0,
      total: product.prix
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

  const calculateTotals = () => {
    const sousTotal = orderLines.reduce((sum, line) => sum + line.total, 0);
    const tva = sousTotal * 0.18; // 18% TVA
    const totalGeneral = sousTotal + tva;
    return { sousTotal, tva, totalGeneral };
  };

  const { sousTotal, tva, totalGeneral } = calculateTotals();

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

          {searchProduct && filteredProducts.length > 0 && (
            <div className="border rounded-lg p-4 mb-4 bg-muted/50">
              <h4 className="font-medium mb-3">Produits trouvés :</h4>
              <div className="space-y-2">
                {filteredProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div>
                      <span className="font-medium">{product.nom}</span>
                      <span className="text-muted-foreground ml-2">({product.reference})</span>
                      <Badge variant="outline" className="ml-2">{product.prix.toLocaleString()} F CFA</Badge>
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
                placeholder="Instructions particulières, conditions de livraison, etc."
                rows={3}
              />
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder Brouillon
              </Button>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Envoyer Commande
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderForm;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Package, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: number;
  libelle_produit: string;
  stock_limite: number;
  stock_alerte: number;
  prix_achat: number;
  prix_vente_ht: number;
  tva: number;
  centime_additionnel: number;
  prix_vente_ttc: number;
  famille_produit_id?: number;
  rayon_produit_id?: number;
  id_produit_source?: number;
  quantite_unites_details_source?: number;
  niveau_detail: number;
  code_cip?: string;
  categorie_tarification_id?: number;
  date_enregistrement: string;
  date_modification: string;
  reference_agent_enregistrement_id?: number;
  reference_agent_modification_id?: number;
}

const ProductCatalog = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      libelle_produit: "Paracétamol 500mg",
      stock_limite: 50,
      stock_alerte: 10,
      prix_achat: 150.00,
      prix_vente_ht: 200.00,
      tva: 36.00,
      centime_additionnel: 4.00,
      prix_vente_ttc: 240.00,
      famille_produit_id: 1,
      rayon_produit_id: 1,
      niveau_detail: 1,
      code_cip: "3400930002001",
      categorie_tarification_id: 1,
      date_enregistrement: "2024-01-15T10:30:00Z",
      date_modification: "2024-01-15T10:30:00Z"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Filtres
  const [familleFilter, setFamilleFilter] = useState('');
  const [rayonFilter, setRayonFilter] = useState('');
  const [laboratoireFilter, setLaboratoireFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  
  const { toast } = useToast();

  // Données mock pour les filtres (à remplacer par les vraies données de la BDD)
  const familles = [
    { id: 1, libelle: 'Analgésiques' },
    { id: 2, libelle: 'Antibiotiques' },
    { id: 3, libelle: 'Vitamines' },
  ];

  const rayons = [
    { id: 1, libelle: 'Comptoir' },
    { id: 2, libelle: 'Prescription' },
    { id: 3, libelle: 'Parapharmacie' },
  ];

  const laboratoires = [
    { id: 1, libelle: 'Pfizer' },
    { id: 2, libelle: 'Sanofi' },
    { id: 3, libelle: 'GSK' },
  ];

  const form = useForm<Product>({
    defaultValues: {
      libelle_produit: '',
      stock_limite: 0,
      stock_alerte: 0,
      prix_achat: 0,
      prix_vente_ht: 0,
      tva: 0,
      centime_additionnel: 0,
      prix_vente_ttc: 0,
      niveau_detail: 1
    }
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code_cip?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFamille = !familleFilter || product.famille_produit_id?.toString() === familleFilter;
    const matchesRayon = !rayonFilter || product.rayon_produit_id?.toString() === rayonFilter;
    // Note: laboratoire_id n'existe pas encore dans le modèle Product, sera ajouté plus tard
    const matchesLaboratoire = !laboratoireFilter; // Pour l'instant, accepter tous
    const matchesStock = !stockFilter || 
      (stockFilter === 'faible' && product.stock_alerte <= 10) ||
      (stockFilter === 'normal' && product.stock_alerte > 10 && product.stock_alerte <= 50) ||
      (stockFilter === 'eleve' && product.stock_alerte > 50);
    
    return matchesSearch && matchesFamille && matchesRayon && matchesLaboratoire && matchesStock;
  });

  const clearFilters = () => {
    setFamilleFilter('');
    setRayonFilter('');
    setLaboratoireFilter('');
    setStockFilter('');
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts(products.filter(p => p.id !== productId));
    toast({
      title: "Produit supprimé",
      description: "Le produit a été supprimé avec succès.",
    });
  };

  const onSubmit = (data: Product) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...data, id: editingProduct.id } : p));
      toast({
        title: "Produit modifié",
        description: "Le produit a été modifié avec succès.",
      });
    } else {
      const newProduct = { ...data, id: Date.now() };
      setProducts([...products, newProduct]);
      toast({
        title: "Produit ajouté",
        description: "Le produit a été ajouté avec succès.",
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catalogue des Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtres
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel>Filtrer par famille</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {familles.map((famille) => (
                    <DropdownMenuItem 
                      key={famille.id} 
                      onClick={() => setFamilleFilter(famille.id.toString())}
                    >
                      {famille.libelle}
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filtrer par rayon</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {rayons.map((rayon) => (
                    <DropdownMenuItem 
                      key={rayon.id} 
                      onClick={() => setRayonFilter(rayon.id.toString())}
                    >
                      {rayon.libelle}
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filtrer par laboratoire</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {laboratoires.map((laboratoire) => (
                    <DropdownMenuItem 
                      key={laboratoire.id} 
                      onClick={() => setLaboratoireFilter(laboratoire.id.toString())}
                    >
                      {laboratoire.libelle}
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filtrer par stock</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStockFilter('faible')}>
                    Stock faible (≤ 10)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStockFilter('normal')}>
                    Stock normal (11-50)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStockFilter('eleve')}>
                    Stock élevé (&gt; 50)
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Effacer les filtres
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Produit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez tous les champs nécessaires pour le produit.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="libelle_produit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Libellé du produit *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom du produit" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="code_cip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code CIP</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Code CIP" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock_limite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock limite</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock_alerte"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock alerte</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prix_achat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix d'achat</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prix_vente_ht"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix de vente HT</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tva"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TVA</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="centime_additionnel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Centime additionnel</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prix_vente_ttc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix de vente TTC</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="niveau_detail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau de détail</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantite_unites_details_source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantité unités détails source</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="col-span-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingProduct ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Code CIP</TableHead>
                <TableHead>Prix achat</TableHead>
                <TableHead>Prix vente TTC</TableHead>
                <TableHead>Stock limite</TableHead>
                <TableHead>Stock alerte</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.libelle_produit}</TableCell>
                  <TableCell>{product.code_cip || '-'}</TableCell>
                  <TableCell>{product.prix_achat.toFixed(2)} XAF</TableCell>
                  <TableCell>{product.prix_vente_ttc.toFixed(2)} XAF</TableCell>
                  <TableCell>{product.stock_limite}</TableCell>
                  <TableCell>
                    <Badge variant={product.stock_alerte <= 10 ? "destructive" : "secondary"}>
                      {product.stock_alerte}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCatalog;
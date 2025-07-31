import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id?: string;
  tenant_id?: string;
  famille_id?: string;
  rayon_id?: string;
  dci_id?: string;
  categorie_tarification_id?: string;
  libelle_produit: string;
  description?: string;
  code_produit?: string;
  code_barre?: string;
  prix_achat?: number;
  prix_vente?: number;
  stock_limite?: number;
  stock_actuel?: number;
  unite_mesure?: string;
  laboratoire?: string;
  forme_pharmaceutique?: string;
  dosage?: string;
  is_active?: boolean;
}

interface FamilyProduct {
  id: string;
  libelle_famille: string;
}

interface RayonProduct {
  id: string;
  libelle_rayon: string;
}

interface DCI {
  id: string;
  nom_dci: string;
}

interface PricingCategory {
  id: string;
  libelle_categorie: string;
}

const ProductCatalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [familleFilter, setFamilleFilter] = useState('');
  const [rayonFilter, setRayonFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const { toast } = useToast();

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Fetch products
  const { data: products, isLoading, error } = useTenantQueryWithCache(
    ['products', searchTerm, familleFilter, rayonFilter, stockFilter],
    'produits',
    '*',
    {},
    { orderBy: { column: 'libelle_produit', ascending: true } }
  );

  // Fetch reference data
  const { data: familles } = useTenantQueryWithCache(['families'], 'famille_produit', '*');
  const { data: rayons } = useTenantQueryWithCache(['rayons'], 'rayons_produits', '*');
  const { data: dcis } = useTenantQueryWithCache(['dcis'], 'dci', '*');
  const { data: categories } = useTenantQueryWithCache(['categories'], 'categorie_tarification', '*');

  // Mutations
  const createMutation = useTenantMutation('produits', 'insert', {
    invalidateQueries: ['products'],
  });

  const updateMutation = useTenantMutation('produits', 'update', {
    invalidateQueries: ['products'],
  });

  const deleteMutation = useTenantMutation('produits', 'delete', {
    invalidateQueries: ['products'],
  });

  const form = useForm<Product>({
    defaultValues: {
      libelle_produit: '',
      description: '',
      code_produit: '',
      code_barre: '',
      prix_achat: 0,
      prix_vente: 0,
      stock_limite: 0,
      stock_actuel: 0,
      unite_mesure: 'Unité',
      laboratoire: '',
      forme_pharmaceutique: '',
      dosage: '',
      is_active: true,
    },
  });

  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.libelle_produit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code_produit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.laboratoire?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFamille = !familleFilter || product.famille_id === familleFilter;
    const matchesRayon = !rayonFilter || product.rayon_id === rayonFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = (product.stock_actuel || 0) <= (product.stock_limite || 0);
    } else if (stockFilter === 'out') {
      matchesStock = (product.stock_actuel || 0) === 0;
    }
    
    return matchesSearch && matchesFamille && matchesRayon && matchesStock;
  }) || [];

  const clearFilters = () => {
    setSearchTerm('');
    setFamilleFilter('');
    setRayonFilter('');
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

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  const handleDeleteProduct = (productId: string) => {
    deleteMutation.mutate({ id: productId }, {
      onSuccess: () => {
        toast({ title: 'Succès', description: 'Produit supprimé avec succès' });
      },
      onError: (error) => {
        toast({ title: 'Erreur', description: 'Erreur lors de la suppression : ' + error.message, variant: 'destructive' });
      },
    });
  };

  const onSubmit = (data: Product) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...data }, {
        onSuccess: () => {
          toast({ title: 'Succès', description: 'Produit modifié avec succès' });
          handleDialogClose();
        },
        onError: (error) => {
          toast({ title: 'Erreur', description: 'Erreur lors de la modification : ' + error.message, variant: 'destructive' });
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({ title: 'Succès', description: 'Produit ajouté avec succès' });
          handleDialogClose();
        },
        onError: (error) => {
          toast({ title: 'Erreur', description: 'Erreur lors de l\'ajout : ' + error.message, variant: 'destructive' });
        },
      });
    }
  };

  const getStockBadge = (product: Product) => {
    const stockActuel = product.stock_actuel || 0;
    const stockLimite = product.stock_limite || 0;
    
    if (stockActuel === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    } else if (stockActuel <= stockLimite) {
      return <Badge variant="outline">Stock bas</Badge>;
    } else {
      return <Badge variant="secondary">En stock</Badge>;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Catalogue Produits
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Produit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={familleFilter} onValueChange={setFamilleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Toutes les familles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les familles</SelectItem>
              {familles?.map((famille: FamilyProduct) => (
                <SelectItem key={famille.id} value={famille.id}>
                  {famille.libelle_famille}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={rayonFilter} onValueChange={setRayonFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les rayons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les rayons</SelectItem>
              {rayons?.map((rayon: RayonProduct) => (
                <SelectItem key={rayon.id} value={rayon.id}>
                  {rayon.libelle_rayon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les stocks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les stocks</SelectItem>
              <SelectItem value="low">Stock bas</SelectItem>
              <SelectItem value="out">Rupture</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Effacer filtres
          </Button>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Laboratoire</TableHead>
                <TableHead>Prix vente</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.libelle_produit}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.code_produit}</TableCell>
                  <TableCell>{product.laboratoire}</TableCell>
                  <TableCell>{product.prix_vente?.toFixed(2)} FCFA</TableCell>
                  <TableCell>
                    <div>{product.stock_actuel || 0} {product.unite_mesure}</div>
                    {getStockBadge(product)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
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
                        onClick={() => handleDeleteProduct(product.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="libelle_produit">Nom du produit *</Label>
                <Input
                  id="libelle_produit"
                  {...form.register('libelle_produit', { required: true })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                />
              </div>

              <div>
                <Label htmlFor="code_produit">Code produit</Label>
                <Input
                  id="code_produit"
                  {...form.register('code_produit')}
                />
              </div>

              <div>
                <Label htmlFor="code_barre">Code barre</Label>
                <Input
                  id="code_barre"
                  {...form.register('code_barre')}
                />
              </div>

              <div>
                <Label htmlFor="famille_id">Famille</Label>
                <Select onValueChange={(value) => form.setValue('famille_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une famille" />
                  </SelectTrigger>
                  <SelectContent>
                    {familles?.map((famille: FamilyProduct) => (
                      <SelectItem key={famille.id} value={famille.id}>
                        {famille.libelle_famille}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rayon_id">Rayon</Label>
                <Select onValueChange={(value) => form.setValue('rayon_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rayon" />
                  </SelectTrigger>
                  <SelectContent>
                    {rayons?.map((rayon: RayonProduct) => (
                      <SelectItem key={rayon.id} value={rayon.id}>
                        {rayon.libelle_rayon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="laboratoire">Laboratoire</Label>
                <Input
                  id="laboratoire"
                  {...form.register('laboratoire')}
                />
              </div>

              <div>
                <Label htmlFor="forme_pharmaceutique">Forme pharmaceutique</Label>
                <Input
                  id="forme_pharmaceutique"
                  {...form.register('forme_pharmaceutique')}
                />
              </div>

              <div>
                <Label htmlFor="prix_achat">Prix d'achat (FCFA)</Label>
                <Input
                  id="prix_achat"
                  type="number"
                  step="0.01"
                  {...form.register('prix_achat', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="prix_vente">Prix de vente (FCFA)</Label>
                <Input
                  id="prix_vente"
                  type="number"
                  step="0.01"
                  {...form.register('prix_vente', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="stock_limite">Stock limite</Label>
                <Input
                  id="stock_limite"
                  type="number"
                  {...form.register('stock_limite', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="stock_actuel">Stock actuel</Label>
                <Input
                  id="stock_actuel"
                  type="number"
                  {...form.register('stock_actuel', { valueAsNumber: true })}
                />
              </div>

              <DialogFooter className="col-span-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Modifier' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductCatalog;
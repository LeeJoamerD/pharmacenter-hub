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
import { Plus, Edit, Trash2, Search, Filter, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id?: string;
  tenant_id?: string;
  famille_id?: string;
  rayon_id?: string;
  dci_id?: string;
  categorie_tarification_id?: string;
  libelle_produit: string;
  code_produit?: string;
  code_cip?: string;
  laboratoire?: string;
  prix_achat?: number;
  prix_vente?: number;
  taux_tva?: number;
  stock_limite?: number;
  quantite_stock?: number;
  is_active?: boolean;
  id_produit_source?: string;
  quantite_unites_details_source?: number;
  niveau_detail?: number;
  created_at?: string;
  updated_at?: string;
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
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [familleFilter, setFamilleFilter] = useState("all");
  const [rayonFilter, setRayonFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sourceProduct, setSourceProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupération des données avec gestion des colonnes manquantes
  const { data: products = [], isLoading } = useTenantQueryWithCache(
    ['products'],
    'produits',
    'id, libelle_produit, code_produit, code_cip, laboratoire, prix_achat, prix_vente, taux_tva, stock_limite, quantite_stock, famille_id, rayon_id, dci_id, categorie_tarification_id, is_active, id_produit_source, quantite_unites_details_source, niveau_detail, created_at',
    { is_active: true }
  );

  const { data: families = [] } = useTenantQueryWithCache(
    ['families'],
    'famille_produit',
    'id, libelle_famille'
  );

  const { data: rayons = [] } = useTenantQueryWithCache(
    ['rayons'],
    'rayons_produits',
    'id, libelle_rayon'
  );

  const { data: categories = [] } = useTenantQueryWithCache(
    ['pricing-categories'],
    'categorie_tarification',
    'id, libelle_categorie'
  );

  const { data: dcis = [] } = useTenantQueryWithCache(
    ['dcis'],
    'dci',
    'id, nom_dci'
  );

  // Filtrage des produits
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFamille = !familleFilter || familleFilter === "all" || product.famille_id === familleFilter;
    const matchesRayon = !rayonFilter || rayonFilter === "all" || product.rayon_id === rayonFilter;
    
    let matchesStock = true;
    if (stockFilter && stockFilter !== "all") {
      if (stockFilter === "rupture") {
        matchesStock = (product.quantite_stock || 0) === 0;
      } else if (stockFilter === "faible") {
        matchesStock = (product.quantite_stock || 0) > 0 && (product.quantite_stock || 0) <= (product.stock_limite || 0);
      } else if (stockFilter === "normal") {
        matchesStock = (product.quantite_stock || 0) > (product.stock_limite || 0);
      }
    }
    
    return matchesSearch && matchesFamille && matchesRayon && matchesStock;
  });

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

  // Form setup
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Product>();
  const { register: registerDetail, handleSubmit: handleSubmitDetail, reset: resetDetail, formState: { errors: errorsDetail } } = useForm<{ quantite_unites_details_source: number }>();

  const clearFilters = () => {
    setSearchTerm("");
    setFamilleFilter("all");
    setRayonFilter("all");
    setStockFilter("all");
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    reset({
      libelle_produit: "",
      code_produit: "",
      laboratoire: "",
      prix_achat: 0,
      prix_vente: 0,
      taux_tva: 0,
      stock_limite: 0,
      quantite_stock: 0,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    reset(product);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    reset();
  };

  const handleDetailProduct = (product: Product) => {
    // Vérifier que c'est un produit source (niveau_detail = 1)
    if (product.niveau_detail !== 1) {
      toast({ 
        title: "Attention", 
        description: "Seuls les produits sources peuvent être détaillés", 
        variant: "destructive" 
      });
      return;
    }
    
    setSourceProduct(product);
    resetDetail({ quantite_unites_details_source: 1 });
    setIsDetailDialogOpen(true);
  };

  const handleDetailDialogClose = () => {
    setIsDetailDialogOpen(false);
    setSourceProduct(null);
    resetDetail();
  };

  const generateDetailProductData = (sourceProduct: Product, quantity: number) => {
    // Générer le nouveau code CIP
    const newCodeCip = sourceProduct.code_cip ? `${sourceProduct.code_cip}-1` : undefined;
    
    // Générer le nouveau nom avec (D)
    const newLibelle = `${sourceProduct.libelle_produit} (D)`;
    
    return {
      ...sourceProduct,
      id: undefined, // Nouveau produit
      libelle_produit: newLibelle,
      code_cip: newCodeCip,
      code_produit: newCodeCip, // Utiliser le même que code_cip
      id_produit_source: sourceProduct.id,
      quantite_unites_details_source: quantity,
      niveau_detail: 2, // Produit détail
      created_at: undefined,
      updated_at: undefined
    };
  };

  const handleDeleteProduct = (productId: string) => {
    deleteMutation.mutate({ id: productId }, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Produit supprimé avec succès" });
      },
      onError: (error) => {
        toast({ title: "Erreur", description: "Erreur lors de la suppression", variant: "destructive" });
      },
    });
  };

  const onSubmit = (data: Product) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...data }, {
        onSuccess: () => {
          toast({ title: "Succès", description: "Produit modifié avec succès" });
          handleDialogClose();
        },
        onError: (error) => {
          toast({ title: "Erreur", description: "Erreur lors de la modification", variant: "destructive" });
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({ title: "Succès", description: "Produit ajouté avec succès" });
          handleDialogClose();
        },
        onError: (error) => {
          toast({ title: "Erreur", description: "Erreur lors de l'ajout", variant: "destructive" });
        },
      });
    }
  };

  const onSubmitDetail = (data: { quantite_unites_details_source: number }) => {
    if (!sourceProduct) return;

    const detailProductData = generateDetailProductData(sourceProduct, data.quantite_unites_details_source);
    
    createMutation.mutate(detailProductData, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Produit détail créé avec succès" });
        handleDetailDialogClose();
      },
      onError: (error) => {
        toast({ title: "Erreur", description: "Erreur lors de la création du produit détail", variant: "destructive" });
      },
    });
  };

  const getStockBadge = (product: Product) => {
    const stock = product.quantite_stock || 0;
    const limite = product.stock_limite || 0;
    
    if (stock === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    } else if (stock <= limite) {
      return <Badge variant="secondary">Stock bas</Badge>;
    }
    return <Badge variant="default">En stock</Badge>;
  };

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
        {/* Filtres */}
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
              <SelectValue placeholder="Famille" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les familles</SelectItem>
              {families.map((family) => (
                <SelectItem key={family.id} value={family.id}>
                  {family.libelle_famille}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={rayonFilter} onValueChange={setRayonFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Rayon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rayons</SelectItem>
              {rayons.map((rayon) => (
                <SelectItem key={rayon.id} value={rayon.id}>
                  {rayon.libelle_rayon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="rupture">Rupture de stock</SelectItem>
              <SelectItem value="faible">Stock faible</SelectItem>
              <SelectItem value="normal">Stock normal</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Effacer filtres
          </Button>
        </div>

        {/* Tableau des produits */}
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <Table>
            <TableHeader>
               <TableRow>
                 <TableHead>Produit</TableHead>
                 <TableHead>Code CIP</TableHead>
                 <TableHead>Famille</TableHead>
                 <TableHead>Rayon</TableHead>
                 <TableHead>Laboratoire</TableHead>
                 <TableHead>Prix achat</TableHead>
                 <TableHead>Prix vente</TableHead>
                 <TableHead>Stock</TableHead>
                 <TableHead>Statut</TableHead>
                 <TableHead>Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                 <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">
                        {product.libelle_produit}
                        {product.niveau_detail === 2 && (
                          <Badge variant="secondary" className="ml-2">Détail</Badge>
                        )}
                      </div>
                    </TableCell>
                   <TableCell>{product.code_cip || product.code_produit || 'N/A'}</TableCell>
                   <TableCell>
                     {families.find(f => f.id === product.famille_id)?.libelle_famille || 'N/A'}
                   </TableCell>
                   <TableCell>
                     {rayons.find(r => r.id === product.rayon_id)?.libelle_rayon || 'N/A'}
                   </TableCell>
                   <TableCell>{product.laboratoire || 'N/A'}</TableCell>
                   <TableCell>{(product.prix_achat || 0).toLocaleString()} FCFA</TableCell>
                   <TableCell>{(product.prix_vente || 0).toLocaleString()} FCFA</TableCell>
                   <TableCell>
                     <div className="flex flex-col">
                       <span>{product.quantite_stock || 0}</span>
                       <span className="text-xs text-muted-foreground">
                         Limite: {product.stock_limite || 0}
                       </span>
                     </div>
                   </TableCell>
                   <TableCell>{getStockBadge(product)}</TableCell>
                   <TableCell>
                     <div className="flex space-x-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleEditProduct(product)}
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                       {product.niveau_detail === 1 && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleDetailProduct(product)}
                           title="Créer un produit détail"
                         >
                           <Layers className="h-4 w-4" />
                         </Button>
                       )}
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

        {/* Dialog d'ajout/modification */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="libelle_produit">Nom du produit *</Label>
                  <Input
                    id="libelle_produit"
                    {...register("libelle_produit", { required: "Le nom est requis" })}
                    placeholder="Nom du produit"
                  />
                  {errors.libelle_produit && (
                    <p className="text-sm text-destructive mt-1">{errors.libelle_produit.message}</p>
                  )}
                </div>

                 <div>
                   <Label htmlFor="code_cip">Code CIP</Label>
                   <Input
                     id="code_cip"
                     {...register("code_cip")}
                     placeholder="Code CIP"
                   />
                 </div>

                <div>
                  <Label htmlFor="famille_id">Famille</Label>
                  <Select onValueChange={(value) => setValue('famille_id', value)} value={watch('famille_id') || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une famille" />
                    </SelectTrigger>
                    <SelectContent>
                      {families.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          {family.libelle_famille}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rayon_id">Rayon</Label>
                  <Select onValueChange={(value) => setValue('rayon_id', value)} value={watch('rayon_id') || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rayon" />
                    </SelectTrigger>
                    <SelectContent>
                      {rayons.map((rayon) => (
                        <SelectItem key={rayon.id} value={rayon.id}>
                          {rayon.libelle_rayon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dci_id">DCI</Label>
                  <Select onValueChange={(value) => setValue('dci_id', value)} value={watch('dci_id') || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un DCI" />
                    </SelectTrigger>
                    <SelectContent>
                      {dcis.map((dci) => (
                        <SelectItem key={dci.id} value={dci.id}>
                          {dci.nom_dci}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categorie_tarification_id">Catégorie de tarification</Label>
                  <Select onValueChange={(value) => setValue('categorie_tarification_id', value)} value={watch('categorie_tarification_id') || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.libelle_categorie}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="laboratoire">Laboratoire</Label>
                  <Input
                    id="laboratoire"
                    {...register("laboratoire")}
                    placeholder="Laboratoire"
                  />
                </div>

                <div>
                  <Label htmlFor="prix_achat">Prix d'achat</Label>
                  <Input
                    id="prix_achat"
                    type="number"
                    step="0.01"
                    {...register("prix_achat", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="prix_vente">Prix de vente</Label>
                  <Input
                    id="prix_vente"
                    type="number"
                    step="0.01"
                    {...register("prix_vente", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="taux_tva">Taux TVA (%)</Label>
                  <Input
                    id="taux_tva"
                    type="number"
                    step="0.01"
                    {...register("taux_tva", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="stock_limite">Stock limite</Label>
                  <Input
                    id="stock_limite"
                    type="number"
                    {...register("stock_limite", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="quantite_stock">Quantité en stock</Label>
                  <Input
                    id="quantite_stock"
                    type="number"
                    {...register("quantite_stock", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => handleDialogClose()}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingProduct ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de création de produit détail */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer le détail d'un produit</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitDetail(onSubmitDetail)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="source_product">Nom du produit Source</Label>
                  <Input
                    id="source_product"
                    value={sourceProduct?.libelle_produit || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Ce champ est automatiquement rempli et ne peut pas être modifié
                  </p>
                </div>

                <div>
                  <Label htmlFor="detail_product">Nom du produit Détail</Label>
                  <Input
                    id="detail_product"
                    value={sourceProduct ? `${sourceProduct.libelle_produit} (D)` : ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Le nom du produit détail est généré automatiquement avec le suffixe "(D)"
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantite_unites_details_source">Quantité des articles Détails *</Label>
                  <Input
                    id="quantite_unites_details_source"
                    type="number"
                    min="1"
                    {...registerDetail("quantite_unites_details_source", { 
                      required: "La quantité est requise",
                      min: { value: 1, message: "La quantité doit être au moins 1" }
                    })}
                    placeholder="Entrez la quantité"
                  />
                  {errorsDetail.quantite_unites_details_source && (
                    <p className="text-sm text-destructive mt-1">
                      {errorsDetail.quantite_unites_details_source.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Nombre d'unités contenues dans le produit source
                  </p>
                </div>

                {sourceProduct && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Informations du produit détail</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Code CIP:</span>
                        <span className="ml-2">
                          {sourceProduct.code_cip ? `${sourceProduct.code_cip}-1` : "Non défini"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Famille:</span>
                        <span className="ml-2">
                          {families.find(f => f.id === sourceProduct.famille_id)?.libelle_famille || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rayon:</span>
                        <span className="ml-2">
                          {rayons.find(r => r.id === sourceProduct.rayon_id)?.libelle_rayon || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prix vente:</span>
                        <span className="ml-2">{(sourceProduct.prix_vente || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDetailDialogClose}>
                  Annuler
                </Button>
                <Button type="submit">
                  Créer le produit détail
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductCatalog;
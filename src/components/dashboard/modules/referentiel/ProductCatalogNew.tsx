import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useLaboratories } from '@/hooks/useLaboratories';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Edit, Trash2, Search, Filter, Settings, AlertTriangle, ExternalLink, Layers, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id?: string;
  tenant_id?: string;
  libelle_produit: string;
  code_cip?: string;
  famille_id?: string;
  rayon_id?: string;
  laboratoires_id?: string;
  dci_id?: string;
  categorie_tarification_id?: string;
  prix_achat?: number;
  prix_vente_ht?: number;
  prix_vente_ttc?: number;
  tva?: number;
  taux_tva?: number;
  centime_additionnel?: number;
  taux_centime_additionnel?: number;
  stock_limite?: number;
  stock_alerte?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Champs pour les produits détails
  id_produit_source?: string | null;
  quantite_unites_details_source?: number | null;
  niveau_detail?: number | null;
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

const ProductCatalogNew = () => {
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [familleFilter, setFamilleFilter] = useState("all");
  const [rayonFilter, setRayonFilter] = useState("all");
  const [dciFilter, setDciFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [isReferencesDialogOpen, setIsReferencesDialogOpen] = useState(false);
  const [referencesData, setReferencesData] = useState<any[]>([]);
  const [referencesProduct, setReferencesProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const { laboratories, loading: labLoading } = useLaboratories();
  const { personnel } = useAuth();
  const { createProductDetail } = useProducts();

  // Récupération des données
  const { data: products = [], isLoading } = useTenantQueryWithCache(
    ['products-catalog'],
    'produits', 
    `id, libelle_produit, code_cip, famille_id, rayon_id, laboratoires_id, 
     dci_id, categorie_tarification_id, prix_achat, prix_vente_ht, 
     prix_vente_ttc, tva, taux_tva, centime_additionnel, taux_centime_additionnel,
     stock_limite, stock_alerte, is_active, created_at,
     id_produit_source, quantite_unites_details_source, niveau_detail`,
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
  const filteredProducts = (() => {
    return products.filter((product) => {
      const matchesSearch = product.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.code_cip?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFamille = !familleFilter || familleFilter === "all" || product.famille_id === familleFilter;
      const matchesRayon = !rayonFilter || rayonFilter === "all" || product.rayon_id === rayonFilter;
      const matchesDci = dciFilter === "all" || product.dci_id === dciFilter;
      
      return matchesSearch && matchesFamille && matchesRayon && matchesDci;
    });
  })();

  // Mutations
  const createMutation = useTenantMutation('produits', 'insert', {
    invalidateQueries: ['products-catalog'],
  });

  const updateMutation = useTenantMutation('produits', 'update', {
    invalidateQueries: ['products-catalog'],
  });

  const deleteMutation = useTenantMutation('produits', 'delete', {
    invalidateQueries: ['products-catalog'],
  });

  // Mutation pour vérifier les duplicates CIP
  const { useTenantQueryWithCache: checkDuplicateCIP } = useTenantQuery();
  
  // Mutation pour vérifier les références
  const { useTenantQueryWithCache: checkReferences } = useTenantQuery();

  // Form setup simple sans calculs automatiques
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Product>();

  const clearFilters = () => {
    setSearchTerm("");
    setFamilleFilter("all");
    setRayonFilter("all");
    setDciFilter("all");
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    reset({
      libelle_produit: "",
      code_cip: "",
      prix_achat: 0,
      prix_vente_ht: 0,
      prix_vente_ttc: 0,
      stock_limite: 0,
      stock_alerte: 0,
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

  const checkForDuplicateCIP = async (codeCip: string, excludeId?: string): Promise<boolean> => {
    if (!codeCip || !personnel?.tenant_id) return false;
    
    try {
      const { data } = await supabase
        .from('produits')
        .select('id, is_active')
        .eq('code_cip', codeCip)
        .eq('tenant_id', personnel.tenant_id);
      
      const duplicates = data?.filter(p => p.id !== excludeId) || [];
      return duplicates.length > 0;
    } catch (error) {
      console.error('Error checking duplicate CIP:', error);
      return false;
    }
  };

  const checkProductReferences = async (productId: string): Promise<any[]> => {
    if (!personnel?.tenant_id) return [];
    
    try {
      const references = [];
      
      // Vérifier les références dans lignes_commande_fournisseur
      const { data: commandeRefs } = await supabase
        .from('lignes_commande_fournisseur')
        .select('id, commande_id')
        .eq('produit_id', productId)
        .eq('tenant_id', personnel.tenant_id);
      
      if (commandeRefs?.length) {
        references.push({
          table: 'Commandes Fournisseur',
          count: commandeRefs.length,
          details: commandeRefs
        });
      }

      // Vérifier autres références si nécessaire
      const { data: ventesRefs } = await supabase
        .from('lignes_ventes')
        .select('id, vente_id')
        .eq('produit_id', productId)
        .eq('tenant_id', personnel.tenant_id);
      
      if (ventesRefs?.length) {
        references.push({
          table: 'Lignes de Ventes',
          count: ventesRefs.length,
          details: ventesRefs
        });
      }

      return references;
    } catch (error) {
      console.error('Error checking product references:', error);
      return [];
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    // Vérifier les références
    const references = await checkProductReferences(product.id!);
    
    if (references.length > 0) {
      // Si des références existent, proposer désactivation
      setReferencesData(references);
      setReferencesProduct(product);
      setIsReferencesDialogOpen(true);
    } else {
      // Si pas de références, suppression directe
      deleteMutation.mutate({ id: product.id }, {
        onSuccess: () => {
          toast({ title: "Succès", description: "Produit supprimé avec succès" });
        },
        onError: (error) => {
          toast({ title: "Erreur", description: "Erreur lors de la suppression", variant: "destructive" });
        },
      });
    }
  };

  const handleDeactivateProduct = (productId: string) => {
    updateMutation.mutate({ id: productId, is_active: false }, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Produit désactivé avec succès" });
        setIsReferencesDialogOpen(false);
      },
      onError: (error) => {
        toast({ title: "Erreur", description: "Erreur lors de la désactivation", variant: "destructive" });
      },
    });
  };

  const handleCreateDetails = (product: Product) => {
    setDetailsProduct(product);
    setDetailQuantity(1);
    setIsDetailsDialogOpen(true);
  };

  const handleSubmitDetail = async () => {
    if (!detailsProduct || !detailsProduct.id || detailQuantity < 1) {
      toast({
        title: "Erreur de validation",
        description: "Données de produit invalides ou quantité insuffisante",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProductDetail(detailsProduct as any, detailQuantity);
      setIsDetailsDialogOpen(false);
      setDetailsProduct(null);
      setDetailQuantity(1);
    } catch (error) {
      // L'erreur est déjà gérée dans createProductDetail avec un toast
      console.error('Erreur lors de la création du détail:', error);
    }
  };

  const onSubmit = async (data: Product) => {
    // Vérifier les duplicates CIP avant soumission
    const hasDuplicate = await checkForDuplicateCIP(data.code_cip!, editingProduct?.id);
    
    if (hasDuplicate) {
      toast({ 
        title: "Code CIP déjà utilisé", 
        description: "Ce code CIP existe déjà pour un autre produit actif", 
        variant: "destructive" 
      });
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...data }, {
        onSuccess: () => {
          toast({ title: "Succès", description: "Produit modifié avec succès" });
          handleDialogClose();
        },
        onError: (error) => {
          const errorMessage = error?.message || "Erreur lors de la modification";
          if (errorMessage.includes('duplicate key')) {
            toast({ title: "Code CIP déjà utilisé", description: "Ce code CIP existe déjà", variant: "destructive" });
          } else {
            toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
          }
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({ title: "Succès", description: "Produit ajouté avec succès" });
          handleDialogClose();
        },
        onError: (error) => {
          const errorMessage = error?.message || "Erreur lors de l'ajout";
          if (errorMessage.includes('duplicate key')) {
            toast({ title: "Code CIP déjà utilisé", description: "Ce code CIP existe déjà", variant: "destructive" });
          } else {
            toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
          }
        },
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Catalogue des Produits
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

          <Select value={dciFilter} onValueChange={setDciFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="DCI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les DCI</SelectItem>
              {dcis.map((dci) => (
                <SelectItem key={dci.id} value={dci.id}>
                  {dci.nom_dci}
                </SelectItem>
              ))}
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
                  <TableHead>Niveau</TableHead>
                  <TableHead>Famille / Rayon</TableHead>
                  <TableHead>Prix achat</TableHead>
                  <TableHead>Prix vente TTC</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {product.libelle_produit}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {laboratories.find(l => l.id === product.laboratoires_id)?.libelle || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                     <TableCell>{product.code_cip || 'N/A'}</TableCell>
                     <TableCell>
                       {product.niveau_detail && product.niveau_detail > 1 && (
                         <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                           Détail {product.niveau_detail}
                         </span>
                       )}
                     </TableCell>
                     <TableCell>
                       <div>
                         <div className="font-medium">
                           {families.find(f => f.id === product.famille_id)?.libelle_famille || 'N/A'}
                         </div>
                         <div className="text-sm text-muted-foreground">
                           {rayons.find(r => r.id === product.rayon_id)?.libelle_rayon || 'N/A'}
                         </div>
                       </div>
                     </TableCell>
                    <TableCell>{(product.prix_achat || 0).toLocaleString()} FCFA</TableCell>
                    <TableCell>{(product.prix_vente_ttc || 0).toLocaleString()} FCFA</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          Limite: {product.stock_limite || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Alerte: {product.stock_alerte || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                         {(product.niveau_detail ?? 1) < 3 && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleCreateDetails(product)}
                             title="Créer détails"
                           >
                             <Layers className="h-4 w-4" />
                           </Button>
                         )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                          title="Supprimer"
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Modifiez les informations du produit" : "Saisissez les informations du nouveau produit"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Informations principales - 2 colonnes */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="libelle_produit">Libellé Produit *</Label>
                    <Input
                      id="libelle_produit"
                      {...register("libelle_produit", { required: "Le libellé est requis" })}
                      placeholder="Nom du produit"
                    />
                    {errors.libelle_produit && (
                      <p className="text-sm text-destructive mt-1">{errors.libelle_produit.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="code_cip">Code CIP *</Label>
                    <Input
                      id="code_cip"
                      {...register("code_cip", { required: "Le code CIP est requis" })}
                      placeholder="Code CIP"
                    />
                    {errors.code_cip && (
                      <p className="text-sm text-destructive mt-1">{errors.code_cip.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="stock_limite">Limite de stock</Label>
                    <Input
                      id="stock_limite"
                      type="number"
                      {...register("stock_limite", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock_alerte">Alerte boursière</Label>
                    <Input
                      id="stock_alerte"
                      type="number"
                      {...register("stock_alerte", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="famille_id">Famille Produit</Label>
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
                    <Label htmlFor="rayon_id">Rayon Produit</Label>
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
                    <Label htmlFor="categorie_tarification_id">Catégorie Tarification *</Label>
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
                    <Label htmlFor="laboratoires_id">Laboratoire</Label>
                    <Select onValueChange={(value) => setValue('laboratoires_id', value)} value={watch('laboratoires_id') || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un laboratoire" />
                      </SelectTrigger>
                      <SelectContent>
                        {laboratories.map((lab) => (
                          <SelectItem key={lab.id} value={lab.id}>
                            {lab.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Prix - en ligne avec le texte explicatif */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">Tarifs</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Les prix seront calculés à l'approvisionnement, ici la modification des prix est facultative.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="prix_achat">Prix d'achat HT (FCFA)</Label>
                    <Input
                      id="prix_achat"
                      type="number"
                      step="0.01"
                      {...register("prix_achat", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="prix_vente_ht">Prix de vente HT (FCFA)</Label>
                    <Input
                      id="prix_vente_ht"
                      type="number"
                      step="0.01"
                      {...register("prix_vente_ht", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="prix_vente_ttc">Prix de vente TTC (FCFA)</Label>
                    <Input
                      id="prix_vente_ttc"
                      type="number"
                      step="0.01"
                      {...register("prix_vente_ttc", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-6 border-t">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingProduct ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Créer le détail d'un produit */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer le détail d'un produit</DialogTitle>
              <DialogDescription>
                Crée un produit de niveau {((detailsProduct?.niveau_detail ?? 1) + 1)} à partir du produit source.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="source-name">Nom du produit Source</Label>
                <Input
                  id="source-name"
                  value={detailsProduct?.libelle_produit || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="detail-name">Nom du produit Détail</Label>
                <Input
                  id="detail-name"
                  value={detailsProduct ? `${detailsProduct.libelle_produit} (D)` : ''}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="detail-quantity">Quantité des articles Détails *</Label>
                <Input
                  id="detail-quantity"
                  type="number"
                  min="1"
                  value={detailQuantity}
                  onChange={(e) => setDetailQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Quantité requise"
                  required
                />
              </div>

              {detailsProduct?.code_cip && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>CIP Source:</strong> {detailsProduct.code_cip}</p>
                  <p><strong>CIP Détail:</strong> {(() => {
                    const newLevel = (detailsProduct.niveau_detail ?? 1) + 1;
                    if (newLevel === 3) {
                      // Pour niveau 3, calculer le CIP racine
                      const rootCip = detailsProduct.code_cip.replace(/\s*-\s*\d+$/, '');
                      return `${rootCip} - 3`;
                    }
                    return `${detailsProduct.code_cip} - ${newLevel}`;
                  })()}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmitDetail} disabled={detailQuantity < 1}>
                  Créer le détail
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Voir références */}
        <Dialog open={isReferencesDialogOpen} onOpenChange={setIsReferencesDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Produit référencé - {referencesProduct?.libelle_produit}
              </DialogTitle>
              <DialogDescription>
                Ce produit est référencé dans d'autres tables et ne peut pas être supprimé directement
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Références trouvées :</h3>
                <div className="space-y-2">
                  {referencesData.map((ref, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{ref.table}</span>
                      <span className="font-semibold">{ref.count} référence(s)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Options disponibles :</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Désactiver</strong> : Le produit sera masqué mais les données historiques préservées</li>
                  <li>• <strong>Voir détails</strong> : Consulter les références avant de prendre une décision</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReferencesDialogOpen(false)}
                >
                  Annuler
                </Button>
                <div className="space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Ici on pourrait ouvrir un autre dialog avec les détails
                      toast({ title: "Information", description: "Fonctionnalité à venir" });
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir détails
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => handleDeactivateProduct(referencesProduct?.id!)}
                  >
                    Désactiver le produit
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductCatalogNew;
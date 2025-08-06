import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useLaboratories } from '@/hooks/useLaboratories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  libelle_produit: string;
  code_cip?: string;
  famille_id?: string;
  rayon_id?: string;
  laboratoires_id?: string;
  dci_id?: string;
  categorie_tarification_id?: string;
  prix_achat?: number;
  prix_vente_ht?: number;
  tva?: number;
  centime_additionnel?: number;
  prix_vente_ttc?: number;
  taux_tva?: number;
  taux_centime_additionnel?: number;
  stock_limite?: number;
  stock_alerte?: number;
  description?: string;
  posologie?: string;
  contre_indications?: string;
  effets_secondaires?: string;
  forme_pharmaceutique?: string;
  dosage?: string;
  conditionnement?: string;
  is_active?: boolean;
  is_detail?: boolean;
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

const ProductCatalogNew = () => {
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [familleFilter, setFamilleFilter] = useState("all");
  const [rayonFilter, setRayonFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [detailFilter, setDetailFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const { laboratories, loading: labLoading } = useLaboratories();

  // Récupération des données avec les nouvelles colonnes
  const { data: products = [], isLoading } = useTenantQueryWithCache(
    ['products-v3'],
    'produits', 
    `id, libelle_produit, code_cip, famille_id, rayon_id, laboratoires_id, 
     dci_id, categorie_tarification_id, prix_achat, prix_vente_ht, tva, 
     centime_additionnel, prix_vente_ttc, taux_tva, taux_centime_additionnel,
     stock_limite, stock_alerte, description, posologie, contre_indications,
     effets_secondaires, forme_pharmaceutique, dosage, conditionnement,
     is_active, id_produit_source, quantite_unites_details_source, niveau_detail, created_at`,
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
    const matchesSearch = product.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.code_cip?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFamille = !familleFilter || familleFilter === "all" || product.famille_id === familleFilter;
    const matchesRayon = !rayonFilter || rayonFilter === "all" || product.rayon_id === rayonFilter;
    
    // Filtre pour les produits détails
    let matchesDetail = true;
    if (detailFilter && detailFilter !== "all") {
      if (detailFilter === "non_details") {
        matchesDetail = (product.niveau_detail || 1) === 1;
      } else if (detailFilter === "details") {
        matchesDetail = (product.niveau_detail || 1) > 1;
      }
    }
    
    return matchesSearch && matchesFamille && matchesRayon && matchesDetail;
  });

  // Mutations
  const createMutation = useTenantMutation('produits', 'insert', {
    invalidateQueries: ['products-v3'],
  });

  const updateMutation = useTenantMutation('produits', 'update', {
    invalidateQueries: ['products-v3'],
  });

  const deleteMutation = useTenantMutation('produits', 'delete', {
    invalidateQueries: ['products-v3'],
  });

  // Form setup avec calcul automatique des prix
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Product>();
  
  // Watchers pour le calcul automatique
  const watchedPrixAchat = watch('prix_achat');
  const watchedPrixVenteHT = watch('prix_vente_ht');
  const watchedTauxTVA = watch('taux_tva');
  const watchedTauxCentimeAdditionnel = watch('taux_centime_additionnel');

  // Calcul automatique des prix
  useEffect(() => {
    const prixVenteHT = watchedPrixVenteHT || 0;
    const tauxTVA = watchedTauxTVA || 0;
    const tauxCentime = watchedTauxCentimeAdditionnel || 0;

    if (prixVenteHT > 0) {
      // Calcul TVA
      const tva = (prixVenteHT * tauxTVA) / 100;
      setValue('tva', Number(tva.toFixed(2)));
      
      // Calcul Centime additionnel
      const centimeAdditionnel = (tva * tauxCentime) / 100;
      setValue('centime_additionnel', Number(centimeAdditionnel.toFixed(2)));
      
      // Calcul Prix TTC
      const prixTTC = prixVenteHT + tva + centimeAdditionnel;
      setValue('prix_vente_ttc', Number(prixTTC.toFixed(2)));
    }
  }, [watchedPrixVenteHT, watchedTauxTVA, watchedTauxCentimeAdditionnel, setValue]);

  const clearFilters = () => {
    setSearchTerm("");
    setFamilleFilter("all");
    setRayonFilter("all");
    setStockFilter("all");
    setDetailFilter("all");
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    reset({
      libelle_produit: "",
      code_cip: "",
      prix_achat: 0,
      prix_vente_ht: 0,
      tva: 0,
      centime_additionnel: 0,
      prix_vente_ttc: 0,
      taux_tva: 19.25, // Défaut TVA Cameroun
      taux_centime_additionnel: 0,
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

          <Select value={detailFilter} onValueChange={setDetailFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type de produit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les produits</SelectItem>
              <SelectItem value="non_details">Non détails</SelectItem>
              <SelectItem value="details">Détails</SelectItem>
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
                 <TableHead>Prix vente TTC</TableHead>
                 <TableHead>Stock</TableHead>
                 <TableHead>Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                 <TableRow key={product.id}>
                     <TableCell>
                       <div className="font-medium">
                         {product.libelle_produit}
                         {(product.niveau_detail || 1) > 1 && (
                           <Badge variant="secondary" className="ml-2">
                             <Layers className="h-3 w-3 mr-1" />
                             Détail N{product.niveau_detail}
                           </Badge>
                         )}
                       </div>
                     </TableCell>
                   <TableCell>{product.code_cip || 'N/A'}</TableCell>
                   <TableCell>
                     {families.find(f => f.id === product.famille_id)?.libelle_famille || 'N/A'}
                   </TableCell>
                   <TableCell>
                     {rayons.find(r => r.id === product.rayon_id)?.libelle_rayon || 'N/A'}
                   </TableCell>
                   <TableCell>
                     {laboratories.find(l => l.id === product.laboratoires_id)?.libelle || 'N/A'}
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

        {/* Dialog d'ajout/modification - Structure selon l'image */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Informations générales - 2 colonnes */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
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
                    <Label htmlFor="forme_pharmaceutique">Forme pharmaceutique</Label>
                    <Input
                      id="forme_pharmaceutique"
                      {...register("forme_pharmaceutique")}
                      placeholder="Ex: Comprimé, Gélule, Sirop..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      {...register("dosage")}
                      placeholder="Ex: 500mg, 250ml..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="conditionnement">Conditionnement</Label>
                    <Input
                      id="conditionnement"
                      {...register("conditionnement")}
                      placeholder="Ex: Boîte de 20, Flacon de 100ml..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
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
                </div>
              </div>

              {/* Section 2: Prix - 4 colonnes */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Tarification</h3>
                <div className="grid grid-cols-4 gap-4">
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
                    <Label htmlFor="taux_tva">Taux TVA (%)</Label>
                    <Input
                      id="taux_tva"
                      type="number"
                      step="0.01"
                      {...register("taux_tva", { valueAsNumber: true })}
                      placeholder="19.25"
                    />
                  </div>

                  <div>
                    <Label htmlFor="taux_centime_additionnel">Taux Centime Additionnel (%)</Label>
                    <Input
                      id="taux_centime_additionnel"
                      type="number"
                      step="0.01"
                      {...register("taux_centime_additionnel", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Section calculée - lecture seule */}
                <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label>TVA calculée (FCFA)</Label>
                    <Input
                      value={(watch('tva') || 0).toFixed(2)}
                      disabled
                      className="bg-background"
                    />
                  </div>

                  <div>
                    <Label>Centime Additionnel calculé (FCFA)</Label>
                    <Input
                      value={(watch('centime_additionnel') || 0).toFixed(2)}
                      disabled
                      className="bg-background"
                    />
                  </div>

                  <div>
                    <Label>Prix de vente TTC (FCFA)</Label>
                    <Input
                      value={(watch('prix_vente_ttc') || 0).toFixed(2)}
                      disabled
                      className="bg-background font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Stock - 2 colonnes */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Gestion de stock</h3>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="stock_alerte">Stock d'alerte</Label>
                    <Input
                      id="stock_alerte"
                      type="number"
                      {...register("stock_alerte", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Informations médicales */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Informations médicales</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Description du produit..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="posologie">Posologie</Label>
                      <Textarea
                        id="posologie"
                        {...register("posologie")}
                        placeholder="Instructions de dosage..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="contre_indications">Contre-indications</Label>
                      <Textarea
                        id="contre_indications"
                        {...register("contre_indications")}
                        placeholder="Contre-indications..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="effets_secondaires">Effets secondaires</Label>
                      <Textarea
                        id="effets_secondaires"
                        {...register("effets_secondaires")}
                        placeholder="Effets secondaires possibles..."
                        rows={3}
                      />
                    </div>
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
      </CardContent>
    </Card>
  );
};

export default ProductCatalogNew;
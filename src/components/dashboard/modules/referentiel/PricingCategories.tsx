import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface PricingCategory {
  id: string;
  tenant_id: string;
  libelle_categorie: string;
  taux_tva: number;
  taux_centime_additionnel: number;
  coefficient_prix_vente: number;
  created_at: string;
  updated_at: string;
}

const PricingCategories = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  // Fetch categories from database
  const { data: categories = [], isLoading, error } = useTenantQueryWithCache(
    ['pricing-categories'],
    'categorie_tarification',
    '*',
    {},
    { orderBy: { column: 'libelle_categorie', ascending: true } }
  );

  // Mutations
  const createCategory = useTenantMutation('categorie_tarification', 'insert', {
    onSuccess: () => {
      toast({
        title: "Catégorie ajoutée",
        description: "La catégorie de tarification a été ajoutée avec succès.",
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'ajout: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateCategory = useTenantMutation('categorie_tarification', 'update', {
    onSuccess: () => {
      toast({
        title: "Catégorie modifiée",
        description: "La catégorie de tarification a été modifiée avec succès.",
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la modification: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteCategory = useTenantMutation('categorie_tarification', 'delete', {
    onSuccess: () => {
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie de tarification a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PricingCategory | null>(null);
  const { toast } = useToast();

  const form = useForm<Partial<PricingCategory>>({
    defaultValues: {
      libelle_categorie: '',
      taux_tva: 0,
      taux_centime_additionnel: 0,
      coefficient_prix_vente: 0
    }
  });

  const filteredCategories = categories.filter(category =>
    category.libelle_categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.reset({
      libelle_categorie: '',
      taux_tva: 0,
      taux_centime_additionnel: 0,
      coefficient_prix_vente: 0
    });
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: PricingCategory) => {
    setEditingCategory(category);
    form.reset(category);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory.mutate({
      filters: { id: { eq: categoryId } }
    });
  };

  const onSubmit = (data: Partial<PricingCategory>) => {
    if (editingCategory) {
      updateCategory.mutate({
        filters: { id: { eq: editingCategory.id } },
        data: {
          libelle_categorie: data.libelle_categorie!,
          taux_tva: data.taux_tva!,
          taux_centime_additionnel: data.taux_centime_additionnel!,
          coefficient_prix_vente: data.coefficient_prix_vente!
        }
      });
    } else {
      createCategory.mutate({
        data: {
          libelle_categorie: data.libelle_categorie!,
          taux_tva: data.taux_tva!,
          taux_centime_additionnel: data.taux_centime_additionnel!,
          coefficient_prix_vente: data.coefficient_prix_vente!
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestion des Catégories de Tarification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Catégorie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Modifier la catégorie' : 'Ajouter une nouvelle catégorie'}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez les paramètres de tarification pour cette catégorie.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="libelle_categorie"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Libellé de la catégorie *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Médicaments essentiels" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taux_tva"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux TVA (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taux_centime_additionnel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux centime additionnel (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coefficient_prix_vente"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Coefficient prix de vente</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="col-span-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingCategory ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Erreur: {error.message}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Taux TVA (%)</TableHead>
                  <TableHead>Taux centime add. (%)</TableHead>
                  <TableHead>Coefficient prix vente</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Aucune catégorie trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.libelle_categorie}</TableCell>
                      <TableCell>{category.taux_tva?.toFixed(2)}%</TableCell>
                      <TableCell>{category.taux_centime_additionnel?.toFixed(2)}%</TableCell>
                      <TableCell>{category.coefficient_prix_vente?.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingCategories;
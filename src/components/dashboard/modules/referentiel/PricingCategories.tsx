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

interface PricingCategory {
  id: number;
  libelle_categorie: string;
  taux_tva: number;
  taux_centime_additionnel: number;
  coefficient_prix_vente: number;
}

const PricingCategories = () => {
  const [categories, setCategories] = useState<PricingCategory[]>([
    {
      id: 1,
      libelle_categorie: "Médicaments essentiels",
      taux_tva: 18.00,
      taux_centime_additionnel: 2.00,
      coefficient_prix_vente: 1.30
    },
    {
      id: 2,
      libelle_categorie: "Dispositifs médicaux",
      taux_tva: 18.00,
      taux_centime_additionnel: 1.50,
      coefficient_prix_vente: 1.25
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PricingCategory | null>(null);
  const { toast } = useToast();

  const form = useForm<PricingCategory>({
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
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: PricingCategory) => {
    setEditingCategory(category);
    form.reset(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    setCategories(categories.filter(c => c.id !== categoryId));
    toast({
      title: "Catégorie supprimée",
      description: "La catégorie de tarification a été supprimée avec succès.",
    });
  };

  const onSubmit = (data: PricingCategory) => {
    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...data, id: editingCategory.id } : c));
      toast({
        title: "Catégorie modifiée",
        description: "La catégorie de tarification a été modifiée avec succès.",
      });
    } else {
      const newCategory = { ...data, id: Date.now() };
      setCategories([...categories, newCategory]);
      toast({
        title: "Catégorie ajoutée",
        description: "La catégorie de tarification a été ajoutée avec succès.",
      });
    }
    setIsDialogOpen(false);
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
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.libelle_categorie}</TableCell>
                  <TableCell>{category.taux_tva.toFixed(2)}%</TableCell>
                  <TableCell>{category.taux_centime_additionnel.toFixed(2)}%</TableCell>
                  <TableCell>{category.coefficient_prix_vente.toFixed(2)}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingCategories;
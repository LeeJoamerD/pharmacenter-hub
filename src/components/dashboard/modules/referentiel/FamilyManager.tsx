import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Grid3X3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FamilyProduct {
  id: number;
  libelle_famille: string;
}

const FamilyManager = () => {
  const [families, setFamilies] = useState<FamilyProduct[]>([
    { id: 1, libelle_famille: "Médicaments génériques" },
    { id: 2, libelle_famille: "Dispositifs médicaux" },
    { id: 3, libelle_famille: "Compléments alimentaires" },
    { id: 4, libelle_famille: "Produits d'hygiène" }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<FamilyProduct | null>(null);
  const { toast } = useToast();

  const form = useForm<FamilyProduct>({
    defaultValues: {
      libelle_famille: ''
    }
  });

  const filteredFamilies = families.filter(family =>
    family.libelle_famille.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFamily = () => {
    setEditingFamily(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditFamily = (family: FamilyProduct) => {
    setEditingFamily(family);
    form.reset(family);
    setIsDialogOpen(true);
  };

  const handleDeleteFamily = (familyId: number) => {
    setFamilies(families.filter(f => f.id !== familyId));
    toast({
      title: "Famille supprimée",
      description: "La famille de produits a été supprimée avec succès.",
    });
  };

  const onSubmit = (data: FamilyProduct) => {
    if (editingFamily) {
      setFamilies(families.map(f => f.id === editingFamily.id ? { ...data, id: editingFamily.id } : f));
      toast({
        title: "Famille modifiée",
        description: "La famille de produits a été modifiée avec succès.",
      });
    } else {
      const newFamily = { ...data, id: Date.now() };
      setFamilies([...families, newFamily]);
      toast({
        title: "Famille ajoutée",
        description: "La famille de produits a été ajoutée avec succès.",
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Gestion des Familles de Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une famille..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddFamily}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Famille
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingFamily ? 'Modifier la famille' : 'Ajouter une nouvelle famille'}
                  </DialogTitle>
                  <DialogDescription>
                    Saisissez le libellé de la famille de produits.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="libelle_famille"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Libellé de la famille *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Médicaments génériques" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingFamily ? 'Modifier' : 'Ajouter'}
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
                <TableHead>ID</TableHead>
                <TableHead>Libellé de la famille</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFamilies.map((family) => (
                <TableRow key={family.id}>
                  <TableCell>{family.id}</TableCell>
                  <TableCell className="font-medium">{family.libelle_famille}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditFamily(family)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFamily(family.id)}
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

export default FamilyManager;
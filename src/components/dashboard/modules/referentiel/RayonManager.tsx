import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface RayonProduct {
  id: string;
  tenant_id: string;
  libelle_rayon: string;
  created_at: string;
  updated_at: string;
}

const RayonManager = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  // Fetch rayons from database
  const { data: rayons = [], isLoading, error } = useTenantQueryWithCache(
    ['rayons'],
    'rayons_produits',
    '*',
    {},
    { orderBy: { column: 'libelle_rayon', ascending: true } }
  );

  // Mutations
  const createRayon = useTenantMutation('rayons_produits', 'insert', {
    onSuccess: () => {
      toast({
        title: "Rayon ajouté",
        description: "Le rayon de produits a été ajouté avec succès.",
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

  const updateRayon = useTenantMutation('rayons_produits', 'update', {
    onSuccess: () => {
      toast({
        title: "Rayon modifié",
        description: "Le rayon de produits a été modifié avec succès.",
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

  const deleteRayon = useTenantMutation('rayons_produits', 'delete', {
    onSuccess: () => {
      toast({
        title: "Rayon supprimé",
        description: "Le rayon de produits a été supprimé avec succès.",
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
  const [editingRayon, setEditingRayon] = useState<RayonProduct | null>(null);
  const { toast } = useToast();

  const form = useForm<Partial<RayonProduct>>({
    defaultValues: {
      libelle_rayon: ''
    }
  });

  const filteredRayons = rayons.filter(rayon =>
    rayon.libelle_rayon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRayon = () => {
    setEditingRayon(null);
    form.reset({ libelle_rayon: '' });
    setIsDialogOpen(true);
  };

  const handleEditRayon = (rayon: RayonProduct) => {
    setEditingRayon(rayon);
    form.reset(rayon);
    setIsDialogOpen(true);
  };

  const handleDeleteRayon = (rayonId: string) => {
    deleteRayon.mutate({
      filters: { id: { eq: rayonId } }
    });
  };

  const onSubmit = (data: Partial<RayonProduct>) => {
    if (editingRayon) {
      updateRayon.mutate({
        filters: { id: { eq: editingRayon.id } },
        data: { libelle_rayon: data.libelle_rayon! }
      });
    } else {
      createRayon.mutate({
        data: { libelle_rayon: data.libelle_rayon! }
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Gestion des Rayons de Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un rayon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddRayon}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Rayon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRayon ? 'Modifier le rayon' : 'Ajouter un nouveau rayon'}
                  </DialogTitle>
                  <DialogDescription>
                    Saisissez le libellé du rayon de produits.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="libelle_rayon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Libellé du rayon *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Prescription médicale" />
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
                        {editingRayon ? 'Modifier' : 'Ajouter'}
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
                  <TableHead>Libellé du rayon</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRayons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      Aucun rayon trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRayons.map((rayon) => (
                    <TableRow key={rayon.id}>
                      <TableCell className="font-medium">{rayon.libelle_rayon}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRayon(rayon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRayon(rayon.id)}
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

export default RayonManager;
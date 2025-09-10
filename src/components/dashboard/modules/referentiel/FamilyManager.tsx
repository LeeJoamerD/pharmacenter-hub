import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface FamilyProduct {
  id: string;
  tenant_id: string;
  libelle_famille: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const FamilyManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<FamilyProduct | null>(null);

  // Hook pour les données avec useTenantQuery
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  const {
    data: families = [],
    isLoading,
    error,
    refetch
  } = useTenantQueryWithCache(
    ['famille_produit'],
    'famille_produit',
    '*',
    undefined,
    { orderBy: { column: 'libelle_famille', ascending: true } }
  );

  const createMutation = useTenantMutation('famille_produit', 'insert', {
    invalidateQueries: ['famille_produit']
  });

  const updateMutation = useTenantMutation('famille_produit', 'update', {
    invalidateQueries: ['famille_produit']
  });

  const deleteMutation = useTenantMutation('famille_produit', 'delete', {
    invalidateQueries: ['famille_produit']
  });

  const form = useForm<FamilyProduct>({
    defaultValues: {
      libelle_famille: '',
      description: ''
    }
  });

  const filteredFamilies = families.filter(family =>
    family.libelle_famille.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFamily = () => {
    setEditingFamily(null);
    form.reset({ libelle_famille: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleEditFamily = (family: FamilyProduct) => {
    setEditingFamily(family);
    form.reset(family);
    setIsDialogOpen(true);
  };

  const handleDeleteFamily = (familyId: string) => {
    deleteMutation.mutate({ id: familyId }, {
      onSuccess: () => {
        toast.success('Famille supprimée avec succès');
      },
      onError: (error) => {
        toast.error('Erreur lors de la suppression');
        console.error('Erreur:', error);
      }
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingFamily(null);
    form.reset();
  };

  const onSubmit = (data: FamilyProduct) => {
    if (editingFamily) {
      updateMutation.mutate({ id: editingFamily.id, ...data }, {
        onSuccess: () => {
          toast.success('Famille modifiée avec succès');
          handleDialogClose();
        },
        onError: (error) => {
          toast.error('Erreur lors de la modification');
          console.error('Erreur:', error);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Famille ajoutée avec succès');
          handleDialogClose();
        },
        onError: (error) => {
          toast.error('Erreur lors de l\'ajout');
          console.error('Erreur:', error);
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Familles de Produits</CardTitle>
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
          <Button onClick={handleAddFamily}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFamily ? 'Modifier la famille' : 'Ajouter une famille'}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <FormField
                       control={form.control}
                       name="libelle_famille"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Libellé de la famille</FormLabel>
                           <FormControl>
                             <Input placeholder="Ex: Médicaments, Parapharmacie..." {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={form.control}
                       name="description"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Description</FormLabel>
                           <FormControl>
                             <Textarea placeholder="Description de la famille de produits..." {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'En cours...' : (editingFamily ? 'Modifier' : 'Ajouter')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">Erreur lors du chargement des données</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {filteredFamilies.map((family) => (
                 <TableRow key={family.id}>
                   <TableCell>{family.libelle_famille}</TableCell>
                   <TableCell>{family.description || '-'}</TableCell>
                   <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFamily(family)}
                      disabled={updateMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFamily(family.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {filteredFamilies.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                     Aucune famille trouvée
                   </TableCell>
                 </TableRow>
               )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyManager;